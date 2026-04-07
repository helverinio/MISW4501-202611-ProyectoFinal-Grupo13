#!/usr/bin/env bash
set -euo pipefail

TF_DIR="${TF_DIR:-infra/aws/terraform}"
TF_OUTPUTS="${TF_DIR}/tf-outputs.json"
BACKEND_SERVICES_RAW="${BACKEND_SERVICES:-reservas,pagos,ext-payments}"
FRONTEND_APPS_RAW="${FRONTEND_APPS:-web-client,web-admin}"
DEPLOY_ORDER_RAW="${DEPLOY_ORDER:-ext-payments,pagos,reservas}"
GIT_SHA="${GIT_SHA:-latest}"

IFS=',' read -r -a BACKEND_SERVICES <<< "$BACKEND_SERVICES_RAW"
IFS=',' read -r -a FRONTEND_APPS <<< "$FRONTEND_APPS_RAW"
IFS=',' read -r -a DEPLOY_ORDER <<< "$DEPLOY_ORDER_RAW"

terraform_apply_and_capture_outputs() {
  pushd "$TF_DIR" >/dev/null
  terraform init
  terraform apply -lock-timeout=15m -auto-approve
  terraform output -json > tf-outputs.json
  popd >/dev/null
}

login_ecr() {
  local region registry
  region=$(jq -r '.aws_region.value' "$TF_OUTPUTS")
  registry=$(jq -r '.ecr_repositories.value | to_entries[0].value' "$TF_OUTPUTS" | cut -d'/' -f1)
  aws ecr get-login-password --region "$region" | docker login --username AWS --password-stdin "$registry"
}

build_and_push_backends() {
  for service in "${BACKEND_SERVICES[@]}"; do
    local repo path
    repo=$(jq -r --arg s "$service" '.ecr_repositories.value[$s]' "$TF_OUTPUTS")
    path="microservices/${service}"

    if [[ ! -d "$path" ]]; then
      echo "Skipping backend ${service}: path ${path} not found"
      continue
    fi

    echo "Building backend ${service} -> ${repo}:${GIT_SHA}"
    docker build -t "${repo}:${GIT_SHA}" "$path"
    docker tag "${repo}:${GIT_SHA}" "${repo}:latest"
    docker push "${repo}:${GIT_SHA}"
    docker push "${repo}:latest"
  done
}

build_frontends() {
  for app in "${FRONTEND_APPS[@]}"; do
    local path
    path="frontends/${app}"

    if [[ ! -d "$path" ]]; then
      echo "Skipping frontend ${app}: path ${path} not found"
      continue
    fi

    pushd "$path" >/dev/null
    npm ci
    npm run build -- --configuration production
    popd >/dev/null
  done
}

publish_frontends() {
  for app in "${FRONTEND_APPS[@]}"; do
    local bucket dist dist_dir

    bucket=$(jq -r --arg a "$app" '.frontend_buckets.value[$a]' "$TF_OUTPUTS")
    dist=$(jq -r --arg a "$app" '.frontend_cloudfront_distribution_ids.value[$a]' "$TF_OUTPUTS")
    dist_dir=$(find "frontends/${app}/dist" -type d -name browser | head -n 1 || true)

    if [[ -z "$dist_dir" ]]; then
      echo "Skipping publish for ${app}: dist folder not found"
      continue
    fi

    aws s3 sync "${dist_dir}/" "s3://${bucket}/" --delete
    aws cloudfront create-invalidation --distribution-id "$dist" --paths '/*'
  done
}

render_taskdef() {
  local service="$1"
  local image_uri="$2"
  local family="$3"
  local log_group="$4"
  local template output_file

  template="infra/aws/terraform/taskdefs/${service}.json.tpl"
  output_file="/tmp/${service}-taskdef.json"

  if [[ ! -f "$template" ]]; then
    echo "Task definition template not found for ${service}. Skipping deployment."
    return 1
  fi

  python - <<'PY' "$template" "$output_file" "$family" "$EXEC_ROLE_ARN" "$TASK_ROLE_ARN" "$image_uri" "$SECRET_ARN" "$log_group" "$AWS_REGION" "$INTERNAL_ALB_DNS" "$PUBLIC_ALB_DNS" "$REDIS_HOST" "$MQ_HOST" "$MQ_PORT" "$FRONTEND_CORS_ORIGINS"
import pathlib
import sys

(template_path, output_path, family, exec_role, task_role, image_uri, secret_arn,
 log_group, aws_region, internal_alb_dns, public_alb_dns, redis_host, mq_host,
 mq_port, frontend_cors_origins) = sys.argv[1:]

content = pathlib.Path(template_path).read_text()
replacements = {
  "__FAMILY__": family,
  "__EXEC_ROLE_ARN__": exec_role,
  "__TASK_ROLE_ARN__": task_role,
  "__IMAGE_URI__": image_uri,
  "__SECRET_ARN__": secret_arn,
  "__LOG_GROUP__": log_group,
  "__AWS_REGION__": aws_region,
  "__INTERNAL_ALB_DNS__": internal_alb_dns,
  "__PUBLIC_ALB_DNS__": public_alb_dns,
  "__REDIS_HOST__": redis_host,
  "__MQ_HOST__": mq_host,
  "__MQ_PORT__": mq_port,
  "__CORS_ORIGINS__": frontend_cors_origins,
}
for key, value in replacements.items():
  content = content.replace(key, value)
pathlib.Path(output_path).write_text(content)
PY

  echo "$output_file"
}

deploy_backend_service() {
  local service="$1"
  local image_repo family log_group app_name group_name port image_uri taskdef_file taskdef_arn appspec_file deploy_input_file deployment_id status attempts

  image_repo=$(jq -r --arg s "$service" '.ecr_repositories.value[$s]' "$TF_OUTPUTS")
  family=$(jq -r --arg s "$service" '.service_families.value[$s]' "$TF_OUTPUTS")
  log_group=$(jq -r --arg s "$service" '.log_groups.value[$s]' "$TF_OUTPUTS")
  app_name=$(jq -r --arg s "$service" '.codedeploy_apps.value[$s]' "$TF_OUTPUTS")
  group_name=$(jq -r --arg s "$service" '.codedeploy_deployment_groups.value[$s]' "$TF_OUTPUTS")
  port=$(jq -r --arg s "$service" '.service_ports.value[$s]' "$TF_OUTPUTS")
  image_uri="${image_repo}:${GIT_SHA}"

  taskdef_file=$(render_taskdef "$service" "$image_uri" "$family" "$log_group") || return 0
  taskdef_arn=$(aws ecs register-task-definition --cli-input-json "file://${taskdef_file}" --query 'taskDefinition.taskDefinitionArn' --output text)

  appspec_file="/tmp/${service}-appspec.json"
  jq -n --arg taskdef "$taskdef_arn" --arg container "$service" --argjson port "$port" '{version:1,Resources:[{TargetService:{Type:"AWS::ECS::Service",Properties:{TaskDefinition:$taskdef,LoadBalancerInfo:{ContainerName:$container,ContainerPort:$port},PlatformVersion:"LATEST"}}}]}' > "$appspec_file"

  deploy_input_file="/tmp/${service}-deployment.json"
  jq -n --arg app "$app_name" --arg group "$group_name" --arg desc "Deploy ${service} ${GIT_SHA}" --arg content "$(cat "$appspec_file")" '{applicationName:$app,deploymentGroupName:$group,description:$desc,revision:{revisionType:"AppSpecContent",appSpecContent:{content:$content}}}' > "$deploy_input_file"

  deployment_id=$(aws deploy create-deployment --cli-input-json "file://${deploy_input_file}" --query 'deploymentId' --output text)
  echo "Started deployment for ${service}: ${deployment_id}"

  attempts=0
  while true; do
    status=$(aws deploy get-deployment --deployment-id "$deployment_id" --query 'deploymentInfo.status' --output text)
    echo "${service} deployment status: ${status}"

    if [[ "$status" == "Succeeded" ]]; then
      break
    fi

    if [[ "$status" == "Failed" || "$status" == "Stopped" ]]; then
      echo "Deployment for ${service} failed with status ${status}"
      return 1
    fi

    attempts=$((attempts + 1))
    if [[ "$attempts" -ge 80 ]]; then
      echo "Timed out waiting for deployment of ${service}"
      return 1
    fi

    sleep 15
  done
}

deploy_backends() {
  AWS_REGION=$(jq -r '.aws_region.value' "$TF_OUTPUTS")
  EXEC_ROLE_ARN=$(jq -r '.ecs_task_execution_role_arn.value' "$TF_OUTPUTS")
  TASK_ROLE_ARN=$(jq -r '.ecs_task_role_arn.value' "$TF_OUTPUTS")
  SECRET_ARN=$(jq -r '.app_config_secret_arn.value' "$TF_OUTPUTS")
  INTERNAL_ALB_DNS=$(jq -r '.internal_alb_dns_name.value' "$TF_OUTPUTS")
  PUBLIC_ALB_DNS=$(jq -r '.public_alb_dns_name.value' "$TF_OUTPUTS")
  REDIS_HOST=$(jq -r '.redis_primary_endpoint.value' "$TF_OUTPUTS")
  MQ_HOST=$(jq -r '.mq_host.value' "$TF_OUTPUTS")
  MQ_PORT=$(jq -r '.mq_port.value' "$TF_OUTPUTS")
  FRONTEND_CORS_ORIGINS=$(jq -r '.frontend_urls.value | to_entries | map(.value) | join(",")' "$TF_OUTPUTS")

  export AWS_REGION EXEC_ROLE_ARN TASK_ROLE_ARN SECRET_ARN INTERNAL_ALB_DNS PUBLIC_ALB_DNS REDIS_HOST MQ_HOST MQ_PORT FRONTEND_CORS_ORIGINS

  reconcile_listener() {
    local service="$1"
    local cluster_name service_name prod_listener_arn expected_target_group current_target_group

    cluster_name=$(jq -r '.ecs_cluster_name.value' "$TF_OUTPUTS")
    service_name=$(jq -r --arg s "$service" '.ecs_services.value[$s]' "$TF_OUTPUTS")
    prod_listener_arn=$(jq -r --arg s "$service" '.codedeploy_prod_listener_arns.value[$s]' "$TF_OUTPUTS")

    expected_target_group=$(aws ecs describe-services \
      --cluster "$cluster_name" \
      --services "$service_name" \
      --query 'services[0].loadBalancers[0].targetGroupArn' \
      --output text)

    current_target_group=$(aws elbv2 describe-listeners \
      --listener-arns "$prod_listener_arn" \
      --query 'Listeners[0].DefaultActions[0].TargetGroupArn' \
      --output text)

    if [[ -z "$expected_target_group" || "$expected_target_group" == "None" ]]; then
      echo "Could not determine primary target group for ${service}"
      return 1
    fi

    if [[ "$current_target_group" != "$expected_target_group" ]]; then
      echo "Re-aligning prod listener for ${service}"
      aws elbv2 modify-listener \
        --listener-arn "$prod_listener_arn" \
        --default-actions Type=forward,TargetGroupArn="$expected_target_group" >/dev/null
    fi
  }

  for service in "${DEPLOY_ORDER[@]}"; do
    reconcile_listener "$service"
  done

  for service in "${DEPLOY_ORDER[@]}"; do
    deploy_backend_service "$service"
  done
}

terraform_apply_and_capture_outputs
login_ecr
build_and_push_backends
build_frontends
publish_frontends
deploy_backends

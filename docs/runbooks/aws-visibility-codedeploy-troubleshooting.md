# AWS visibility and CodeDeploy troubleshooting

## Context summary

The infrastructure was deployed successfully with CodeDeploy disabled:

- Terraform apply status: success
- Mode used: enable_codedeploy=false
- Region used: us-east-1
- Account used during apply: 501588780134

CodeDeploy in this account currently fails with:

- SubscriptionRequiredException
- Message: The AWS Access Key Id needs a subscription for the service

Example command and result:

```bash
aws deploy list-applications --region us-east-1
# An error occurred (SubscriptionRequiredException)
```

## Why resources may not be visible in AWS Console

Most common causes:

1. Different AWS account than the one used by Terraform
2. Different region selected in Console (must be us-east-1 for most resources)
3. Different IAM user/role with limited visibility permissions
4. Looking only in CodeDeploy (which is not enabled), while other resources were created successfully
5. Console filters hiding resources

## Fast verification checklist

Run these commands in the same terminal profile used for Terraform:

```bash
aws sts get-caller-identity
aws configure list
```

Expected:

- Account should be 501588780134
- Region should be us-east-1

Then list key resources:

```bash
aws ecs list-clusters --region us-east-1
aws elbv2 describe-load-balancers --region us-east-1 --query "LoadBalancers[].LoadBalancerName"
aws cloudfront list-distributions --query "DistributionList.Items[].DomainName"
aws ecr describe-repositories --region us-east-1 --query "repositories[].repositoryName"
aws rds describe-db-instances --region us-east-1 --query "DBInstances[].DBInstanceIdentifier"
aws elasticache describe-cache-clusters --region us-east-1 --show-cache-node-info --query "CacheClusters[].CacheClusterId"
aws mq list-brokers --region us-east-1 --query "BrokerSummaries[].BrokerName"
```

## Why blue-green CodeDeploy is not active now

Blue-green in this project depends on ECS + CodeDeploy resources.

Current account limitation:

- CodeDeploy API calls fail with SubscriptionRequiredException
- Terraform cannot create CodeDeploy applications/deployment groups in this account

Because of that, infrastructure was applied in fallback mode:

- ECS services running
- Autoscaling running
- ALB, CloudFront, RDS, Redis, MQ, ECR running
- CodeDeploy disabled

## How to recover blue-green mode

Once CodeDeploy is enabled in your account:

1. Confirm API access:

```bash
aws deploy list-applications --region us-east-1
```

2. Re-apply Terraform with CodeDeploy enabled:

```bash
terraform apply -var="github_repository=helverinio/MISW4501-202611-ProyectoFinal-Grupo13" -var="enable_codedeploy=true"
```

3. If needed, review lifecycle ignore for deployment_controller in ECS service and align it with final blue-green desired state.

## Practical recommendation

If your course requires strict blue-green evidence:

1. Use an AWS account where CodeDeploy is available
2. Re-run Terraform with enable_codedeploy=true
3. Validate CodeDeploy apps and deployment groups
4. Trigger a deployment from the CI workflow to show real traffic shift

output "aws_region" {
  value = var.aws_region
}

output "github_actions_role_arn" {
  value = aws_iam_role.github_actions.arn
}

output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_task_execution_role_arn" {
  value = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  value = aws_iam_role.ecs_task.arn
}

output "app_config_secret_arn" {
  value = aws_secretsmanager_secret.app_config.arn
}

output "ecr_repositories" {
  value = {
    for name, repo in aws_ecr_repository.services : name => repo.repository_url
  }
}

output "service_families" {
  value = {
    for name, config in local.service_configs : name => config.family
  }
}

output "service_ports" {
  value = {
    for name, config in local.service_configs : name => config.port
  }
}

output "codedeploy_apps" {
  value = {
    for name, app in aws_codedeploy_app.services : name => app.name
  }
}

output "codedeploy_deployment_groups" {
  value = {
    for name, group in aws_codedeploy_deployment_group.services : name => group.deployment_group_name
  }
}

output "log_groups" {
  value = {
    for name, group in aws_cloudwatch_log_group.services : name => group.name
  }
}

output "public_alb_dns_name" {
  value = aws_lb.public.dns_name
}

output "internal_alb_dns_name" {
  value = aws_lb.internal.dns_name
}

output "redis_primary_endpoint" {
  value = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "mq_host" {
  value = local.mq_host
}

output "mq_port" {
  value = local.mq_port
}

output "api_cloudfront_domain_name" {
  value = aws_cloudfront_distribution.api.domain_name
}

output "frontend_buckets" {
  value = {
    for name, bucket in aws_s3_bucket.frontends : name => bucket.bucket
  }
}

output "frontend_cloudfront_distribution_ids" {
  value = {
    for name, dist in aws_cloudfront_distribution.frontends : name => dist.id
  }
}

output "frontend_urls" {
  value = {
    for name, dist in aws_cloudfront_distribution.frontends : name => "https://${dist.domain_name}"
  }
}

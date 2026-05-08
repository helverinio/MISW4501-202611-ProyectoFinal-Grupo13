variable "aws_region" {
  description = "AWS region for the deployment."
  type        = string
  default     = "us-east-2"
}

variable "project_name" {
  description = "Project name used in resource naming."
  type        = string
  default     = "travelhub"
}

variable "environment" {
  description = "Environment name."
  type        = string
  default     = "prod"
}

variable "resource_prefix" {
  description = "Short prefix used for AWS resources with strict name limits."
  type        = string
  default     = "th"
}

variable "github_repository" {
  description = "GitHub repository in owner/repo format for OIDC trust policy."
  type        = string
}

variable "vpc_cidr" {
  description = "VPC CIDR block."
  type        = string
  default     = "10.42.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDRs for public subnets used by ECS tasks and the public ALB."
  type        = list(string)
  default     = ["10.42.1.0/24", "10.42.2.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDRs for private subnets used by RDS, Redis and Amazon MQ."
  type        = list(string)
  default     = ["10.42.11.0/24", "10.42.12.0/24"]
}

variable "availability_zones" {
  description = "Availability zones to use. Must match the subnet count."
  type        = list(string)
  default     = ["us-east-2a", "us-east-2b"]
}

variable "db_name" {
  description = "Shared PostgreSQL database name. Services are isolated by schema."
  type        = string
  default     = "travelhub"
}

variable "db_username" {
  description = "Master username for RDS PostgreSQL."
  type        = string
  default     = "travelhub"
}

variable "db_password" {
  description = "Optional master password for RDS PostgreSQL. If empty, Terraform generates one."
  type        = string
  default     = ""
  sensitive   = true
}

variable "mq_username" {
  description = "Username for Amazon MQ."
  type        = string
  default     = "travelhub"
}

variable "mq_password" {
  description = "Optional password for Amazon MQ. If empty, Terraform generates one."
  type        = string
  default     = ""
  sensitive   = true
}

variable "bootstrap_container_image" {
  description = "Temporary healthy image used by Terraform to bootstrap ECS services before the first CD deployment."
  type        = string
  default     = "hashicorp/http-echo:1.0.0"
}

variable "rds_instance_class" {
  description = "RDS instance size. Smallest burstable class that is reasonable for the academic setup."
  type        = string
  default     = "db.t4g.micro"
}

variable "redis_node_type" {
  description = "ElastiCache node type."
  type        = string
  default     = "cache.t4g.micro"
}

variable "mq_instance_type" {
  description = "Amazon MQ broker instance type."
  type        = string
  default     = "mq.t3.micro"
}

variable "frontend_price_class" {
  description = "CloudFront price class to reduce costs."
  type        = string
  default     = "PriceClass_100"
}

variable "enable_codedeploy" {
  description = "Enable ECS blue/green through AWS CodeDeploy. Set to false if your account cannot use CodeDeploy."
  type        = bool
  default     = true
}

variable "enable_aws_native_cicd" {
  description = "Create an AWS-native CI/CD pipeline with CodePipeline + CodeBuild."
  type        = bool
  default     = false
}

variable "cicd_main_branch" {
  description = "Main branch that triggers deployments after merge."
  type        = string
  default     = "main"
}

variable "github_connection_arn" {
  description = "Existing CodeStar/CodeConnections ARN for GitHub. Leave empty to let Terraform create one."
  type        = string
  default     = ""
}

variable "backend_services" {
  description = "Backend services that are built and pushed to ECR by the AWS native pipeline."
  type        = list(string)
  default     = ["reservas", "pagos", "ext-payments"]
}

variable "frontend_apps" {
  description = "Frontend apps that are built and published to S3 + CloudFront by the AWS native pipeline."
  type        = list(string)
  default     = ["web-client", "web-admin"]
}

variable "deployment_order" {
  description = "CodeDeploy order for backend services. Keep dependencies first."
  type        = list(string)
  default     = ["ext-payments", "pagos", "reservas"]
}

variable "emailjs_service_id" {
  description = "EmailJS service ID used by the usuarios microservice."
  type        = string
  default     = ""
}

variable "emailjs_public_key" {
  description = "EmailJS public (user) key."
  type        = string
  default     = ""
}

variable "emailjs_private_key" {
  description = "EmailJS private key (accessToken)."
  type        = string
  default     = ""
  sensitive   = true
}

variable "emailjs_verification_template_id" {
  description = "EmailJS template ID for the email-verification flow."
  type        = string
  default     = ""
}

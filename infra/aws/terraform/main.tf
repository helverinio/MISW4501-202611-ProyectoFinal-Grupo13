locals {
  name_prefix = "${var.resource_prefix}-${var.environment}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
    Repository  = var.github_repository
  }

  service_configs = {
    gateway = {
      port          = 8080
      cpu           = 512
      memory        = 1024
      desired_count = 2
      max_count     = 4
      public        = true
      prod_port     = 80
      test_port     = 8088
      family        = "${local.name_prefix}-gateway"
    }
    reservas = {
      port          = 5000
      cpu           = 512
      memory        = 1024
      desired_count = 1
      max_count     = 2
      public        = false
      prod_port     = 5000
      test_port     = 15000
      family        = "${local.name_prefix}-reservas"
    }
    pagos = {
      port          = 5002
      cpu           = 512
      memory        = 1024
      desired_count = 1
      max_count     = 2
      public        = false
      prod_port     = 5002
      test_port     = 15002
      family        = "${local.name_prefix}-pagos"
    }
    "ext-payments" = {
      port          = 5001
      cpu           = 256
      memory        = 512
      desired_count = 1
      max_count     = 2
      public        = false
      prod_port     = 5001
      test_port     = 15001
      family        = "${local.name_prefix}-ext-payments"
    }
  }

  frontend_configs = {
    "web-client" = {}
    "web-admin"  = {}
  }
}

resource "random_password" "db" {
  length  = 24
  special = false
}

resource "random_password" "mq" {
  length  = 24
  special = false
}

resource "random_password" "secret_key" {
  length  = 32
  special = false
}

locals {
  effective_db_password = var.db_password != "" ? var.db_password : random_password.db.result
  effective_mq_password = var.mq_password != "" ? var.mq_password : random_password.mq.result
}

resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpc"
  })
}

resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-igw"
  })
}

resource "aws_subnet" "public" {
  for_each = {
    for index, cidr in var.public_subnet_cidrs : index => {
      cidr = cidr
      az   = var.availability_zones[index]
    }
  }

  vpc_id                  = aws_vpc.main.id
  cidr_block              = each.value.cidr
  availability_zone       = each.value.az
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-${each.key}"
    Tier = "public"
  })
}

resource "aws_subnet" "private" {
  for_each = {
    for index, cidr in var.private_subnet_cidrs : index => {
      cidr = cidr
      az   = var.availability_zones[index]
    }
  }

  vpc_id            = aws_vpc.main.id
  cidr_block        = each.value.cidr
  availability_zone = each.value.az

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-private-${each.key}"
    Tier = "private"
  })
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-rt"
  })
}

resource "aws_route_table_association" "public" {
  for_each = {
    for index, _cidr in var.public_subnet_cidrs : index => true
  }

  subnet_id      = aws_subnet.public[each.key].id
  route_table_id = aws_route_table.public.id
}

resource "aws_security_group" "public_alb" {
  name        = "${local.name_prefix}-public-alb-sg"
  description = "Ingress for the public gateway ALB"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8088
    to_port     = 8088
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-public-alb-sg"
  })
}

resource "aws_security_group" "internal_alb" {
  name        = "${local.name_prefix}-internal-alb-sg"
  description = "Ingress for the private services ALB"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-internal-alb-sg"
  })
}

resource "aws_security_group" "ecs_tasks" {
  name        = "${local.name_prefix}-ecs-tasks-sg"
  description = "Security group for ECS Fargate tasks"
  vpc_id      = aws_vpc.main.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-tasks-sg"
  })
}

resource "aws_vpc_security_group_ingress_rule" "ecs_tasks_from_public_alb_8080" {
  security_group_id            = aws_security_group.ecs_tasks.id
  referenced_security_group_id = aws_security_group.public_alb.id
  from_port                    = 8080
  to_port                      = 8080
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "ecs_tasks_from_internal_alb_5000_5002" {
  security_group_id            = aws_security_group.ecs_tasks.id
  referenced_security_group_id = aws_security_group.internal_alb.id
  from_port                    = 5000
  to_port                      = 5002
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "internal_alb_from_ecs_tasks_5000_5002" {
  security_group_id            = aws_security_group.internal_alb.id
  referenced_security_group_id = aws_security_group.ecs_tasks.id
  from_port                    = 5000
  to_port                      = 5002
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "internal_alb_from_ecs_tasks_15000_15002" {
  security_group_id            = aws_security_group.internal_alb.id
  referenced_security_group_id = aws_security_group.ecs_tasks.id
  from_port                    = 15000
  to_port                      = 15002
  ip_protocol                  = "tcp"
}

resource "aws_security_group" "rds" {
  name        = "${local.name_prefix}-rds-sg"
  description = "Allow PostgreSQL from ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-sg"
  })
}

resource "aws_security_group" "redis" {
  name        = "${local.name_prefix}-redis-sg"
  description = "Allow Redis from ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-sg"
  })
}

resource "aws_security_group" "mq" {
  name        = "${local.name_prefix}-mq-sg"
  description = "Allow secure STOMP from ECS tasks"
  vpc_id      = aws_vpc.main.id

  ingress {
    from_port       = 61617
    to_port         = 61617
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_tasks.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-mq-sg"
  })
}

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnets"
  subnet_ids = values(aws_subnet.private)[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnets"
  })
}

resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name_prefix}-redis-subnets"
  subnet_ids = values(aws_subnet.private)[*].id
}

resource "aws_db_instance" "postgres" {
  identifier                 = "${local.name_prefix}-postgres"
  engine                     = "postgres"
  engine_version             = "15.8"
  instance_class             = var.rds_instance_class
  allocated_storage          = 20
  max_allocated_storage      = 100
  db_name                    = var.db_name
  username                   = var.db_username
  password                   = local.effective_db_password
  db_subnet_group_name       = aws_db_subnet_group.main.name
  vpc_security_group_ids     = [aws_security_group.rds.id]
  publicly_accessible        = false
  skip_final_snapshot        = true
  deletion_protection        = false
  backup_retention_period    = 1
  auto_minor_version_upgrade = true
  storage_encrypted          = true

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-postgres"
  })
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${local.name_prefix}-redis"
  engine               = "redis"
  engine_version       = "7.1"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  port                 = 6379
  parameter_group_name = "default.redis7"
  subnet_group_name    = aws_elasticache_subnet_group.main.name
  security_group_ids   = [aws_security_group.redis.id]
  apply_immediately    = true

  tags = local.common_tags
}

resource "aws_mq_broker" "main" {
  broker_name                = "${local.name_prefix}-mq"
  engine_type                = "ActiveMQ"
  engine_version             = "5.18"
  host_instance_type         = var.mq_instance_type
  deployment_mode            = "SINGLE_INSTANCE"
  publicly_accessible        = false
  auto_minor_version_upgrade = true
  subnet_ids                 = [values(aws_subnet.private)[0].id]
  security_groups            = [aws_security_group.mq.id]

  user {
    username = var.mq_username
    password = local.effective_mq_password
  }

  logs {
    general = true
  }

  tags = local.common_tags
}

locals {
  mq_endpoint          = trimprefix(aws_mq_broker.main.instances[0].endpoints[0], "ssl://")
  mq_host              = split(":", local.mq_endpoint)[0]
  mq_port              = tonumber(split(":", local.mq_endpoint)[1])
  public_alb_base_url  = "http://${aws_lb.public.dns_name}"
  api_public_url       = "https://${aws_cloudfront_distribution.api.domain_name}"
  internal_service_urls = {
    reservas      = "http://${aws_lb.internal.dns_name}:${local.service_configs["reservas"].prod_port}"
    pagos         = "http://${aws_lb.internal.dns_name}:${local.service_configs["pagos"].prod_port}"
    "ext-payments" = "http://${aws_lb.internal.dns_name}:${local.service_configs["ext-payments"].prod_port}"
  }
}

resource "aws_secretsmanager_secret" "app_config" {
  name = "${local.name_prefix}/app-config"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "app_config" {
  secret_id = aws_secretsmanager_secret.app_config.id

  secret_string = jsonencode({
    secret_key               = random_password.secret_key.result
    mq_username              = var.mq_username
    mq_password              = local.effective_mq_password
    reservas_database_url    = "postgresql://${var.db_username}:${local.effective_db_password}@${aws_db_instance.postgres.address}:5432/${var.db_name}?options=${urlencode("-csearch_path=reservas")}" 
    pagos_database_url       = "postgresql://${var.db_username}:${local.effective_db_password}@${aws_db_instance.postgres.address}:5432/${var.db_name}?options=${urlencode("-csearch_path=pagos")}" 
    ext_payments_database_url = "postgresql://${var.db_username}:${local.effective_db_password}@${aws_db_instance.postgres.address}:5432/${var.db_name}?options=${urlencode("-csearch_path=ext_payments")}" 
    public_api_url           = local.api_public_url
    public_alb_base_url      = local.public_alb_base_url
  })
}

resource "aws_cloudwatch_log_group" "services" {
  for_each = local.service_configs

  name              = "/ecs/${local.name_prefix}/${each.key}"
  retention_in_days = 14

  tags = local.common_tags
}

resource "aws_ecr_repository" "services" {
  for_each = local.service_configs

  name                 = "${local.name_prefix}/${each.key}"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  tags = local.common_tags
}

resource "aws_ecr_lifecycle_policy" "services" {
  for_each   = local.service_configs
  repository = aws_ecr_repository.services[each.key].name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep only the latest 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}

resource "aws_lb" "public" {
  name               = "${local.name_prefix}-public"
  internal           = false
  load_balancer_type = "application"
  subnets            = values(aws_subnet.public)[*].id
  security_groups    = [aws_security_group.public_alb.id]

  tags = local.common_tags
}

resource "aws_lb" "internal" {
  name               = "${local.name_prefix}-internal"
  internal           = true
  load_balancer_type = "application"
  subnets            = values(aws_subnet.private)[*].id
  security_groups    = [aws_security_group.internal_alb.id]

  tags = local.common_tags
}

resource "aws_lb_target_group" "blue" {
  for_each = local.service_configs

  name        = substr("${var.resource_prefix}-${each.key}-blue", 0, 32)
  port        = each.value.port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200-399"
    path                = "/health"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = local.common_tags
}

resource "aws_lb_target_group" "green" {
  for_each = local.service_configs

  name        = substr("${var.resource_prefix}-${each.key}-green", 0, 32)
  port        = each.value.port
  protocol    = "HTTP"
  target_type = "ip"
  vpc_id      = aws_vpc.main.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    interval            = 30
    matcher             = "200-399"
    path                = "/health"
    protocol            = "HTTP"
    timeout             = 5
    unhealthy_threshold = 3
  }

  tags = local.common_tags
}

resource "aws_lb_listener" "public_prod" {
  load_balancer_arn = aws_lb.public.arn
  port              = local.service_configs.gateway.prod_port
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue["gateway"].arn
  }
}

resource "aws_lb_listener" "public_test" {
  load_balancer_arn = aws_lb.public.arn
  port              = local.service_configs.gateway.test_port
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.green["gateway"].arn
  }
}

resource "aws_lb_listener" "internal_prod" {
  for_each = {
    for key, value in local.service_configs : key => value if key != "gateway"
  }

  load_balancer_arn = aws_lb.internal.arn
  port              = each.value.prod_port
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.blue[each.key].arn
  }
}

resource "aws_lb_listener" "internal_test" {
  for_each = {
    for key, value in local.service_configs : key => value if key != "gateway"
  }

  load_balancer_arn = aws_lb.internal.arn
  port              = each.value.test_port
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.green[each.key].arn
  }
}

resource "aws_ecs_cluster" "main" {
  name = "${local.name_prefix}-ecs"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = local.common_tags
}

resource "aws_ecs_task_definition" "bootstrap" {
  for_each = local.service_configs

  family                   = each.value.family
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(each.value.cpu)
  memory                   = tostring(each.value.memory)
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = each.key
      image     = var.bootstrap_container_image
      essential = true
      command   = ["-listen", format(":%d", each.value.port), "-text", format("%s bootstrap", each.key)]
      portMappings = [
        {
          containerPort = each.value.port
          hostPort      = each.value.port
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.services[each.key].name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = each.key
        }
      }
    }
  ])

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  tags = local.common_tags
}

resource "aws_ecs_service" "services" {
  for_each = local.service_configs

  name            = "${local.name_prefix}-${each.key}"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.bootstrap[each.key].arn
  desired_count   = each.value.desired_count
  launch_type     = "FARGATE"

  health_check_grace_period_seconds = 60
  enable_execute_command            = true

  deployment_controller {
    type = var.enable_codedeploy ? "CODE_DEPLOY" : "ECS"
  }

  network_configuration {
    subnets          = values(aws_subnet.public)[*].id
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.blue[each.key].arn
    container_name   = each.key
    container_port   = each.value.port
  }

  lifecycle {
    ignore_changes = [
      desired_count,
      load_balancer,
      task_definition,
      deployment_controller,
    ]
  }

  depends_on = [
    aws_lb_listener.public_prod,
    aws_lb_listener.public_test,
    aws_lb_listener.internal_prod,
    aws_lb_listener.internal_test,
  ]

  tags = local.common_tags
}

resource "aws_appautoscaling_target" "services" {
  for_each = local.service_configs

  max_capacity       = each.value.max_count
  min_capacity       = each.value.desired_count
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.services[each.key].name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "services_cpu" {
  for_each = local.service_configs

  name               = "${local.name_prefix}-${each.key}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.services[each.key].resource_id
  scalable_dimension = aws_appautoscaling_target.services[each.key].scalable_dimension
  service_namespace  = aws_appautoscaling_target.services[each.key].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }

    target_value       = 60
    scale_in_cooldown  = 120
    scale_out_cooldown = 60
  }
}

resource "aws_s3_bucket" "frontends" {
  for_each = local.frontend_configs

  bucket        = "${local.name_prefix}-${each.key}-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "frontends" {
  for_each = local.frontend_configs

  bucket                  = aws_s3_bucket.frontends[each.key].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_cloudfront_origin_access_control" "frontends" {
  for_each = local.frontend_configs

  name                              = "${local.name_prefix}-${each.key}-oac"
  description                       = "OAC for ${each.key} frontend bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontends" {
  for_each = local.frontend_configs

  enabled             = true
  default_root_object = "index.html"
  price_class         = var.frontend_price_class

  origin {
    domain_name              = aws_s3_bucket.frontends[each.key].bucket_regional_domain_name
    origin_id                = each.key
    origin_access_control_id = aws_cloudfront_origin_access_control.frontends[each.key].id
  }

  default_cache_behavior {
    target_origin_id       = each.key
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true

    forwarded_values {
      query_string = true
      cookies {
        forward = "none"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  custom_error_response {
    error_code         = 403
    response_code      = 200
    response_page_path = "/index.html"
  }

  custom_error_response {
    error_code         = 404
    response_code      = 200
    response_page_path = "/index.html"
  }

  tags = local.common_tags
}

resource "aws_s3_bucket_policy" "frontends" {
  for_each = local.frontend_configs

  bucket = aws_s3_bucket.frontends[each.key].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontRead"
        Effect    = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action   = ["s3:GetObject"]
        Resource = "${aws_s3_bucket.frontends[each.key].arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.frontends[each.key].arn
          }
        }
      }
    ]
  })
}

resource "aws_cloudfront_distribution" "api" {
  enabled     = true
  price_class = var.frontend_price_class

  origin {
    domain_name = aws_lb.public.dns_name
    origin_id   = "gateway-alb"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    target_origin_id       = "gateway-alb"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0

    forwarded_values {
      query_string = true
      headers      = ["*"]
      cookies {
        forward = "all"
      }
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = local.common_tags
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "${local.name_prefix}-ecs-exec-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "ecs_task_execution_secrets" {
  name = "${local.name_prefix}-ecs-exec-secrets"
  role = aws_iam_role.ecs_task_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "kms:Decrypt"
        ]
        Resource = [
          aws_secretsmanager_secret.app_config.arn,
          "*"
        ]
      }
    ]
  })
}

resource "aws_iam_role" "ecs_task" {
  name = "${local.name_prefix}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role" "codedeploy" {
  count = var.enable_codedeploy ? 1 : 0

  name = "${local.name_prefix}-codedeploy-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codedeploy.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "codedeploy_ecs" {
  count = var.enable_codedeploy ? 1 : 0

  role       = aws_iam_role.codedeploy[0].name
  policy_arn = "arn:aws:iam::aws:policy/AWSCodeDeployRoleForECS"
}

resource "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"

  client_id_list = ["sts.amazonaws.com"]

  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1"
  ]

  tags = local.common_tags
}

resource "aws_iam_role" "github_actions" {
  name = "${local.name_prefix}-github-actions-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Federated = aws_iam_openid_connect_provider.github.arn
        }
        Action = "sts:AssumeRoleWithWebIdentity"
        Condition = {
          StringEquals = {
            "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
          }
          StringLike = {
            "token.actions.githubusercontent.com:sub" = "repo:${var.github_repository}:*"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "github_actions_admin" {
  role       = aws_iam_role.github_actions.name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_codedeploy_app" "services" {
  for_each         = var.enable_codedeploy ? local.service_configs : {}
  compute_platform = "ECS"
  name             = "${local.name_prefix}-${each.key}"
}

resource "aws_codedeploy_deployment_group" "services" {
  for_each = var.enable_codedeploy ? local.service_configs : {}

  app_name               = aws_codedeploy_app.services[each.key].name
  deployment_group_name  = "${local.name_prefix}-${each.key}"
  service_role_arn       = aws_iam_role.codedeploy[0].arn
  deployment_config_name = "CodeDeployDefault.ECSAllAtOnce"

  deployment_style {
    deployment_option = "WITH_TRAFFIC_CONTROL"
    deployment_type   = "BLUE_GREEN"
  }

  auto_rollback_configuration {
    enabled = true
    events  = ["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM", "DEPLOYMENT_STOP_ON_REQUEST"]
  }

  blue_green_deployment_config {
    deployment_ready_option {
      action_on_timeout = "CONTINUE_DEPLOYMENT"
    }

    terminate_blue_instances_on_deployment_success {
      action                           = "TERMINATE"
      termination_wait_time_in_minutes = 0
    }
  }

  ecs_service {
    cluster_name = aws_ecs_cluster.main.name
    service_name = aws_ecs_service.services[each.key].name
  }

  load_balancer_info {
    target_group_pair_info {
      prod_traffic_route {
        listener_arns = [
          each.key == "gateway" ? aws_lb_listener.public_prod.arn : aws_lb_listener.internal_prod[each.key].arn
        ]
      }

      test_traffic_route {
        listener_arns = [
          each.key == "gateway" ? aws_lb_listener.public_test.arn : aws_lb_listener.internal_test[each.key].arn
        ]
      }

      target_group {
        name = aws_lb_target_group.blue[each.key].name
      }

      target_group {
        name = aws_lb_target_group.green[each.key].name
      }
    }
  }

  tags = local.common_tags
}

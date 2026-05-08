locals {
  create_github_connection   = var.enable_aws_native_cicd && var.github_connection_arn == ""
  cicd_github_connection_arn = var.github_connection_arn != "" ? var.github_connection_arn : try(aws_codestarconnections_connection.github[0].arn, "")
}

resource "aws_codestarconnections_connection" "github" {
  count = local.create_github_connection ? 1 : 0

  name          = "${local.name_prefix}-github-connection"
  provider_type = "GitHub"

  tags = local.common_tags
}

resource "aws_s3_bucket" "cicd_artifacts" {
  count = var.enable_aws_native_cicd ? 1 : 0

  bucket        = "${local.name_prefix}-cicd-artifacts-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = local.common_tags
}

resource "aws_s3_bucket_versioning" "cicd_artifacts" {
  count = var.enable_aws_native_cicd ? 1 : 0

  bucket = aws_s3_bucket.cicd_artifacts[0].id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cicd_artifacts" {
  count = var.enable_aws_native_cicd ? 1 : 0

  bucket = aws_s3_bucket.cicd_artifacts[0].id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cicd_artifacts" {
  count = var.enable_aws_native_cicd ? 1 : 0

  bucket                  = aws_s3_bucket.cicd_artifacts[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_iam_role" "codebuild" {
  count = var.enable_aws_native_cicd ? 1 : 0

  name = "${local.name_prefix}-codebuild-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codebuild.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "codebuild_admin" {
  count = var.enable_aws_native_cicd ? 1 : 0

  role       = aws_iam_role.codebuild[0].name
  policy_arn = "arn:aws:iam::aws:policy/AdministratorAccess"
}

resource "aws_iam_role" "codepipeline" {
  count = var.enable_aws_native_cicd ? 1 : 0

  name = "${local.name_prefix}-codepipeline-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "codepipeline.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "codepipeline" {
  count = var.enable_aws_native_cicd ? 1 : 0

  name = "${local.name_prefix}-codepipeline-policy"
  role = aws_iam_role.codepipeline[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "codestar-connections:UseConnection"
        ]
        Resource = local.cicd_github_connection_arn
      },
      {
        Effect = "Allow"
        Action = [
          "codebuild:BatchGetBuilds",
          "codebuild:StartBuild"
        ]
        Resource = aws_codebuild_project.main[0].arn
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:PutObject"
        ]
        Resource = [
          aws_s3_bucket.cicd_artifacts[0].arn,
          "${aws_s3_bucket.cicd_artifacts[0].arn}/*"
        ]
      }
    ]
  })
}

resource "aws_codebuild_project" "main" {
  count = var.enable_aws_native_cicd ? 1 : 0

  name          = "${local.name_prefix}-main-cd"
  service_role  = aws_iam_role.codebuild[0].arn
  build_timeout = 120

  artifacts {
    type = "CODEPIPELINE"
  }

  environment {
    compute_type                = "BUILD_GENERAL1_MEDIUM"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    privileged_mode             = true
    image_pull_credentials_type = "CODEBUILD"

    environment_variable {
      name  = "AWS_REGION"
      value = var.aws_region
    }

    environment_variable {
      name  = "TF_DIR"
      value = "infra/aws/terraform"
    }

    environment_variable {
      name  = "TF_VAR_github_repository"
      value = var.github_repository
    }

    environment_variable {
      name  = "BACKEND_SERVICES"
      value = join(",", var.backend_services)
    }

    environment_variable {
      name  = "FRONTEND_APPS"
      value = join(",", var.frontend_apps)
    }

    environment_variable {
      name  = "DEPLOY_ORDER"
      value = join(",", var.deployment_order)
    }

    environment_variable {
      name  = "EMAILJS_SERVICE_ID"
      value = var.emailjs_service_id
    }

    environment_variable {
      name  = "EMAILJS_PUBLIC_KEY"
      value = var.emailjs_public_key
    }

    environment_variable {
      name  = "EMAILJS_PRIVATE_KEY"
      value = var.emailjs_private_key
      type  = "PLAINTEXT"
    }

    environment_variable {
      name  = "EMAILJS_VERIFICATION_TEMPLATE_ID"
      value = var.emailjs_verification_template_id
    }
  }

  logs_config {
    cloudwatch_logs {
      group_name  = "/codebuild/${local.name_prefix}-main-cd"
      stream_name = "build"
    }
  }

  source {
    type      = "CODEPIPELINE"
    buildspec = "infra/aws/codebuild/buildspec-cd.yml"
  }

  tags = local.common_tags
}

resource "aws_codepipeline" "main" {
  count = var.enable_aws_native_cicd ? 1 : 0

  name          = "${local.name_prefix}-main-cd"
  role_arn      = aws_iam_role.codepipeline[0].arn
  pipeline_type = "V2"

  artifact_store {
    location = aws_s3_bucket.cicd_artifacts[0].bucket
    type     = "S3"
  }

  stage {
    name = "Source"

    action {
      name             = "Source"
      category         = "Source"
      owner            = "AWS"
      provider         = "CodeStarSourceConnection"
      version          = "1"
      output_artifacts = ["source_output"]

      configuration = {
        ConnectionArn    = local.cicd_github_connection_arn
        FullRepositoryId = var.github_repository
        BranchName       = var.cicd_main_branch
        DetectChanges    = "true"
      }
    }
  }

  stage {
    name = "Deploy"

    action {
      name            = "BuildAndDeploy"
      category        = "Build"
      owner           = "AWS"
      provider        = "CodeBuild"
      input_artifacts = ["source_output"]
      version         = "1"

      configuration = {
        ProjectName = aws_codebuild_project.main[0].name
      }
    }
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy.codepipeline,
    aws_iam_role_policy_attachment.codebuild_admin,
  ]
}

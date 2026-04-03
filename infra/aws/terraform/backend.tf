terraform {
  # Backend settings are injected by terraform init -backend-config in CI/local.
  backend "s3" {}
}

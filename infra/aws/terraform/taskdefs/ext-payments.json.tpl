{
  "family": "__FAMILY__",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "__EXEC_ROLE_ARN__",
  "taskRoleArn": "__TASK_ROLE_ARN__",
  "runtimePlatform": {
    "operatingSystemFamily": "LINUX",
    "cpuArchitecture": "X86_64"
  },
  "containerDefinitions": [
    {
      "name": "ext-payments",
      "image": "__IMAGE_URI__",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 5001,
          "hostPort": 5001,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "FLASK_ENV", "value": "production" },
        { "name": "DB_SCHEMA", "value": "ext_payments" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "__SECRET_ARN__:ext_payments_database_url::" },
        { "name": "SECRET_KEY", "valueFrom": "__SECRET_ARN__:secret_key::" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "__LOG_GROUP__",
          "awslogs-region": "__AWS_REGION__",
          "awslogs-stream-prefix": "ext-payments"
        }
      }
    }
  ]
}

{
  "family": "__FAMILY__",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "__EXEC_ROLE_ARN__",
  "taskRoleArn": "__TASK_ROLE_ARN__",
  "runtimePlatform": {
    "operatingSystemFamily": "LINUX",
    "cpuArchitecture": "X86_64"
  },
  "containerDefinitions": [
    {
      "name": "pagos",
      "image": "__IMAGE_URI__",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 5002,
          "hostPort": 5002,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "FLASK_ENV", "value": "production" },
        { "name": "EXT_PAYMENTS_URL", "value": "http://__PUBLIC_ALB_DNS__/ext-payments" },
        { "name": "PAGOS_WEBHOOK_URL", "value": "http://__PUBLIC_ALB_DNS__" },
        { "name": "MQ_HOST", "value": "__MQ_HOST__" },
        { "name": "MQ_PORT", "value": "__MQ_PORT__" },
        { "name": "MQ_USE_SSL", "value": "true" },
        { "name": "MQ_MAX_RETRIES", "value": "3" },
        { "name": "MQ_DLQ_TOPIC", "value": "/topic/PaymentStatusUpdated.DLQ" },
        { "name": "ABANDONMENT_CHECK_INTERVAL", "value": "60" },
        { "name": "ABANDONMENT_STALE_MINUTES", "value": "20" },
        { "name": "DB_SCHEMA", "value": "pagos" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "__SECRET_ARN__:pagos_database_url::" },
        { "name": "MQ_USERNAME", "valueFrom": "__SECRET_ARN__:mq_username::" },
        { "name": "MQ_PASSWORD", "valueFrom": "__SECRET_ARN__:mq_password::" },
        { "name": "SECRET_KEY", "valueFrom": "__SECRET_ARN__:secret_key::" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "__LOG_GROUP__",
          "awslogs-region": "__AWS_REGION__",
          "awslogs-stream-prefix": "pagos"
        }
      }
    }
  ]
}

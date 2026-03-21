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
      "name": "reservas",
      "image": "__IMAGE_URI__",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 5000,
          "hostPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "FLASK_ENV", "value": "production" },
        { "name": "PAGOS_SERVICE_URL", "value": "http://__INTERNAL_ALB_DNS__:5002" },
        { "name": "REDIS_HOST", "value": "__REDIS_HOST__" },
        { "name": "REDIS_PORT", "value": "6379" },
        { "name": "REDIS_LOCK_TIMEOUT_SECONDS", "value": "30" },
        { "name": "REDIS_LOCK_RETRY_TIMES", "value": "1" },
        { "name": "REDIS_LOCK_RETRY_DELAY_MS", "value": "50" },
        { "name": "MQ_HOST", "value": "__MQ_HOST__" },
        { "name": "MQ_PORT", "value": "__MQ_PORT__" },
        { "name": "MQ_USE_SSL", "value": "true" },
        { "name": "MQ_MAX_RETRIES", "value": "3" },
        { "name": "MQ_DLQ_TOPIC", "value": "/topic/PaymentStatusUpdated.DLQ" },
        { "name": "DB_SCHEMA", "value": "reservas" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "__SECRET_ARN__:reservas_database_url::" },
        { "name": "MQ_USERNAME", "valueFrom": "__SECRET_ARN__:mq_username::" },
        { "name": "MQ_PASSWORD", "valueFrom": "__SECRET_ARN__:mq_password::" },
        { "name": "SECRET_KEY", "valueFrom": "__SECRET_ARN__:secret_key::" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "__LOG_GROUP__",
          "awslogs-region": "__AWS_REGION__",
          "awslogs-stream-prefix": "reservas"
        }
      }
    }
  ]
}

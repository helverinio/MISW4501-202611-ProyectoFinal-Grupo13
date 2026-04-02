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
      "name": "usuarios",
      "image": "__IMAGE_URI__",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 5003,
          "hostPort": 5003,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "FLASK_ENV", "value": "production" },
        { "name": "DB_SCHEMA", "value": "usuarios" }
      ],
      "secrets": [
        { "name": "DATABASE_URL", "valueFrom": "__SECRET_ARN__:usuarios_database_url::" },
        { "name": "SECRET_KEY", "valueFrom": "__SECRET_ARN__:secret_key::" },
        { "name": "JWT_SECRET_KEY", "valueFrom": "__SECRET_ARN__:secret_key::" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "__LOG_GROUP__",
          "awslogs-region": "__AWS_REGION__",
          "awslogs-stream-prefix": "usuarios"
        }
      }
    }
  ]
}

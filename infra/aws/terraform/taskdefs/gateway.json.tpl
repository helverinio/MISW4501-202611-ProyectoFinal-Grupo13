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
      "name": "gateway",
      "image": "__IMAGE_URI__",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 8080,
          "hostPort": 8080,
          "protocol": "tcp"
        }
      ],
      "environment": [
        { "name": "FLASK_ENV", "value": "production" },
        { "name": "RESERVAS_SERVICE_URL", "value": "http://__INTERNAL_ALB_DNS__:5000" },
        { "name": "PAGOS_SERVICE_URL", "value": "http://__INTERNAL_ALB_DNS__:5002" },
        { "name": "USUARIOS_SERVICE_URL", "value": "http://__INTERNAL_ALB_DNS__:5003" },
        { "name": "CORS_ORIGINS", "value": "__CORS_ORIGINS__" }
      ],
      "secrets": [
        { "name": "SECRET_KEY", "valueFrom": "__SECRET_ARN__:secret_key::" }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "__LOG_GROUP__",
          "awslogs-region": "__AWS_REGION__",
          "awslogs-stream-prefix": "gateway"
        }
      }
    }
  ]
}

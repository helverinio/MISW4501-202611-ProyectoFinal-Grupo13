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
        { "name": "DB_SCHEMA", "value": "usuarios" },
        { "name": "EMAILJS_ENABLED", "value": "true" },
        { "name": "EMAILJS_ENDPOINT", "value": "https://api.emailjs.com/api/v1.0/email/send" },
        { "name": "EMAILJS_SERVICE_ID", "value": "__EMAILJS_SERVICE_ID__" },
        { "name": "EMAILJS_PUBLIC_KEY", "value": "__EMAILJS_PUBLIC_KEY__" },
        { "name": "EMAILJS_PRIVATE_KEY", "value": "__EMAILJS_PRIVATE_KEY__" },
        { "name": "EMAILJS_VERIFICATION_TEMPLATE_ID", "value": "__EMAILJS_TEMPLATE_ID__" },
        { "name": "EMAILJS_ALLOWED_ORIGIN", "value": "__WEBCLIENT_URL__" },
        { "name": "EMAIL_VERIFICATION_LINK_BASE_URL", "value": "__WEBCLIENT_URL__/verify-email" }
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

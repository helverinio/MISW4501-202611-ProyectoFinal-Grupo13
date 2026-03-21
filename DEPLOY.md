Cuenta activa: 501588780134
Región activa: us-east-1
ECS cluster: th-prod-ecs
ECS services:
th-prod-gateway
th-prod-reservas
th-prod-pagos
th-prod-ext-payments
Load balancers:
th-prod-public
th-prod-internal
RDS: th-prod-postgres
ECR repos:
th-prod/gateway
th-prod/reservas
th-prod/pagos
th-prod/ext-payments
CloudFront: 3 distribuciones creadas

URLs y datos importantes:

API CloudFront:
https://d3gyvlo5yte09d.cloudfront.net
Frontend web-client:
https://d1v3xdjitwe930.cloudfront.net
Frontend web-admin:
https://dgg39noo0o6k5.cloudfront.net
ECS cluster:
th-prod-ecs
Rol para GitHub Actions:

Redis (ElastiCache):
th-prod-redis
estado: available
endpoint: th-prod-redis.os48zx.0001.use1.cache.amazonaws.com
Amazon MQ:
th-prod-mq
estado: RUNNING
broker id: b-a2e9d545-8c8f-4bff-b3c3-ed6cb1d295bb

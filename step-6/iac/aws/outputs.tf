# -----------------------------------------------------------------------------
# VPC networking
# -----------------------------------------------------------------------------

output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.main.id
}

# -----------------------------------------------------------------------------
# ECR
# -----------------------------------------------------------------------------

output "ecr_backend_repository_url" {
  description = "ECR backend repository URL for docker push"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecr_backend_db_migrate_repository_url" {
  description = "ECR backend-db-migrate repository URL for docker push"
  value       = aws_ecr_repository.backend_db_migrate.repository_url
}

output "ecr_backend_db_push_repository_url" {
  description = "ECR backend-db-push repository URL for docker push"
  value       = aws_ecr_repository.backend_db_push.repository_url
}

output "ecr_web_repository_url" {
  description = "ECR web repository URL for docker push"
  value       = aws_ecr_repository.web.repository_url
}

# -----------------------------------------------------------------------------
# ECS Express services
# -----------------------------------------------------------------------------

output "backend_url" {
  description = "Backend ECS Express service URL"
  value       = aws_ecs_express_gateway_service.backend.ingress_paths[0].endpoint
}

output "web_url" {
  description = "Web ECS Express service URL"
  value       = aws_ecs_express_gateway_service.web.ingress_paths[0].endpoint
}

# -----------------------------------------------------------------------------
# RDS
# -----------------------------------------------------------------------------

output "database_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.main.endpoint
}

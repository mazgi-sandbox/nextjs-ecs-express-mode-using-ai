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

output "ecr_web_repository_url" {
  description = "ECR web repository URL for docker push"
  value       = aws_ecr_repository.web.repository_url
}

# -----------------------------------------------------------------------------
# ECS Express services
# -----------------------------------------------------------------------------

output "web_url" {
  description = "Web ECS Express service URL"
  value       = aws_ecs_express_gateway_service.web.ingress_paths[0].endpoint
}

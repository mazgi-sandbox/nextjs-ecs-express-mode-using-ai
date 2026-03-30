resource "aws_ecs_express_gateway_service" "web" {
  service_name            = "${var.app_unique_id}-web"
  execution_role_arn      = aws_iam_role.ecs_execution.arn
  infrastructure_role_arn = aws_iam_role.ecs_infrastructure.arn
  cpu                     = "256"
  memory                  = "512"

  network_configuration {
    subnets         = [aws_subnet.public_a.id, aws_subnet.public_b.id]
    security_groups = [aws_security_group.ecs_web.id]
  }

  scaling_target {
    min_task_count            = 1
    max_task_count            = 2
    auto_scaling_metric       = "AVERAGE_CPU"
    auto_scaling_target_value = 60
  }

  primary_container {
    image          = "${aws_ecr_repository.web.repository_url}:${var.image_tag}"
    container_port = 3000

    environment {
      name  = "PORT"
      value = "3000"
    }
  }
}

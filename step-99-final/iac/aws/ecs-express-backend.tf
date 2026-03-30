locals {
  database_url = "postgresql://${var.database_user}:${var.database_password}@${aws_db_instance.main.address}:5432/${var.database_name}"
}

resource "aws_ecs_express_gateway_service" "backend" {
  service_name            = "${var.app_unique_id}-backend"
  execution_role_arn      = aws_iam_role.ecs_execution.arn
  infrastructure_role_arn = aws_iam_role.ecs_infrastructure.arn
  cpu                     = "256"
  memory                  = "512"
  health_check_path       = "/api"

  network_configuration {
    subnets         = [aws_subnet.private_a.id, aws_subnet.private_b.id]
    security_groups = [aws_security_group.ecs_backend.id]
  }

  scaling_target {
    min_task_count            = 1
    max_task_count            = 2
    auto_scaling_metric       = "AVERAGE_CPU"
    auto_scaling_target_value = 60
  }

  primary_container {
    image          = "${aws_ecr_repository.backend.repository_url}:${var.image_tag}"
    container_port = 4000

    environment {
      name  = "AUTH_JWT_ACCESS_EXPIRATION"
      value = var.jwt_access_expiration
    }
    environment {
      name  = "AUTH_JWT_REFRESH_EXPIRATION"
      value = var.jwt_refresh_expiration
    }
    environment {
      name  = "PORT"
      value = "4000"
    }
    environment {
      name  = "SMTP_FROM"
      value = var.smtp_from
    }
    environment {
      name  = "SMTP_HOST"
      value = var.smtp_host
    }
    environment {
      name  = "SMTP_PORT"
      value = var.smtp_port
    }
    environment {
      name  = "SMTP_SECURE"
      value = var.smtp_secure
    }
    environment {
      name  = "SMTP_USER"
      value = var.smtp_user
    }

    secret {
      name       = "AUTH_JWT_REFRESH_SECRET"
      value_from = aws_secretsmanager_secret.backend_jwt_refresh_secret.arn
    }
    secret {
      name       = "AUTH_JWT_SECRET"
      value_from = aws_secretsmanager_secret.backend_jwt_secret.arn
    }
    secret {
      name       = "AUTH_SESSION_SECRET"
      value_from = aws_secretsmanager_secret.backend_session_secret.arn
    }
    secret {
      name       = "DATABASE_URL"
      value_from = aws_secretsmanager_secret.backend_database_url.arn
    }
    secret {
      name       = "SMTP_PASS"
      value_from = aws_secretsmanager_secret.backend_smtp_pass.arn
    }
  }
}

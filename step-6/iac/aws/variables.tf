variable "app_unique_id" {
  description = "Unique identifier used as a prefix for all resource names"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

# -----------------------------------------------------------------------------
# Container image
# -----------------------------------------------------------------------------

variable "image_tag" {
  description = "Container image tag (e.g. latest, sha-abc1234)"
  type        = string
  default     = "latest"
}

# -----------------------------------------------------------------------------
# RDS
# -----------------------------------------------------------------------------

variable "database_instance_class" {
  description = "RDS instance class"
  type        = string
  default     = "db.t4g.micro"
}

variable "database_password" {
  description = "PostgreSQL user password"
  type        = string
  sensitive   = true
}

variable "database_name" {
  description = "PostgreSQL database name"
  type        = string
  default     = "app"
}

variable "database_user" {
  description = "PostgreSQL user name"
  type        = string
  default     = "appuser"
}

# -----------------------------------------------------------------------------
# JWT
# -----------------------------------------------------------------------------

variable "jwt_access_expiration" {
  description = "JWT access token expiration (e.g. 15m)"
  type        = string
  default     = "15m"
}

variable "jwt_refresh_expiration" {
  description = "JWT refresh token expiration (e.g. 7d)"
  type        = string
  default     = "7d"
}

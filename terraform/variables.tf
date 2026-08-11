variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Domain name registered in AWS Route 53"
  type        = string
  default     = "yourdomain.com"
}

variable "environment" {
  description = "Deployment environment name"
  type        = string
  default     = "production"
}

variable "ec2_instance_type" {
  description = "EC2 instance type for Nginx + React + Spring Boot"
  type        = string
  default     = "t3.medium"
}

variable "db_name" {
  description = "PostgreSQL Database Name"
  type        = string
  default     = "bread_erp_db"
}

variable "db_username" {
  description = "PostgreSQL Master Username"
  type        = string
  default     = "erp_admin"
}

variable "db_password" {
  description = "PostgreSQL Master Password"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "Public SSH key for EC2 instance access"
  type        = string
}

output "ec2_public_ip" {
  description = "Public Elastic IP address of the EC2 Instance"
  value       = aws_eip.app_eip.public_ip
}

output "rds_endpoint" {
  description = "PostgreSQL RDS Instance Endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "elasticache_endpoint" {
  description = "Redis ElastiCache Primary Endpoint"
  value       = aws_elasticache_cluster.redis.cache_nodes[0].address
}

output "route53_domain" {
  description = "Configured Route 53 domain name"
  value       = aws_route53_record.apex.name
}

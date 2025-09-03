# Terrabase2 Terraform Outputs

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.terrabase2_vpc.id
}

output "public_subnet_id" {
  description = "ID of the public subnet"
  value       = aws_subnet.terrabase2_public.id
}

output "database_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.terrabase2_postgres.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_replication_group.terrabase2_redis.primary_endpoint_address
  sensitive   = true
}

output "load_balancer_dns" {
  description = "DNS name of the load balancer"
  value       = aws_lb.terrabase2_alb.dns_name
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.terrabase2_zone.zone_id
}

output "domain_names" {
  description = "Domain names for the applications"
  value = {
    portal       = "terrabase2.com"
    party_game   = "party-game.terrabase2.com"
    magic_marker = "magic-marker.terrabase2.com"
  }
}

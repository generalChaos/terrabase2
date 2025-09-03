# Terrabase2 Infrastructure as Code
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# ===========================================
# VPC AND NETWORKING
# ===========================================

resource "aws_vpc" "terrabase2_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "terrabase2-vpc"
  }
}

resource "aws_internet_gateway" "terrabase2_igw" {
  vpc_id = aws_vpc.terrabase2_vpc.id

  tags = {
    Name = "terrabase2-igw"
  }
}

resource "aws_subnet" "terrabase2_public" {
  vpc_id                  = aws_vpc.terrabase2_vpc.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true

  tags = {
    Name = "terrabase2-public-subnet"
  }
}

resource "aws_route_table" "terrabase2_public_rt" {
  vpc_id = aws_vpc.terrabase2_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.terrabase2_igw.id
  }

  tags = {
    Name = "terrabase2-public-rt"
  }
}

resource "aws_route_table_association" "terrabase2_public_rta" {
  subnet_id      = aws_subnet.terrabase2_public.id
  route_table_id = aws_route_table.terrabase2_public_rt.id
}

# ===========================================
# SECURITY GROUPS
# ===========================================

resource "aws_security_group" "terrabase2_web" {
  name_prefix = "terrabase2-web-"
  vpc_id      = aws_vpc.terrabase2_vpc.id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "terrabase2-web-sg"
  }
}

resource "aws_security_group" "terrabase2_db" {
  name_prefix = "terrabase2-db-"
  vpc_id      = aws_vpc.terrabase2_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.terrabase2_web.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "terrabase2-db-sg"
  }
}

# ===========================================
# RDS DATABASE
# ===========================================

resource "aws_db_subnet_group" "terrabase2_db_subnet_group" {
  name       = "terrabase2-db-subnet-group"
  subnet_ids = [aws_subnet.terrabase2_public.id]

  tags = {
    Name = "terrabase2-db-subnet-group"
  }
}

resource "aws_db_instance" "terrabase2_postgres" {
  identifier = "terrabase2-postgres"
  
  engine         = "postgres"
  engine_version = "16.1"
  instance_class = "db.t3.micro"
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "party"
  username = "party"
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.terrabase2_db.id]
  db_subnet_group_name   = aws_db_subnet_group.terrabase2_db_subnet_group.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = true
  
  tags = {
    Name = "terrabase2-postgres"
  }
}

# ===========================================
# ELASTICACHE REDIS
# ===========================================

resource "aws_elasticache_subnet_group" "terrabase2_redis_subnet_group" {
  name       = "terrabase2-redis-subnet-group"
  subnet_ids = [aws_subnet.terrabase2_public.id]
}

resource "aws_elasticache_replication_group" "terrabase2_redis" {
  replication_group_id       = "terrabase2-redis"
  description                = "Redis cluster for Terrabase2"
  
  node_type                  = "cache.t3.micro"
  port                       = 6379
  parameter_group_name       = "default.redis7"
  
  num_cache_clusters         = 1
  
  subnet_group_name          = aws_elasticache_subnet_group.terrabase2_redis_subnet_group.name
  security_group_ids         = [aws_security_group.terrabase2_web.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = {
    Name = "terrabase2-redis"
  }
}

# ===========================================
# APPLICATION LOAD BALANCER
# ===========================================

resource "aws_lb" "terrabase2_alb" {
  name               = "terrabase2-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.terrabase2_web.id]
  subnets            = [aws_subnet.terrabase2_public.id]

  enable_deletion_protection = false

  tags = {
    Name = "terrabase2-alb"
  }
}

# ===========================================
# ROUTE 53 DNS
# ===========================================

resource "aws_route53_zone" "terrabase2_zone" {
  name = "terrabase2.com"

  tags = {
    Name = "terrabase2-zone"
  }
}

resource "aws_route53_record" "terrabase2_root" {
  zone_id = aws_route53_zone.terrabase2_zone.zone_id
  name    = "terrabase2.com"
  type    = "A"

  alias {
    name                   = aws_lb.terrabase2_alb.dns_name
    zone_id                = aws_lb.terrabase2_alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "terrabase2_party_game" {
  zone_id = aws_route53_zone.terrabase2_zone.zone_id
  name    = "party-game.terrabase2.com"
  type    = "A"

  alias {
    name                   = aws_lb.terrabase2_alb.dns_name
    zone_id                = aws_lb.terrabase2_alb.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "terrabase2_magic_marker" {
  zone_id = aws_route53_zone.terrabase2_zone.zone_id
  name    = "magic-marker.terrabase2.com"
  type    = "A"

  alias {
    name                   = aws_lb.terrabase2_alb.dns_name
    zone_id                = aws_lb.terrabase2_alb.zone_id
    evaluate_target_health = true
  }
}

# Infrastructure Documentation

## 📚 **Infrastructure Overview**

This directory contains documentation for the infrastructure components of Terrabase2.

## 🏗️ **Infrastructure Components**

### **Development Infrastructure**
- **Docker**: Containerization and orchestration
- **Docker Compose**: Multi-service development environment
- **Documentation**: [docker.md](./docker.md)

### **Production Infrastructure**
- **Terraform**: Infrastructure as Code for AWS
- **AWS Services**: ECS, RDS, ElastiCache, ALB, Route 53
- **Documentation**: [terraform.md](./terraform.md)

### **Monitoring & Observability**
- **CloudWatch**: AWS monitoring and logging
- **Health Checks**: Service health monitoring
- **Documentation**: [monitoring.md](./monitoring.md)

## 🐳 **Development Infrastructure**

### **Docker Services**
```yaml
# Infrastructure Services
postgres:     # PostgreSQL database
redis:        # Redis cache
sqlite-volume: # SQLite storage

# Application Services
portal:           # Next.js portal
party-game-api:   # NestJS API
party-game-web:   # Next.js web
magic-marker-api: # Express API
magic-marker-web: # Vite/React web

# Development Tools
pgadmin:        # Database admin
redis-commander: # Redis admin
```

### **Network Architecture**
```
┌─────────────────────────────────────────────────┐
│              terrabase2-network                 │
├─────────────────────────────────────────────────┤
│  Frontend Apps  │  Backend APIs  │  Databases   │
│  - Portal       │  - Party Game  │  - PostgreSQL│
│  - Party Game   │  - Magic Marker│  - Redis     │
│  - Magic Marker │                │  - SQLite    │
└─────────────────────────────────────────────────┘
```

## ☁️ **Production Infrastructure**

### **AWS Architecture**
```
┌─────────────────────────────────────────────────┐
│                    AWS Cloud                    │
├─────────────────────────────────────────────────┤
│  Route 53  │  CloudFront  │  S3 Buckets        │
│  DNS       │  CDN         │  Static Assets     │
├─────────────────────────────────────────────────┤
│  ALB       │  ECS Fargate │  RDS               │
│  Load Balancer │ Containers │ PostgreSQL        │
├─────────────────────────────────────────────────┤
│  ElastiCache │  VPC        │  Security Groups  │
│  Redis       │  Networking │  Firewall Rules   │
└─────────────────────────────────────────────────┘
```

### **Terraform Modules**
```hcl
# VPC and Networking
module "vpc" {
  source = "./modules/vpc"
}

# Database
module "database" {
  source = "./modules/rds"
}

# Cache
module "cache" {
  source = "./modules/elasticache"
}

# Load Balancer
module "alb" {
  source = "./modules/alb"
}
```

## 🔧 **Infrastructure Management**

### **Development Commands**
```bash
# Start development infrastructure
pnpm docker:up

# View logs
pnpm docker:logs

# Stop infrastructure
pnpm docker:down

# Build containers
pnpm docker:build
```

### **Production Commands**
```bash
# Initialize Terraform
pnpm infra:init

# Plan infrastructure changes
pnpm infra:plan

# Apply infrastructure
pnpm infra:apply

# Destroy infrastructure
pnpm infra:destroy
```

## 📊 **Resource Configuration**

### **Development Resources**
```yaml
# PostgreSQL
memory: 512MB
cpu: 0.5 cores
storage: 10GB

# Redis
memory: 256MB
cpu: 0.25 cores

# Applications
memory: 1GB per app
cpu: 1 core per app
```

### **Production Resources**
```hcl
# ECS Fargate
cpu: 256-1024 units
memory: 512MB-4GB
scaling: 1-10 instances

# RDS PostgreSQL
instance_class: db.t3.micro
allocated_storage: 20GB
max_allocated_storage: 100GB

# ElastiCache Redis
node_type: cache.t3.micro
num_cache_nodes: 1
```

## 🔒 **Security Configuration**

### **Network Security**
```hcl
# Security Groups
resource "aws_security_group" "web" {
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
}
```

### **Data Security**
```hcl
# RDS Encryption
storage_encrypted = true
kms_key_id = aws_kms_key.rds.arn

# ElastiCache Encryption
at_rest_encryption_enabled = true
transit_encryption_enabled = true
```

## 📈 **Scaling Configuration**

### **Auto Scaling**
```hcl
# ECS Auto Scaling
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.main.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}
```

### **Load Balancing**
```hcl
# Application Load Balancer
resource "aws_lb" "main" {
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
}
```

## 🔍 **Monitoring Configuration**

### **CloudWatch Metrics**
```hcl
# Custom Metrics
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "high-cpu-utilization"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "300"
  statistic           = "Average"
  threshold           = "80"
}
```

### **Health Checks**
```hcl
# ALB Health Check
health_check {
  enabled             = true
  healthy_threshold   = 2
  interval            = 30
  matcher             = "200"
  path                = "/health"
  port                = "traffic-port"
  protocol            = "HTTP"
  timeout             = 5
  unhealthy_threshold = 2
}
```

## 💰 **Cost Optimization**

### **Resource Sizing**
```hcl
# Right-sized instances
instance_class = "db.t3.micro"  # Start small
node_type      = "cache.t3.micro"  # Scale as needed
cpu            = 256  # Minimum viable
memory         = 512  # Minimum viable
```

### **Cost Monitoring**
```hcl
# Budget Alerts
resource "aws_budgets_budget" "main" {
  budget_type  = "COST"
  limit_amount = "50"
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
}
```

## 🚀 **Deployment Pipeline**

### **Infrastructure Pipeline**
```yaml
# GitHub Actions
name: Deploy Infrastructure
on:
  push:
    paths: ['infrastructure/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: hashicorp/setup-terraform@v1
      - run: terraform init
      - run: terraform plan
      - run: terraform apply -auto-approve
```

### **Application Pipeline**
```yaml
# Deploy Applications
name: Deploy Applications
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - run: docker build -t app .
      - run: docker push ${{ secrets.ECR_REGISTRY }}/app
      - run: aws ecs update-service --cluster main --service app
```

## 📋 **Infrastructure Checklist**

### **Development Setup**
- [ ] Docker installed and running
- [ ] Docker Compose configuration
- [ ] Environment variables set
- [ ] Database migrations ready
- [ ] All services healthy

### **Production Setup**
- [ ] AWS account configured
- [ ] Terraform initialized
- [ ] Infrastructure deployed
- [ ] Applications deployed
- [ ] Monitoring configured
- [ ] Security groups configured
- [ ] SSL certificates valid

### **Maintenance**
- [ ] Regular security updates
- [ ] Cost monitoring active
- [ ] Performance monitoring
- [ ] Backup verification
- [ ] Disaster recovery tested

---

*Infrastructure documentation will be updated as new components are added.*

# Terrabase2 Containerization & IaC Strategy

## 🐳 **Containerization Overview**

### **Development Environment**
- **Full containerization** with Docker Compose
- **Hot reloading** with volume mounts
- **Isolated services** with dedicated networks
- **Development tools** included (pgAdmin, Redis Commander)

### **Production Environment**
- **Infrastructure as Code** with Terraform
- **AWS-based deployment** with RDS, ElastiCache, ALB
- **Domain management** with Route 53
- **Scalable architecture** ready for growth

## 🏗️ **Architecture**

### **Development Stack**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Portal        │    │  Party Game     │    │  Magic Marker   │
│   (Next.js)     │    │  (NestJS)       │    │  (Express)      │
│   Port: 3000    │    │  Port: 3001     │    │  Port: 3003     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │  Party Game     │    │   PostgreSQL    │    │     Redis       │
         │  Web (Next.js)  │    │   Port: 5432    │    │   Port: 6379    │
         │  Port: 3002     │    └─────────────────┘    └─────────────────┘
         └─────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐
         │  Magic Marker   │    │     SQLite      │
         │  Web (Vite)     │    │   (Volume)      │
         │  Port: 3004     │    └─────────────────┘
         └─────────────────┘
```

### **Production Stack (AWS)**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Route 53      │    │   CloudFront    │    │   S3 Buckets    │
│   DNS Management│    │   CDN           │    │   Static Assets │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │   ALB           │    │   ECS/Fargate   │    │   RDS           │
         │   Load Balancer │    │   Containers    │    │   PostgreSQL    │
         └─────────────────┘    └─────────────────┘    └─────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐
         │   ElastiCache   │    │   VPC           │
         │   Redis         │    │   Networking    │
         └─────────────────┘    └─────────────────┘
```

## 🚀 **Development Workflow**

### **Quick Start**
```bash
# Setup development environment
./scripts/dev-setup.sh

# Start all applications
pnpm dev

# Or start specific services
pnpm dev:portal
pnpm dev:party-game
pnpm dev:magic-marker
```

### **Docker Commands**
```bash
# Start infrastructure only
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Start all services
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop all services
docker-compose -f docker-compose.dev.yml down
```

## 🌐 **Service URLs**

### **Development (Local)**
- **Portal**: http://localhost:3000
- **Party Game API**: http://localhost:3001
- **Party Game Web**: http://localhost:3002
- **Magic Marker API**: http://localhost:3003
- **Magic Marker Web**: http://localhost:3004
- **pgAdmin**: http://localhost:5050
- **Redis Commander**: http://localhost:8081

### **Production (AWS)**
- **Portal**: https://terrabase2.com
- **Party Game**: https://party-game.terrabase2.com
- **Magic Marker**: https://magic-marker.terrabase2.com

## 🔧 **Infrastructure as Code**

### **Terraform Structure**
```
infrastructure/
├── terraform/
│   ├── main.tf          # Main infrastructure
│   ├── variables.tf     # Input variables
│   ├── outputs.tf       # Output values
│   └── terraform.tfvars # Variable values
```

### **Deployment Commands**
```bash
# Initialize Terraform
cd infrastructure/terraform
terraform init

# Plan deployment
terraform plan

# Apply infrastructure
terraform apply

# Destroy infrastructure
terraform destroy
```

## 📊 **Benefits**

### **Development Benefits**
1. **Consistent Environment**: Same setup across all developers
2. **Easy Onboarding**: One script to get started
3. **Isolated Services**: No conflicts between projects
4. **Hot Reloading**: Fast development iteration
5. **Database Management**: Built-in admin tools

### **Production Benefits**
1. **Infrastructure as Code**: Version-controlled infrastructure
2. **Scalable Architecture**: Ready for growth
3. **High Availability**: Multi-AZ deployment
4. **Security**: VPC, security groups, encryption
5. **Monitoring**: CloudWatch integration ready

## 🔒 **Security Considerations**

### **Development**
- **Network Isolation**: Services in dedicated Docker network
- **Environment Variables**: Sensitive data in .env files
- **Volume Mounts**: Only necessary directories mounted

### **Production**
- **VPC**: Private network with public subnets
- **Security Groups**: Restrictive firewall rules
- **Encryption**: RDS and ElastiCache encryption at rest
- **SSL/TLS**: HTTPS with Let's Encrypt or AWS Certificate Manager

## 📈 **Scaling Strategy**

### **Horizontal Scaling**
- **ECS Fargate**: Auto-scaling containers
- **ALB**: Load balancing across instances
- **RDS**: Read replicas for database scaling
- **ElastiCache**: Redis clustering

### **Vertical Scaling**
- **Instance Types**: Easy to upgrade
- **Storage**: Auto-scaling RDS storage
- **Memory**: ElastiCache memory scaling

## 🛠️ **Monitoring & Logging**

### **Development**
- **Docker Logs**: `docker-compose logs -f`
- **Application Logs**: Console output
- **Database Logs**: pgAdmin interface

### **Production**
- **CloudWatch**: Metrics and logs
- **X-Ray**: Distributed tracing
- **Health Checks**: ALB health monitoring
- **Alarms**: Automated alerting

## 🔄 **CI/CD Integration**

### **GitHub Actions**
```yaml
# Build and test
- name: Build and Test
  run: |
    docker-compose -f docker-compose.dev.yml up -d
    pnpm test
    pnpm build

# Deploy to AWS
- name: Deploy to AWS
  run: |
    cd infrastructure/terraform
    terraform apply -auto-approve
```

This containerization strategy provides a robust, scalable, and maintainable development and production environment for the Terrabase2 monorepo.

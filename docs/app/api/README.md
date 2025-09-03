# API Documentation

## 📚 **API Overview**

This directory contains documentation for all backend APIs in the Terrabase2 portfolio.

## 🎯 **Available APIs**

### **Party Game API**
- **Framework**: NestJS
- **Database**: PostgreSQL with Prisma
- **Cache**: Redis
- **Features**: Real-time multiplayer, WebSocket support
- **Documentation**: [party-game.md](./party-game.md)

### **Magic Marker API**
- **Framework**: Express.js
- **Database**: SQLite
- **Features**: AI image analysis, file upload
- **Documentation**: [magic-marker.md](./magic-marker.md)

## 🔧 **API Architecture**

### **Common Patterns**
- **RESTful Design**: Standard HTTP methods
- **Error Handling**: Consistent error responses
- **Authentication**: JWT token-based
- **Validation**: Input validation and sanitization
- **Documentation**: OpenAPI/Swagger specs

### **Response Format**
```json
{
  "success": true,
  "data": {},
  "message": "Operation successful",
  "timestamp": "2024-09-02T12:00:00Z"
}
```

### **Error Format**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {}
  },
  "timestamp": "2024-09-02T12:00:00Z"
}
```

## 🌐 **API Endpoints**

### **Party Game API**
- **Base URL**: `https://party-game-api.railway.app`
- **Health Check**: `GET /health`
- **WebSocket**: `ws://party-game-api.railway.app`

### **Magic Marker API**
- **Base URL**: `https://magic-marker-api.railway.app`
- **Health Check**: `GET /health`
- **File Upload**: `POST /upload`

## 🔒 **Authentication**

### **JWT Token**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires": "2024-09-02T13:00:00Z"
}
```

### **Authorization Header**
```
Authorization: Bearer <token>
```

## 📊 **Rate Limiting**

### **Limits**
- **General**: 100 requests/minute
- **Upload**: 10 requests/minute
- **WebSocket**: 50 connections/minute

### **Headers**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1693656000
```

## 🔍 **Monitoring**

### **Health Checks**
- **Endpoint**: `/health`
- **Response**: Service status and dependencies
- **Interval**: 30 seconds

### **Metrics**
- **Response Time**: Average response time
- **Error Rate**: Percentage of failed requests
- **Throughput**: Requests per second

## 📋 **Testing**

### **API Testing**
```bash
# Health check
curl https://party-game-api.railway.app/health

# Test endpoint
curl -X POST https://magic-marker-api.railway.app/upload \
  -H "Content-Type: multipart/form-data" \
  -F "file=@test-image.jpg"
```

### **Load Testing**
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml
```

---

*API documentation will be updated as new endpoints are added.*

# Party Game Documentation

## 🎮 Welcome to Party Game!

A real-time multiplayer bluff trivia game built with **NestJS**, **Socket.io**, and **React**. This documentation will help you understand how to use the API, implement clients, and contribute to the project.

## 📚 Documentation Structure

### **🚀 Getting Started**
- **[Quick Start Guide](./quick-start.md)** - Get up and running in 5 minutes
- **[Setup Guide](./setup.md)** - Complete development environment setup
- **[Architecture Overview](./architecture/overview.md)** - High-level system design

### **🔌 API Reference**
- **[API Overview](./api/README.md)** - Complete API documentation
- **[WebSocket Events](./api/websocket-events.md)** - All available endpoints and events
- **[Game Logic](./api/game-logic.md)** - How the bluff trivia game works
- **[Error Codes](./api/error-codes.md)** - Complete error reference
- **[Code Examples](./api/examples.md)** - Working code examples

### **🏗️ Architecture & Development**
- **[Service Architecture](./architecture/services.md)** - How the new service layer works
- **[State Management](./architecture/state-management.md)** - Immutable state patterns
- **[Testing Guide](./development/testing.md)** - How to test the application
- **[Contributing Guide](./development/contributing.md)** - How to contribute code

### **🚀 Deployment & Operations**
- **[Production Deployment](./deployment/production.md)** - Deploy to production
- **[Troubleshooting](./deployment/troubleshooting.md)** - Common issues and solutions
- **[Performance Notes](./deployment/performance.md)** - Optimization considerations

## 🎯 Quick Navigation

### **For API Users**
Start with the **[API Overview](./api/README.md)** to understand the basics, then dive into **[WebSocket Events](./api/websocket-events.md)** for detailed endpoint documentation.

### **For Developers**
Begin with **[Architecture Overview](./architecture/overview.md)** to understand the system design, then explore **[Service Architecture](./architecture/services.md)** for implementation details.

### **For Contributors**
Check out the **[Contributing Guide](./development/contributing.md)** for development standards and the **[Testing Guide](./development/testing.md)** for testing practices.

## 🚀 Quick Start

### **1. Connect to a Room**
```typescript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001/rooms', {
  query: { roomCode: 'ABC123' }
});
```

### **2. Join the Game**
```typescript
socket.emit('join', { 
  nickname: 'Player1', 
  avatar: '🎮' 
});
```

### **3. Listen for Updates**
```typescript
socket.on('room', (roomState) => {
  console.log('Room updated:', roomState);
});

socket.on('error', (error) => {
  console.error('Game error:', error);
});
```

### **4. Play the Game**
```typescript
// Start game (host only)
socket.emit('startGame', {});

// Submit answer or bluff
socket.emit('submitAnswer', { answer: 'The answer is 42!' });

// Vote on choices
socket.emit('submitVote', { choiceId: 'TRUE::prompt123' });
```

## 🔧 Development Setup

### **Prerequisites**
- Node.js 18+ 
- pnpm (recommended) or npm
- Git

### **Install & Run**
```bash
# Clone the repository
git clone <your-repo-url>
cd party-game

# Install dependencies
pnpm install

# Start development servers
pnpm dev

# Or start individually
pnpm --filter api dev
pnpm --filter web dev
```

### **Environment Variables**
```bash
# API (.env)
PORT=3001
NODE_ENV=development

# Web (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🧪 Testing

### **Run Tests**
```bash
# All tests
pnpm test

# API tests only
pnpm --filter api test

# Web tests only
pnpm --filter web test

# E2E tests
pnpm test:e2e
```

### **Test Coverage**
```bash
pnpm test:coverage
```

## 📊 Project Status

### **✅ Completed**
- ✅ WebSocket API with Socket.io
- ✅ Bluff Trivia game engine
- ✅ Real-time multiplayer support
- ✅ Immutable state management
- ✅ Service layer architecture
- ✅ Comprehensive error handling
- ✅ Timer management system
- ✅ Player reconnection logic

### **🚧 In Progress**
- 🚧 Game phase transitions
- 🚧 Score calculation
- 🚧 Round progression

### **📋 Planned**
- 📋 Additional game types
- 📋 User authentication
- 📋 Game history
- 📋 Leaderboards
- 📋 Mobile app

## 🤝 Contributing

We welcome contributions! Please see our **[Contributing Guide](./development/contributing.md)** for details on:

- Code standards and style
- Testing requirements
- Pull request process
- Issue reporting

### **Development Workflow**
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

### **Getting Help**
- **Documentation**: This is your first stop
- **Issues**: Check existing issues or create new ones
- **Discussions**: Use GitHub Discussions for questions

### **Reporting Bugs**
When reporting bugs, please include:
- Steps to reproduce
- Expected vs actual behavior
- Environment details
- Error logs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- **NestJS** team for the excellent framework
- **Socket.io** for real-time communication
- **React** team for the UI library
- **TypeScript** team for type safety

---

**Happy gaming! 🎮✨**

*Last updated: January 2024*

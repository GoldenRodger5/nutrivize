# Nutrivize V2 🍎

A comprehensive nutrition tracking and meal planning application built with FastAPI (backend) and React (frontend), featuring **enterprise-grade production security and monitoring**.

## � **Production Features (v2.0)**

✅ **Enterprise Security Suite**
- Multi-layer security headers (XSS, CSRF, Frame protection)
- Rate limiting with burst allowance (120 req/min + 20 burst)
- Request size limits and content validation
- Enhanced authentication and authorization

✅ **Monitoring & Reliability**
- Production health check endpoint with service status
- Request tracking with unique IDs for debugging
- Structured error handling with custom exception hierarchy
- Performance logging and metrics collection

✅ **Enhanced Validation & Caching**
- Comprehensive input validation with field constraints
- Redis caching with smart TTL strategies
- Input sanitization and data cleaning
- Production-safe error responses

## 📁 Project Structure

```
nutrivize-v2/
├── backend/                 # FastAPI backend with production enhancements
│   ├── app/
│   │   ├── core/           # Enhanced security, error handling, caching
│   │   ├── models/         # Pydantic models with comprehensive validation
│   │   ├── routes/         # API endpoints with error tracking
│   │   └── services/       # Business logic with exception handling
│   └── backups/            # Backup files and utilities
├── frontend/               # React frontend application
│   ├── src/               # Source code
│   └── backups/           # Frontend backup files
├── scripts/               # Deployment and utility scripts
├── docs/                  # Enhanced documentation with production guides
├── data/                  # Sample data and meal plans
└── nutrition_labels/      # Nutrition label assets
```

## 🚀 Quick Start

### Development
```bash
# Start the enhanced development environment
./start-nutrivize.sh

# API available at: http://localhost:8000
# Frontend available at: http://localhost:5173
# Health check: http://localhost:8000/health
# API docs: http://localhost:8000/docs
```

### Production Monitoring
```bash
# Check API health and service status
curl http://localhost:8000/health

# Expected response:
{
  "status": "healthy",
  "version": "2.0.0", 
  "timestamp": "2025-07-27T01:25:16.411173",
  "services": {
    "api": "up",
    "database": "up",
    "redis": "up"
  }
}
```
```bash
# Deploy to production
./scripts/deploy.sh
```

## 📚 **Documentation**

Complete technical documentation is available in the `docs/` directory:

### **Core Documentation**
- **[📖 Documentation Hub](docs/README.md)** - Complete documentation overview and navigation
- **[🏗️ Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md)** - Enhanced system design with production features
- **[🗄️ Database Schema](docs/DATABASE_SCHEMA.md)** - MongoDB collections, schemas, and indexing strategy
- **[🔐 Security & Authentication](docs/SECURITY_AUTH.md)** - Enhanced security with multi-layer protection
- **[🚀 Deployment Guide](docs/DEPLOYMENT_ENV.md)** - Production deployment with monitoring setup

### **Production Documentation (v2.0)**
- **[📊 Production Testing Results](docs/PRODUCTION_TESTING_RESULTS.md)** - Live testing of production features
- **[🛡️ Production Improvements](docs/PRODUCTION_IMPROVEMENTS.md)** - Comprehensive security and reliability enhancements

### **Feature Documentation**
- **[🤖 AI-Powered Features](docs/functionalities/AI_FEATURES.md)** - AI dashboard, chat assistant, meal planning, and smart insights
- **[🍽️ Food Logging & Management](docs/functionalities/FOOD_LOGGING.md)** - Food search, logging, favorites, and meal tracking
- **[📊 Analytics & Progress Tracking](docs/functionalities/ANALYTICS_TRACKING.md)** - Progress tracking, advanced analytics, and reporting
- **[🔐 User Authentication & Management](docs/functionalities/USER_AUTH_MANAGEMENT.md)** - Registration, authentication, and profile management
- **[🍽️ Meal Planning & Recipe Management](docs/functionalities/MEAL_PLANNING_RECIPES.md)** - AI meal planning, recipe management, and shopping lists
- **[💧 Water Tracking & Hydration](docs/functionalities/WATER_TRACKING.md)** - Smart water tracking, goals, and analytics

### **API & Frontend**
- **[📡 API Reference](docs/API_REFERENCE.md)** - Complete documentation with enhanced error handling
- **[⚛️ Features & Components](docs/FEATURES_COMPONENTS.md)** - Frontend architecture and component documentation

## 🔧 Configuration

Environment variables are managed in:
- `backend/.env` - Production configuration (Render)
- `backend/.env.local` - Local development configuration
- `frontend/.env` - Frontend development configuration  
- `frontend/.env.production` - Frontend production configuration (Render)

## 🧪 Scripts

All utility and deployment scripts are organized in the `scripts/` folder:

### Deployment Scripts (`scripts/deployment/`)
- `deploy.sh` - Main deployment script
- `deploy-to-render.sh` - Render-specific deployment
- `deploy_ai_dashboard.sh` - AI dashboard deployment
- `deploy_pwa.sh` - PWA deployment
- `deployment_readiness_check.sh` - Pre-deployment validation

### Development Scripts (`scripts/development/`)
- `start-nutrivize.sh` - Start development environment
- `start-dev.sh` - Alternative development startup
- `start.sh` - Basic startup script

### Setup Scripts (`scripts/setup/`)
- `build.sh` - Build the application
- `setup_environment.sh` - Environment configuration
- `generate_pwa_icons.sh` - Generate PWA icons

### Legacy Scripts (`scripts/legacy/`)
- Historical scripts for reference and troubleshooting

## 📊 Data

Sample data and meal plans are stored in the `data/` folder for testing and development.

---

Built with ❤️ for healthy living

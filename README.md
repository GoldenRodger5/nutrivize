# Nutrivize V2 🍎

A comprehensive## 📚 **Documentation**

Complete technical documentation is available in the `docs/` directory:

### **Core Documentation**
- **[📖 Documentation Hub](docs/README.md)** - Complete documentation overview and navigation
- **[🏗️ Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md)** - High-level system design and technology stack
- **[🗄️ Database Schema](docs/DATABASE_SCHEMA.md)** - MongoDB collections, schemas, and indexing strategy
- **[🔐 Security & Authentication](docs/SECURITY_AUTH.md)** - Firebase auth, JWT tokens, and security patterns
- **[🚀 Deployment Guide](docs/DEPLOYMENT_ENV.md)** - Local setup and production deployment procedures

### **Feature Documentation**
- **[🤖 AI-Powered Features](docs/functionalities/AI_FEATURES.md)** - AI dashboard, chat assistant, meal planning, and smart insights
- **[🍽️ Food Logging & Management](docs/functionalities/FOOD_LOGGING.md)** - Food search, logging, favorites, and meal tracking
- **[📊 Analytics & Progress Tracking](docs/functionalities/ANALYTICS_TRACKING.md)** - Progress tracking, advanced analytics, and reporting
- **[🔐 User Authentication & Management](docs/functionalities/USER_AUTH_MANAGEMENT.md)** - Registration, authentication, and profile management
- **[🍽️ Meal Planning & Recipe Management](docs/functionalities/MEAL_PLANNING_RECIPES.md)** - AI meal planning, recipe management, and shopping lists
- **[💧 Water Tracking & Hydration](docs/functionalities/WATER_TRACKING.md)** - Smart water tracking, goals, and analytics

### **API & Frontend**
- **[📡 API Reference](docs/API_REFERENCE.md)** - Complete documentation for all 80+ API endpoints
- **[⚛️ Features & Components](docs/FEATURES_COMPONENTS.md)** - Frontend architecture and component documentationcking and meal planning application built with FastAPI (backend) and React (frontend).

## 📁 Project Structure

```
nutrivize-v2/
├── backend/                 # FastAPI backend application
│   ├── app/                # Main application code
│   └── backups/            # Backup files and utilities
├── frontend/               # React frontend application
│   ├── src/               # Source code
│   └── backups/           # Frontend backup files
├── scripts/               # Deployment and utility scripts
├── docs/                  # Documentation and guides
├── data/                  # Sample data and meal plans
└── nutrition_labels/      # Nutrition label assets
```

## 🚀 Quick Start

### Development
```bash
# Start the development environment
./scripts/start-nutrivize.sh
```

### Deployment
```bash
# Deploy to production
./scripts/deploy.sh
```

## � **Documentation**

Complete technical documentation is available in the `docs/` directory:

### **Core Documentation**
- **[Documentation Hub](docs/README.md)** - Complete documentation overview and navigation
- **[Architecture Overview](docs/ARCHITECTURE_OVERVIEW.md)** - High-level system design and technology stack
- **[Database Schema](docs/DATABASE_SCHEMA.md)** - MongoDB collections, schemas, and indexing strategy
- **[Security & Authentication](docs/SECURITY_AUTH.md)** - Firebase auth, JWT tokens, and security patterns
- **[Deployment Guide](docs/DEPLOYMENT_ENV.md)** - Local setup and production deployment procedures

### **API & Frontend**
- **[API Reference](docs/API_REFERENCE.md)** - Complete documentation for all 80+ API endpoints
- **[Features & Components](docs/FEATURES_COMPONENTS.md)** - Frontend architecture and component documentation

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

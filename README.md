# Nutrivize V2 🍎

A comprehensive nutrition tracking and meal planning application built with FastAPI (backend) and React (frontend).

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

## 📖 Documentation

All documentation is organized in the `docs/` folder:
- [Documentation Index](docs/README.md) - Complete documentation overview
- [Deployment Guide](docs/deployment/DEPLOYMENT_GUIDE.md) - Deployment instructions
- [API Documentation](docs/ANALYTICS_README.md) - API reference
- [Feature Guides](docs/features/) - Feature-specific documentation
- [Completion Logs](docs/completion-logs/) - Historical implementation records

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

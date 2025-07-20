# Nutrivize V2 🍎

A comprehensive nutrition tracking and meal planning application built with FastAPI (backend) and React (frontend).

## 📁 Project Structure

```
nutrivize-v2/
├── backend/                 # FastAPI backend application
│   ├── app/                # Main application code
│   ├── backups/            # Backup files and utilities
│   └── frontend/           # Built frontend files for deployment
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
- [Deployment Guide](docs/DEPLOYMENT_GUIDE.md)
- [API Documentation](docs/ANALYTICS_README.md)
- [Feature Guides](docs/)

## 🔧 Configuration

Environment variables are managed in:
- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration

## 🧪 Scripts

All utility and deployment scripts are in the `scripts/` folder:
- Deployment scripts (`deploy_*.sh`)
- Development utilities (`start_*.sh`)
- Build and setup scripts

## 📊 Data

Sample data and meal plans are stored in the `data/` folder for testing and development.

---

Built with ❤️ for healthy living

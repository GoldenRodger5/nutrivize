# Nutrivize V2 Frontend

A modern, React-based frontend for the Nutrivize V2 nutrition tracking application with comprehensive backend integration.

## 🚀 Features

### **Authentication & Security**
- Firebase Authentication integration
- Protected routes with automatic token refresh
- Secure API communication with JWT tokens

### **Modern UI/UX**
- Built with React 18, TypeScript, and Chakra UI
- Responsive design for desktop and mobile
- Clean, tabbed navigation interface
- Dark/light theme support (in settings)

### **Complete Feature Set**
1. **Dashboard** - Daily nutrition overview with goal progress
2. **Food Log** - Log meals and track daily nutrition
3. **Food Index** - Search and add foods to database
4. **Meal Suggestions** - AI-powered meal recommendations
5. **Meal Plans** - Create and manage weekly meal plans with shopping lists
6. **AI Chat** - Conversational nutrition assistant
7. **Goals** - Set and track nutrition/fitness goals
8. **Settings** - Comprehensive user preferences

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI Library**: Chakra UI
- **Authentication**: Firebase Auth
- **HTTP Client**: Axios
- **Routing**: React Router DOM
- **Charts**: Chart.js + React-ChartJS-2
- **Animations**: Framer Motion

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── LoginPage.tsx    # Authentication page
│   │   ├── MainLayout.tsx   # Main app layout with navigation
│   │   └── NavBar.tsx       # Top navigation bar
│   ├── contexts/            # React contexts
│   │   └── AuthContext.tsx  # Authentication state management
│   ├── pages/               # Main application pages
│   │   ├── Dashboard.tsx    # Daily nutrition overview
│   │   ├── FoodLog.tsx      # Food logging interface
│   │   ├── FoodIndex.tsx    # Food search and management
│   │   ├── MealSuggestions.tsx # AI meal recommendations
│   │   ├── MealPlans.tsx    # Meal planning with shopping lists
│   │   ├── AIChat.tsx       # Conversational AI assistant
│   │   ├── Goals.tsx        # Goal setting and tracking
│   │   └── Settings.tsx     # User preferences
│   ├── utils/               # Utility functions
│   │   ├── api.ts          # Axios configuration and interceptors
│   │   └── firebase.ts     # Firebase configuration
│   ├── types.ts            # TypeScript type definitions
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── package.json
└── vite.config.ts
```

## 🔧 Setup & Installation

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Environment setup**:
   Create `.env` file with Firebase configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_API_BASE_URL=http://localhost:8000
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🔗 Backend Integration

The frontend integrates with all 34+ backend endpoints:

### **Authentication Endpoints**
- `GET /auth/me` - Get current user
- `GET /auth/verify` - Verify token

### **Food Management**
- `GET /foods/search` - Search food database
- `POST /foods/` - Add new food
- `GET /foods/{id}` - Get food details
- `PUT /foods/{id}` - Update food
- `DELETE /foods/{id}` - Delete food

### **Food Logging**
- `GET /food-logs/daily/{date}` - Get daily logs
- `GET /food-logs/daily/{date}/with-goals` - Daily logs with goal progress
- `POST /food-logs/` - Create food log
- `PUT /food-logs/{id}` - Update food log
- `DELETE /food-logs/{id}` - Delete food log
- `GET /food-logs/range` - Get date range logs

### **Goals & Targets**
- `GET /goals/` - List all goals
- `POST /goals/` - Create new goal
- `GET /goals/active` - Get active goal
- `PUT /goals/{id}` - Update goal
- `POST /goals/calculate-targets` - Calculate nutrition targets

### **AI Features**
- `POST /ai/chat` - Chat with nutrition AI
- `POST /ai/meal-suggestions` - Get meal recommendations

### **Meal Planning**
- `POST /meal-planning/generate-plan` - Generate meal plan
- `GET /meal-planning/plans` - List meal plans
- `GET /meal-planning/plans/{id}` - Get meal plan details
- `POST /meal-planning/plans/{id}/shopping-list` - Generate shopping list
- `GET /meal-planning/plans/{id}/versions` - Get plan versions
- `POST /meal-planning/plans/{id}/save-version` - Save plan version
- `GET /meal-planning/recommendations` - Get meal recommendations
- `POST /meal-planning/quick-suggestion` - Quick meal idea

### **User Preferences**
- `GET /preferences/dietary` - Get dietary preferences
- `PUT /preferences/dietary` - Update dietary preferences
- `GET /preferences/nutrition` - Get nutrition preferences
- `PUT /preferences/nutrition` - Update nutrition preferences

### **Analytics**
- `GET /analytics/weekly-summary` - Weekly nutrition summary
- `GET /analytics/monthly-summary` - Monthly nutrition summary

## 📱 Page Details

### **Dashboard**
- Daily nutrition progress with goal tracking
- Macro and micronutrient breakdowns
- Recent meals overview
- Quick action buttons
- Welcome message for new users

### **Food Log**
- Add meals by meal type (breakfast, lunch, dinner, snack)
- Search and select foods from database
- Portion size adjustment
- Real-time nutrition calculation
- Daily nutrition summary

### **Food Index**
- Search comprehensive food database
- Add custom foods with full nutrition data
- View detailed nutrition information
- Edit and manage food entries

### **Meal Suggestions**
- AI-powered meal recommendations
- Filter by meal type, calories, dietary restrictions
- Cuisine preferences
- Detailed recipes with ingredients and instructions
- Nutrition breakdown per suggestion

### **Meal Plans**
- Generate weekly meal plans
- Customize by dietary restrictions and preferences
- Version control for meal plans
- Shopping list generation with cost estimates
- Save and manage multiple plans

### **AI Chat**
- Conversational nutrition assistant
- Context-aware responses
- Meal planning advice
- Nutrition education
- Personalized recommendations

### **Goals**
- Set weight loss/gain/maintenance goals
- Automatic nutrition target calculation
- Single active goal enforcement
- Progress tracking
- Goal history and management

### **Settings**
- Comprehensive dietary restrictions and preferences
- Allergen management
- Cuisine preferences
- Cooking skill level and time constraints
- Budget preferences
- App configuration (units, theme, notifications)

## 🎨 UI/UX Features

- **Responsive Design**: Works on desktop and mobile
- **Loading States**: Skeleton screens and spinners
- **Error Handling**: Toast notifications for user feedback
- **Real-time Updates**: Immediate UI updates with optimistic updates
- **Accessibility**: ARIA labels and keyboard navigation
- **Performance**: Code splitting and lazy loading

## 🔒 Security Features

- **Authentication**: Firebase JWT token management
- **Route Protection**: Automatic redirect to login for unauthenticated users
- **Token Refresh**: Automatic token renewal
- **API Security**: Bearer token authentication for all API calls
- **Input Validation**: Client-side form validation

## 🚀 Development Workflow

1. **Start Backend**: Make sure the FastAPI backend is running on port 8000
2. **Start Frontend**: `npm run dev` to start development server on port 5173
3. **Login**: Use Firebase credentials to authenticate
4. **Test Features**: All tabs should work with full backend integration

## 📊 Performance

- **Bundle Size**: Optimized with Vite
- **Loading Time**: Fast initial load with code splitting
- **API Calls**: Efficient data fetching with caching
- **Responsiveness**: Smooth interactions with optimistic updates

## 🧪 Testing

The frontend is tested through:
- Manual testing of all features
- Backend endpoint validation (34/34 endpoints working)
- Authentication flow testing
- Error handling verification

## 🔄 State Management

- **AuthContext**: Global authentication state
- **Local State**: Component-level state with useState
- **API State**: Real-time data fetching and caching
- **Form State**: Controlled components with validation

## 🌟 Key Accomplishments

✅ **Complete Feature Parity**: All backend features accessible from frontend
✅ **Modern UI/UX**: Clean, intuitive interface with Chakra UI
✅ **Full Authentication**: Secure Firebase integration
✅ **Responsive Design**: Works on all device sizes
✅ **Real-time Data**: Live updates with backend synchronization
✅ **Error Handling**: Comprehensive error management
✅ **Performance**: Fast loading and smooth interactions
✅ **Type Safety**: Full TypeScript integration
✅ **Accessibility**: WCAG compliance considerations

The frontend is now a complete, modern web application ready for production use!

# 🚀 Nutrivize: Your Intelligent Nutrition & Wellness Partner

Nutrivize is a cutting-edge application meticulously designed to empower you on your journey towards optimal health and nutrition. It goes beyond simple calorie counting, offering a smart, AI-driven platform to help you understand your dietary habits, achieve your wellness goals, and make informed decisions about your food choices with unprecedented ease and insight.

## 🎯 The Goal

In a world awash with dietary information, Nutrivize aims to be your clear, personalized, and scientifically-grounded guide. Our primary goal is to:

*   **Simplify Nutrition Management:** Make tracking food, understanding nutritional content, and planning meals effortless and intuitive.
*   **Provide Actionable Insights:** Transform raw data into meaningful trends, patterns, and personalized recommendations that drive positive change.
*   **Empower Informed Choices:** Equip you with the knowledge and tools to confidently navigate your nutritional landscape and achieve sustainable health outcomes.
*   **Foster a Healthy Relationship with Food:** Encourage mindful eating and a balanced approach to nutrition, supported by intelligent assistance.

## ✨ Core Functionalities

Nutrivize is packed with features designed to support every aspect of your nutritional journey:

*   **Smart Food Logging & Nutrition Analysis:**
    *   Easily log meals with detailed breakdown of calories, macronutrients (protein, carbs, fats), and micronutrients.
    *   Access a comprehensive food database for quick additions.
    *   Real-time analysis of your daily intake against your targets.

*   **🤖 AI-Powered Chatbot Assistant:**
    *   Get instant, intelligent answers to your nutrition questions.
    *   Ask for meal ideas, food information, or guidance on dietary choices.
    *   Powered by advanced AI models (Anthropic) for natural and helpful conversations.

*   **🥗 Personalized Meal Planning & Suggestions:**
    *   Generate customized meal plans based on your dietary preferences, goals, and daily targets.
    *   Receive smart meal suggestions tailored to your remaining macros for the day.
    *   Includes features like grocery list generation (based on mock data in current Node.js servers, full implementation likely in Python backend).

*   **📊 Intelligent Nutrition Insights & Trends:**
    *   Visualize your nutritional patterns over time with intuitive charts and graphs.
    *   Identify trends in your calorie consumption, macro distribution, and meal timing.
    *   Receive AI-generated insights highlighting areas for improvement or positive reinforcement (full AI capability in Python backend, mock version in `api-server.js`).

*   **🍎 Comprehensive Food Database:**
    *   Leverages a robust database for accurate nutritional information (interfaced via Python/MongoDB backend).
    *   Functionality to add and manage custom food items.

*   **🎯 Goal Setting & Tracking:**
    *   Set and monitor various health and nutrition goals (e.g., weight loss/gain, daily caloric intake, macronutrient targets).
    *   Track your progress and receive feedback to stay motivated.

*   **📱 Apple HealthKit Integration (via iOS Companion App):**
    *   Seamlessly syncs data from Apple Health (steps, calories burned, distance, heart rate, sleep, etc.) via a dedicated Swift-based iOS companion app.
    *   Enriches your nutritional data with overall wellness metrics for a holistic view.

*   **📸 Nutrition Label OCR (Optical Character Recognition):**
    *   Quickly add food items by snapping a picture of their nutrition label.
    *   Utilizes Google Cloud Vision API for accurate text extraction and data parsing (handled by the Python backend).

## 🧑‍💻 Use Cases

Nutrivize is designed for anyone looking to take control of their nutrition:

*   **The Health-Conscious Individual:** Effortlessly track daily intake, understand eating habits, and optimize for overall wellness.
*   **The Goal-Oriented User:** Set specific targets for weight management (loss or gain), muscle building, or macronutrient balance, and let Nutrivize guide the way.
*   **The Busy Professional:** Save time with quick logging, AI-powered meal suggestions, and automated insights.
*   **The Curious Eater:** Learn more about the nutritional content of foods and get reliable answers to dietary questions from the AI chatbot.
*   **The Data-Driven Optimizer:** Dive deep into personal nutrition trends and make data-backed decisions for peak performance and health.
*   **iPhone Users:** Leverage existing Apple Health data for a more comprehensive understanding of the interplay between activity, sleep, and nutrition.

## 🛠️ Tech Stack

Nutrivize is built with a modern and robust technology stack:

*   **Frontend (Web Application - `frontend/`):**
    *   **Framework/Library:** React (v17), TypeScript
    *   **Build Tool:** Vite
    *   **UI Libraries:** Chakra UI, Material-UI (MUI)
    *   **State Management:** React Context (primary)
    *   **Routing:** React Router DOM (v5)
    *   **HTTP Client:** Axios
    *   **Charting:** Chart.js, React Chart.js 2, Recharts
    *   **Animation:** Framer Motion
    *   **Drag & Drop:** React Beautiful DnD
    *   **Firebase Integration:** Firebase Client SDK (for authentication)

*   **Backend (Core Services - `backend/app/`):**
    *   **Framework:** Python 3, FastAPI
    *   **Server:** Uvicorn (ASGI)
    *   **Data Validation:** Pydantic
    *   **Database Interaction:** PyMongo
    *   **AI Integration:** Anthropic API Client
    *   **Cloud Services Integration:** Google Cloud Vision API Client
    *   **Authentication:** Firebase Admin SDK (for token verification)

*   **iOS Companion App (`swift/`):**
    *   **Language:** Swift
    *   **UI:** SwiftUI
    *   **Health Data:** HealthKit Integration
    *   **Secure Storage:** KeychainManager
    *   **API Communication:** Custom API client (`NutrivizeAPIClient.swift`)

*   **Database:**
    *   MongoDB

*   **Supporting Backend Services (Development/Mocking):**
    *   **`api-server.js` (Root Directory):** Node.js, Express.js. Currently serves as a mock API endpoint (port 5001) for the frontend, including a rule-based mock chatbot and mock AI insights. Uses Firebase Client SDK.
    *   **`backend/src/index.js`:** Node.js, Express.js. Appears to be another mock server (port ~8000) primarily for backend development and testing.

*   **General Tooling & DevOps:**
    *   **Version Control:** Git
    *   **Package Management:** npm (for Node.js/Frontend), pip (for Python)
    *   **Linting:** ESLint

## 🏗️ High-Level Architecture

Nutrivize employs a multi-component architecture:

1.  **React Frontend:** Provides the primary user interface, handles user interactions, and communicates with the backend API layer. It uses Firebase for client-side authentication.
2.  **Python/FastAPI Backend:** The core engine of Nutrivize. It manages business logic, database operations (MongoDB), integrates with external AI services (Anthropic, Google Vision), verifies Firebase authentication tokens, and serves data to the frontend and iOS app.
3.  **Swift iOS App:** Acts as a companion app, primarily responsible for gathering health data from Apple HealthKit and securely transmitting it to the Python backend. It also interacts with the backend for user authentication and other app-specific features.
4.  **Node.js Mock Servers:** Currently, `api-server.js` (and `backend/src/index.js`) provide mock API endpoints. In a typical production flow, the frontend would primarily interact with a robust API gateway or directly with the FastAPI backend, with `api-server.js` potentially evolving into such a gateway that routes requests and handles initial Firebase interactions.

## 🚀 Getting Started

(Detailed setup instructions should be reviewed and updated based on the final deployment strategy for the multiple backend components. The existing setup guide provides a starting point.)

**General Prerequisites:**
*   Node.js and npm
*   Python and pip
*   MongoDB instance (local or cloud)
*   Firebase project setup
*   API keys for Google Cloud Vision and Anthropic

**Basic Local Setup (Conceptual):**

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    cd nutrivize
    ```

2.  **Backend (Python/FastAPI - `backend/app/`):**
    *   Navigate to `backend/`: `cd backend`
    *   Set up a Python virtual environment and install dependencies:
        ```bash
        python -m venv venv
        source venv/bin/activate  # On Windows: venv\\Scripts\\activate
        pip install -r requirements.txt
        ```
    *   Configure environment variables (e.g., in a `.env` file in `backend/` or `backend/app/`) for database connection, Firebase Admin SDK credentials, Anthropic API key, Google Cloud Vision API key.
    *   Run the FastAPI server (typically from within `backend/app/` or via a script in `backend/`):
        ```bash
        # Example: uvicorn app.main:app --reload --port 8080 (adjust command as per project setup)
        ```

3.  **Frontend (React - `frontend/`):**
    *   Navigate to `frontend/`: `cd frontend` (from root)
    *   Install dependencies: `npm install`
    *   Configure environment variables (e.g., in a `.env` file) for the backend API URL (pointing to the FastAPI server or the `api-server.js` if used as a proxy/mock) and Firebase client SDK config.
    *   Start the development server: `npm run dev` (or `npm start`)

4.  **Node.js Mock Server (`api-server.js` - Optional, for current mock functionality):**
    *   From the root directory:
    *   If not already done by the root `install:all` script, ensure dependencies listed in the root `package.json` related to `api-server.js` are met (Express, CORS).
    *   Run: `node api-server.js` (or `npm run api` as defined in root `package.json`)

5.  **iOS App (`swift/`):**
    *   Open the project in Xcode.
    *   Configure API endpoints in `NutrivizeAPIClient.swift` to point to your running backend.
    *   Build and run on a simulator or physical device.

*(Note: The co-existence of multiple servers writing to `backend/port.txt` and multiple `package.json` files suggests careful attention to port management and startup scripts for a seamless development experience.)*

##🤝 Contributing

We welcome contributions to Nutrivize! If you'd like to help improve the app, please follow these steps:

1.  Fork the repository.
2.  Create a new branch for your feature or bug fix: `git checkout -b feature/your-feature-name` or `bugfix/issue-tracker-id`.
3.  Make your changes, adhering to the project's coding style and guidelines.
4.  Write tests for your changes.
5.  Commit your changes: `git commit -m "feat: Describe your feature"` or `fix: Describe your fix`.
6.  Push to your branch: `git push origin feature/your-feature-name`.
7.  Open a Pull Request against the `main` (or `develop`) branch of the original repository.

Please provide a clear description of your changes in the Pull Request.

## 📜 License

This project is licensed under the MIT License. See the `LICENSE` file for more details (assuming a LICENSE file exists, otherwise this can be removed or a standard MIT license text added).

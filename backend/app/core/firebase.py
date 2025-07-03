import firebase_admin
from firebase_admin import credentials, auth
import os
import requests
from dotenv import load_dotenv

load_dotenv()

class FirebaseManager:
    """Firebase authentication manager"""
    
    def __init__(self):
        self.app = None
        self.api_key = "AIzaSyAORKm-1yynaNrSomVU0P18HyS_4HSzHks"  # From frontend env
        self._initialize()
    
    def _initialize(self):
        """Initialize Firebase Admin SDK"""
        if firebase_admin._apps:
            self.app = firebase_admin.get_app()
            return
            
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        if not service_account_path or not os.path.exists(service_account_path):
            raise ValueError("Firebase service account file not found")
            
        cred = credentials.Certificate(service_account_path)
        self.app = firebase_admin.initialize_app(cred)
        print("Firebase Admin SDK initialized successfully")
    
    def verify_token(self, id_token: str) -> dict:
        """Verify Firebase ID token and return user info"""
        try:
            decoded_token = auth.verify_id_token(id_token)
            return {
                "uid": decoded_token["uid"],
                "email": decoded_token.get("email"),
                "name": decoded_token.get("name"),
                "email_verified": decoded_token.get("email_verified", False)
            }
        except Exception as e:
            raise ValueError(f"Invalid token: {str(e)}")
    
    def login_with_email_password(self, email: str, password: str) -> dict:
        """Login with email/password and return ID token"""
        try:
            url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={self.api_key}"
            payload = {
                "email": email,
                "password": password,
                "returnSecureToken": True
            }
            
            response = requests.post(url, json=payload)
            data = response.json()
            
            if response.status_code != 200:
                error_message = data.get("error", {}).get("message", "Login failed")
                raise ValueError(f"Firebase login failed: {error_message}")
            
            return {
                "id_token": data["idToken"],
                "refresh_token": data["refreshToken"],
                "uid": data["localId"],
                "email": data["email"]
            }
            
        except requests.exceptions.RequestException as e:
            raise ValueError(f"Network error during login: {str(e)}")
        except Exception as e:
            raise ValueError(f"Login failed: {str(e)}")
    
    def create_user(self, email: str, password: str, name: str = None) -> dict:
        """Create a new Firebase user"""
        try:
            user_record = auth.create_user(
                email=email,
                password=password,
                display_name=name
            )
            return {
                "uid": user_record.uid,
                "email": user_record.email,
                "name": user_record.display_name or ""
            }
        except Exception as e:
            raise ValueError(f"User creation failed: {str(e)}")
    
    def get_user_by_email(self, email: str) -> dict:
        """Get user by email"""
        try:
            user_record = auth.get_user_by_email(email)
            return {
                "uid": user_record.uid,
                "email": user_record.email,
                "name": user_record.display_name or ""
            }
        except Exception as e:
            raise ValueError(f"User not found: {str(e)}")


# Global Firebase manager instance
firebase_manager = FirebaseManager()

import firebase_admin
from firebase_admin import credentials, auth
import os
import json
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
        
        # Try to get credentials from environment variable first (for production)
        firebase_creds_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
        firebase_creds_base64 = os.getenv("FIREBASE_SERVICE_ACCOUNT_BASE64")
        
        if firebase_creds_base64:
            # Decode base64 encoded credentials
            try:
                import base64
                decoded_json = base64.b64decode(firebase_creds_base64).decode('utf-8')
                creds_dict = json.loads(decoded_json)
                cred = credentials.Certificate(creds_dict)
                self.app = firebase_admin.initialize_app(cred)
                print("Firebase Admin SDK initialized from base64 environment variable")
                return
            except Exception as e:
                print(f"Error parsing base64 Firebase credentials: {e}")
        
        if firebase_creds_json:
            # Parse JSON from environment variable
            try:
                # Handle escaped newlines in private key
                firebase_creds_json = firebase_creds_json.replace('\\n', '\n')
                creds_dict = json.loads(firebase_creds_json)
                cred = credentials.Certificate(creds_dict)
                self.app = firebase_admin.initialize_app(cred)
                print("Firebase Admin SDK initialized from environment variable")
                return
            except json.JSONDecodeError as e:
                print(f"Error parsing Firebase credentials JSON: {e}")
        
        # Fallback to file-based credentials (for development)
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
        if service_account_path and os.path.exists(service_account_path):
            cred = credentials.Certificate(service_account_path)
            self.app = firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized from file")
            return
            
        raise ValueError("Firebase service account credentials not found in environment variable or file")
    
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

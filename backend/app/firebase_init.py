import os
import json
import firebase_admin
from firebase_admin import credentials
from dotenv import load_dotenv
import traceback

# Load environment variables
load_dotenv()

# Track initialization status
firebase_initialized = False

# Initialize Firebase Admin SDK if not already initialized
def initialize_firebase():
    global firebase_initialized
    if firebase_initialized:
        print("Firebase already initialized - skipping")
        return True
        
    try:
        # Check if Firebase Admin is already initialized
        if not firebase_admin._apps:
            print("Starting Firebase initialization...")
            
            # Try multiple credential file locations
            possible_cred_paths = [
                os.environ.get("FIREBASE_CREDENTIALS_PATH"),
                "/Users/isaacmineo/Main/projects/nutrivize/food-tracker-6096d-firebase-adminsdk-fbsvc-6d95aba762.json",
                "food-tracker-6096d-firebase-adminsdk-fbsvc-6d95aba762.json",
                "../food-tracker-6096d-firebase-adminsdk-fbsvc-6d95aba762.json",
                "../../food-tracker-6096d-firebase-adminsdk-fbsvc-6d95aba762.json",
            ]
            
            # Get project ID (should be "food-tracker-6096d" from the credentials)
            project_id = "food-tracker-6096d"
            credential_file_found = False
            
            # Try each credential path
            for cred_path in possible_cred_paths:
                if not cred_path:
                    continue
                    
                if os.path.exists(cred_path):
                    try:
                        print(f"Found credential file at: {cred_path}")
                        # Initialize with credentials file
                        cred = credentials.Certificate(cred_path)
                        firebase_admin.initialize_app(cred, {
                            'projectId': project_id
                        })
                        print(f"Firebase Admin SDK initialized with credential file and project ID: {project_id}")
                        credential_file_found = True
                        firebase_initialized = True
                        break
                    except Exception as e:
                        print(f"Error initializing with credential file {cred_path}: {e}")
                        traceback.print_exc()
            
            # If no credential file was found, try default initialization
            if not credential_file_found:
                print("No credential file found, trying default initialization")
                try:
                    # Initialize without credentials (will use Application Default Credentials)
                    firebase_admin.initialize_app(options={
                        'projectId': project_id
                    })
                    print(f"Firebase Admin SDK initialized with default credentials, project ID: {project_id}")
                    firebase_initialized = True
                except Exception as e:
                    print(f"Error initializing with default credentials: {e}")
                    traceback.print_exc()
                    return False
        else:
            print("Firebase Admin SDK already initialized")
            firebase_initialized = True
            
        return firebase_initialized
    except Exception as e:
        print(f"Warning: Failed to initialize Firebase Admin SDK: {str(e)}")
        traceback.print_exc()
        print("Authentication features will not work correctly!")
        return False

# Initialize Firebase Admin when the module is imported
initialize_firebase() 
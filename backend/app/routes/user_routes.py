from app.models import create_user, users

def register_user(user_data):
    # Add validation, password hashing, etc.
    user_id = create_user(user_data)
    return user_id 
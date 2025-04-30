from app.auth import firebase_auth

print('Testing Firebase Authentication')
print('-------------------------------')

# Test with the test user credentials
email = 'test@example.com'
password = 'testpassword123'

print(f'Attempting to sign in with email: {email}')
try:
    user = firebase_auth.sign_in_with_email_and_password(email, password)
    print('✅ Authentication successful!')
    print(f'User ID: {user["localId"]}')
    print(f'Email: {user["email"]}')
    print(f'Token: {user["idToken"][:20]}...')
except Exception as e:
    print(f'❌ Authentication failed: {str(e)}')
    
    # Let's try to see if this user exists in Firebase
    try:
        from firebase_admin import auth
        user = auth.get_user_by_email(email)
        print(f'✅ User exists in Firebase with UID: {user.uid}')
        print(f'Email verified: {user.email_verified}')
        print(f'Display name: {user.display_name}')
        print('⚠️ The user exists but the password might be incorrect.')
    except Exception as auth_e:
        print(f'❌ Could not find user in Firebase: {str(auth_e)}')
        print('The user might not exist in Firebase or there might be a configuration issue.') 
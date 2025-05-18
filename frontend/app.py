import streamlit as st
import requests
import json
from datetime import datetime, timedelta
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns
from food_log import display_food_log
from nutrition import display_nutrition
from goals import display_goals
from chat import display_chat
from health_insights import display_health_insights

def display_home():
    st.title("Welcome to Nutrivize")
    st.write("Your personal nutrition and health assistant.")
    
    # Check if user is logged in
    if "auth_token" in st.session_state:
        st.success("You are logged in!")
        
        # Display user info
        if "user_info" in st.session_state:
            user_info = st.session_state["user_info"]
            st.write(f"Hello, {user_info.get('name', 'User')}!")
            
        # Quick stats
        st.subheader("Quick Stats")
        col1, col2, col3 = st.columns(3)
        col1.metric("Today's Calories", "1,200 kcal", "65%")
        col2.metric("Protein", "75g", "80%")
        col3.metric("Water", "1.5L", "60%")
        
        # Recent meals
        st.subheader("Recent Meals")
        # Display recent meals logic here
        
        # Recent health data
        st.subheader("Health Overview")
        # Display health data summary here
    else:
        st.warning("Please log in to access your dashboard.")
        
        # Login form
        with st.form("login_form"):
            st.subheader("Login")
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            submit = st.form_submit_button("Login")
            
            if submit:
                try:
                    # Call login API
                    login_url = "http://localhost:5001/api/auth/login"
                    response = requests.post(
                        login_url,
                        json={"email": email, "password": password}
                    )
                    
                    if response.status_code == 200:
                        auth_data = response.json()
                        st.session_state["auth_token"] = auth_data["access_token"]
                        st.session_state["user_info"] = {
                            "email": email,
                            "name": auth_data.get("name", "User"),
                            "uid": auth_data.get("user_id", "")
                        }
                        st.success("Login successful!")
                        st.experimental_rerun()
                    else:
                        st.error(f"Login failed: {response.json().get('detail', 'Unknown error')}")
                except Exception as e:
                    st.error(f"Error during login: {str(e)}")
        
        # Register option
        st.write("Don't have an account?")
        if st.button("Register"):
            # TODO: Implement registration flow
            st.write("Registration not implemented yet.")

def main():
    st.set_page_config(
        page_title="Nutrivize",
        page_icon="🥗",
        layout="wide"
    )
    
    # Sidebar with navigation
    with st.sidebar:
        st.title("Nutrivize")
        
        # User info
        if "auth_token" in st.session_state:
            st.write(f"Logged in as: {st.session_state.get('user_info', {}).get('email', 'User')}")
            if st.button("Logout"):
                for key in ["auth_token", "user_info"]:
                    if key in st.session_state:
                        del st.session_state[key]
                st.experimental_rerun()
        
        # Navigation
        page = st.radio(
            "Navigation",
            ["Home", "Food Log", "Nutrition", "Health Insights", "Goals", "Chat"]
        )
    
    # Display the selected page
    if page == "Home":
        display_home()
    elif page == "Food Log":
        display_food_log()
    elif page == "Nutrition":
        display_nutrition()
    elif page == "Health Insights":
        display_health_insights()
    elif page == "Goals":
        display_goals()
    elif page == "Chat":
        display_chat()

if __name__ == "__main__":
    main() 
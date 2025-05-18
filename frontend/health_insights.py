import streamlit as st
import requests
import json
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from datetime import datetime, timedelta

def display_health_insights():
    st.title("Health Insights & Trends")
    
    # Get authentication token from session state
    auth_token = st.session_state.get("auth_token")
    
    if not auth_token:
        st.warning("Please log in to view your health insights.")
        return
    
    # API URL for fetching health insights
    base_url = "http://localhost:5001"  # Change this to your backend URL
    insights_url = f"{base_url}/api/health/insights"
    
    # Set up headers with auth token
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    try:
        with st.spinner("Loading your health insights..."):
            # Fetch health insights from the backend
            response = requests.get(insights_url, headers=headers)
            
            if response.status_code == 200:
                insights_data = response.json()
                
                if "message" in insights_data and "No health data found" in insights_data["message"]:
                    st.info("No Apple Health data found. Please sync your Apple Health data first.")
                    return
                
                insights = insights_data.get("insights", {})
                
                # Display date range
                st.subheader("Health Data Overview")
                st.write(f"Data range: {insights.get('date_range', 'N/A')} ({insights.get('days_count', 0)} days)")
                
                # Create tabs for different views
                tab1, tab2, tab3 = st.tabs(["Metrics", "Insights", "Chat"])
                
                with tab1:
                    # Metrics Summary
                    st.subheader("Health Metrics")
                    
                    metrics = insights.get("metrics", {})
                    if metrics:
                        # Create columns for metrics
                        col1, col2, col3 = st.columns(3)
                        
                        # Steps
                        if "steps" in metrics:
                            steps_data = metrics["steps"]
                            col1.metric(
                                "Daily Steps", 
                                f"{int(steps_data.get('average', 0))} steps",
                                f"{steps_data.get('trend', 'stable')}"
                            )
                        
                        # Exercise
                        if "exercise_minutes" in metrics:
                            exercise_data = metrics["exercise_minutes"]
                            col2.metric(
                                "Exercise", 
                                f"{int(exercise_data.get('average', 0))} min/day",
                                f"{exercise_data.get('trend', 'stable')}"
                            )
                        
                        # Sleep
                        if "sleep_hours" in metrics:
                            sleep_data = metrics["sleep_hours"]
                            col3.metric(
                                "Sleep", 
                                f"{sleep_data.get('average', 0):.1f} hours",
                                f"{sleep_data.get('trend', 'stable')}"
                            )
                        
                        # Calories
                        if "calories" in metrics:
                            calories_data = metrics["calories"]
                            col1.metric(
                                "Active Energy", 
                                f"{int(calories_data.get('average', 0))} kcal/day",
                                f"{calories_data.get('trend', 'stable')}"
                            )
                        
                        # Distance
                        if "distance" in metrics:
                            distance_data = metrics["distance"]
                            col2.metric(
                                "Distance", 
                                f"{(distance_data.get('average', 0)/1000):.2f} km/day",
                                f"{distance_data.get('trend', 'stable')}"
                            )
                    
                    # Get all_data from original response to plot charts
                    chat_url = f"{base_url}/api/chat"
                    chat_payload = {
                        "messages": [
                            {"role": "user", "content": "What's my health data like? I want to see my steps, exercise, and sleep specifically."}
                        ],
                        "fetch_context": True
                    }
                    
                    chat_response = requests.post(chat_url, json=chat_payload, headers=headers)
                    
                    if chat_response.status_code == 200:
                        chat_data = chat_response.json()
                        response_text = chat_data.get("response", "")
                        
                        # Extract JSON from the response if it's there
                        import re
                        json_match = re.search(r'```json\n(.*?)\n```', response_text, re.DOTALL)
                        
                        if json_match:
                            try:
                                health_data = json.loads(json_match.group(1))
                                all_data = health_data.get("all_data", [])
                                
                                if all_data:
                                    # Convert to DataFrame for plotting
                                    df = pd.DataFrame(all_data)
                                    df['date'] = pd.to_datetime(df['date'])
                                    df = df.sort_values('date')
                                    
                                    # Plot steps chart
                                    st.subheader("Steps Over Time")
                                    fig = px.line(df, x='date', y='steps', markers=True)
                                    fig.update_layout(height=400)
                                    st.plotly_chart(fig, use_container_width=True)
                                    
                                    # Plot exercise chart
                                    st.subheader("Exercise Minutes Over Time")
                                    fig = px.line(df, x='date', y='exercise_minutes', markers=True)
                                    fig.update_layout(height=400)
                                    st.plotly_chart(fig, use_container_width=True)
                                    
                                    # Sleep data might be sparse, so only show if there's data
                                    sleep_data = df[df['sleep_hours'] > 0]
                                    if not sleep_data.empty:
                                        st.subheader("Sleep Hours Over Time")
                                        fig = px.line(sleep_data, x='date', y='sleep_hours', markers=True)
                                        fig.update_layout(height=400)
                                        st.plotly_chart(fig, use_container_width=True)
                            except json.JSONDecodeError:
                                pass
                
                with tab2:
                    # Insights and Recommendations
                    st.subheader("Patterns")
                    patterns = insights.get("patterns", [])
                    if patterns:
                        for pattern in patterns:
                            st.markdown(f"- {pattern}")
                    else:
                        st.write("No patterns detected in your health data.")
                        
                    st.subheader("Recommendations")
                    recommendations = insights.get("recommendations", [])
                    if recommendations:
                        for rec in recommendations:
                            st.markdown(f"- {rec}")
                    else:
                        st.write("No recommendations available.")
                
                with tab3:
                    # Chat about health data
                    st.subheader("Ask About Your Health Data")
                    st.write("You can ask questions about your health data, and our AI will provide insights based on your actual Apple Health information.")
                    
                    # Example questions
                    st.markdown("**Example questions you can ask:**")
                    examples = [
                        "How has my sleep been recently?",
                        "Am I getting enough exercise?",
                        "What's my average step count?",
                        "How can I improve my activity levels?",
                        "What patterns do you see in my health data?",
                        "Have my step counts been improving?",
                        "What days do I exercise the most?"
                    ]
                    
                    for example in examples:
                        st.markdown(f"- {example}")
                    
                    # Chat interface
                    health_query = st.text_input("Ask a question about your health data:")
                    
                    if health_query:
                        with st.spinner("Analyzing your health data..."):
                            chat_payload = {
                                "messages": [
                                    {"role": "user", "content": health_query}
                                ],
                                "fetch_context": True
                            }
                            
                            chat_response = requests.post(chat_url, json=chat_payload, headers=headers)
                            
                            if chat_response.status_code == 200:
                                chat_data = chat_response.json()
                                response_text = chat_data.get("response", "")
                                
                                st.markdown("### Response")
                                st.markdown(response_text)
                            else:
                                st.error(f"Error: {chat_response.status_code} - {chat_response.text}")
            else:
                st.error(f"Error: {response.status_code} - {response.text}")
    except Exception as e:
        st.error(f"Error fetching health insights: {str(e)}")

# This function is called when this module is run directly
if __name__ == "__main__":
    display_health_insights() 
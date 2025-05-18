import webbrowser
import os
import time

def main():
    """Open the web browser to the Nutrivize Apple Health tab"""
    print("Opening the Nutrivize Apple Health tab in your default browser...")
    
    # URL for the dashboard with the health tab selected
    url = "http://localhost:5173/dashboard?tab=health"
    
    # Open the URL in the default browser
    webbrowser.open(url)
    
    print("Browser opened!")
    print("Instructions:")
    print("1. Log in if required")
    print("2. The Apple Health tab should show the last 7 days of data by default")
    print("3. If needed, click on the 'Week' button in the date range selector")
    print("4. Click 'Refresh Data' if you want to refresh the data")

if __name__ == "__main__":
    main() 
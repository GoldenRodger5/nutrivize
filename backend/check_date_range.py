import datetime

def calculate_date_range(range_type='7d'):
    """Simulate the frontend date range calculation"""
    # Create a date object for today
    now = datetime.datetime.now()
    
    # Format date as YYYY-MM-DD
    today_formatted = now.strftime("%Y-%m-%d")
    print(f"Today's date (ISO format): {today_formatted}")
    
    # Set endDate to today in YYYY-MM-DD format
    end_date = today_formatted
    
    # Calculate start date based on the selected range
    if range_type == '1d':
        # For "Today", use today's date for both start and end
        print(f'Using today for date range (1d): {today_formatted}')
        start_date = today_formatted
    elif range_type == '7d':
        # Create a date object 6 days before today
        temp_date = now - datetime.timedelta(days=6)
        start_date = temp_date.strftime("%Y-%m-%d")
    elif range_type == '30d':
        # Create a date object 29 days before today
        temp_date = now - datetime.timedelta(days=29)
        start_date = temp_date.strftime("%Y-%m-%d")
    elif range_type == '90d':
        # Create a date object 89 days before today
        temp_date = now - datetime.timedelta(days=89)
        start_date = temp_date.strftime("%Y-%m-%d")
    else:
        # Default to 7 days (6 days before today)
        temp_date = now - datetime.timedelta(days=6)
        start_date = temp_date.strftime("%Y-%m-%d")
    
    result = {
        "startDate": start_date,
        "endDate": end_date
    }
    print("Calculated date range:", result)
    
    # Show actual data dates
    print("\nDates that should be visible in the current range:")
    
    # Connect to database to see if data exists for these dates
    from app.database import get_database
    db = get_database()
    
    # Calculate all dates in the range
    start_dt = datetime.datetime.strptime(start_date, "%Y-%m-%d")
    end_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d")
    current = start_dt
    
    while current <= end_dt:
        date_str = current.strftime("%Y-%m-%d")
        count = db.healthkit_data.count_documents({"date_key": date_str})
        status = "✅" if count > 0 else "❌"
        print(f"{status} {date_str}: {count} records")
        current += datetime.timedelta(days=1)
    
    return result

# Test all date ranges
print("\n=== Testing date range: Today (1d) ===")
calculate_date_range('1d')

print("\n=== Testing date range: Week (7d) ===")
calculate_date_range('7d')

print("\n=== Testing date range: Month (30d) ===")
calculate_date_range('30d')

print("\n=== Testing date range: 3 Months (90d) ===")
calculate_date_range('90d') 
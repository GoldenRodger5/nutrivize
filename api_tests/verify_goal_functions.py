"""
Verify that the goal-related functions work correctly.
"""
import os
import sys
import asyncio

# Set up the path to import from backend
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
sys.path.append(backend_dir)

try:
    # Import the goal-related functions
    print(f"Importing from: {backend_dir}")
    from app.constants import USER_ID
    from app.chatbot import analyze_user_goal_progress, suggest_goal_adjustments, handle_goal_queries
    print("Successfully imported required modules")
except ImportError as e:
    print(f"Import error: {e}")
    sys.exit(1)

async def test_goal_functions():
    """Test all goal-related functions."""
    print("\n=== Testing Goal Functions ===\n")
    
    try:
        # Test analyze_user_goal_progress
        print("1. Testing analyze_user_goal_progress:")
        progress_result = await analyze_user_goal_progress(USER_ID)
        print(f"Function returned {len(progress_result)} characters of analysis")
        print(f"Sample output: {progress_result[:100]}...\n")
        
        # Test suggest_goal_adjustments
        print("2. Testing suggest_goal_adjustments:")
        adjustment_result = await suggest_goal_adjustments(USER_ID)
        print(f"Function returned {len(adjustment_result)} characters of suggestions")
        print(f"Sample output: {adjustment_result[:100]}...\n")
        
        # Test handle_goal_queries with different query types
        print("3. Testing handle_goal_queries with progress query:")
        progress_query = await handle_goal_queries("how am I doing with my goals", USER_ID)
        if progress_query:
            print(f"Successfully processed progress query ({len(progress_query['answer'])} characters)")
            print(f"Sample output: {progress_query['answer'][:100]}...\n")
        else:
            print("Progress query returned None\n")
        
        print("4. Testing handle_goal_queries with adjustment query:")
        adjustment_query = await handle_goal_queries("suggest adjustments to my goal", USER_ID)
        if adjustment_query:
            print(f"Successfully processed adjustment query ({len(adjustment_query['answer'])} characters)")
            print(f"Sample output: {adjustment_query['answer'][:100]}...\n")
        else:
            print("Adjustment query returned None\n")
        
        print("5. Testing handle_goal_queries with goal info query:")
        goal_info_query = await handle_goal_queries("what is my current goal", USER_ID)
        if goal_info_query:
            print(f"Successfully processed goal info query ({len(goal_info_query['answer'])} characters)")
            print(f"Sample output: {goal_info_query['answer'][:100]}...\n")
        else:
            print("Goal info query returned None\n")
        
        print("All tests completed successfully!\n")
        return True
        
    except Exception as e:
        import traceback
        print(f"\nError during testing: {e}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("Starting goal functions verification")
    result = asyncio.run(test_goal_functions())
    if result:
        print("✅ All goal functions verified successfully")
        sys.exit(0)
    else:
        print("❌ Goal function verification failed")
        sys.exit(1) 
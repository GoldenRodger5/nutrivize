#!/usr/bin/env python3
"""
Fix Analytics Endpoints
This script adds the required args and kwargs parameters to all analytics endpoints
"""

import re
import sys
import os

def fix_analytics_endpoints():
    """Fix analytics endpoints to handle args and kwargs parameters correctly"""
    
    analytics_path = "./backend/app/routes/analytics.py"
    
    if not os.path.exists(analytics_path):
        print(f"Error: File not found: {analytics_path}")
        return False
    
    try:
        # Read the file
        with open(analytics_path, 'r') as f:
            content = f.read()
        
        # Create backup
        backup_path = f"{analytics_path}.bak"
        with open(backup_path, 'w') as f:
            f.write(content)
        print(f"Created backup at {backup_path}")
        
        # Fix the syntax error in get_monthly_summary
        monthly_summary_pattern = re.compile(
            r'@router\.get\("\/monthly-summary"\)\n'
            r'async def get_monthly_summary\n'
            r'    args: Optional\[str\] = Query\(None, description="Optional arguments"\),\n'
            r'    kwargs: Optional\[str\] = Query\(None, description="Optional keyword arguments"\),\n'
            r'    \n'
            r'    year: Optional\[int\] = Query\(None, description="Year \(default: current year\)"\),\n'
            r'    month: Optional\[int\] = Query\(None, description="Month 1-12 \(default: current month\)"\),\n'
            r'    args: Optional\[str\] = Query\(None, description="Optional arguments"\),\n'
            r'    kwargs: Optional\[str\] = Query\(None, description="Optional keyword arguments"\),\n'
            r'    current_user: UserResponse = Depends\(get_current_user\)\n'
            r'\):', 
            re.DOTALL
        )
        
        monthly_summary_replacement = (
            '@router.get("/monthly-summary")\n'
            'async def get_monthly_summary(\n'
            '    year: Optional[int] = Query(None, description="Year (default: current year)"),\n'
            '    month: Optional[int] = Query(None, description="Month 1-12 (default: current month)"),\n'
            '    args: Optional[str] = Query(None, description="Optional arguments"),\n'
            '    kwargs: Optional[str] = Query(None, description="Optional keyword arguments"),\n'
            '    current_user: UserResponse = Depends(get_current_user)\n'
            '):'
        )
        
        # Fix the specific get_monthly_summary syntax error first
        content = monthly_summary_pattern.sub(monthly_summary_replacement, content)
        print("Fixed syntax error in get_monthly_summary function")
        
        # Find all endpoint methods to add args/kwargs if needed
        endpoint_pattern = r'@router\.get\("[^"]+"\)[^\n]*\nasync def ([a-zA-Z_]+)\(([^\)]+)\):'
        
        matches = list(re.finditer(endpoint_pattern, content))
        fixed_count = 0
        
        for match in matches:
            endpoint_name = match.group(1)
            params = match.group(2)
            
            # Skip already fixed monthly_summary endpoint
            if endpoint_name == "get_monthly_summary":
                continue
                
            # Check if args and kwargs are already in the parameters
            if "args:" not in params and "kwargs:" not in params:
                fixed_params = params
                
                # Add args and kwargs parameters
                if fixed_params.strip().endswith("user)"):
                    # Parameters end with the user dependency
                    fixed_params = fixed_params.rstrip(")") + ",\n    args: Optional[str] = Query(None, description=\"Optional arguments\"),\n    kwargs: Optional[str] = Query(None, description=\"Optional keyword arguments\")\n)"
                elif fixed_params.strip().endswith(")"):
                    # No user dependency at the end
                    fixed_params = fixed_params.rstrip(")") + ",\n    args: Optional[str] = Query(None, description=\"Optional arguments\"),\n    kwargs: Optional[str] = Query(None, description=\"Optional keyword arguments\"),\n    current_user: UserResponse = Depends(get_current_user)\n)"
                else:
                    # Just append, maintaining the closing parenthesis elsewhere
                    fixed_params = fixed_params + ",\n    args: Optional[str] = Query(None, description=\"Optional arguments\"),\n    kwargs: Optional[str] = Query(None, description=\"Optional keyword arguments\")"
                
                # Replace the parameters in the content
                old_signature = f"@router.get(\"{match.group(0).split('\"')[1]}\")"
                signature_end = match.group(0).split(old_signature)[1].split(f"async def {endpoint_name}")[0]
                old_def = f"async def {endpoint_name}({params}):"
                new_def = f"async def {endpoint_name}({fixed_params}):"
                
                content = content.replace(old_def, new_def)
                fixed_count += 1
                print(f"Fixed endpoint: {endpoint_name}")
        
        # Write the fixed content back to the file
        with open(analytics_path, 'w') as f:
            f.write(content)
        
        if fixed_count > 0:
            print(f"✅ Fixed {fixed_count} analytics endpoints")
        else:
            print("No analytics endpoints needed fixing")
        
        return True
    
    except Exception as e:
        print(f"Error fixing analytics endpoints: {e}")
        return False

def update_frontend_api_calls():
    """Update frontend API calls to include args and kwargs parameters"""
    
    # List files that might contain analytics API calls
    api_files = [
        "./frontend/src/services/AnalyticsService.ts",
        "./frontend/src/utils/api.ts",
        "./frontend/src/hooks/useAnalytics.ts",
        "./frontend/src/pages/Dashboard.tsx",
        "./frontend/src/pages/Analytics.tsx",
    ]
    
    fixed_files = 0
    
    for file_path in api_files:
        if not os.path.exists(file_path):
            print(f"File not found, skipping: {file_path}")
            continue
        
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Create backup
            backup_path = f"{file_path}.bak"
            with open(backup_path, 'w') as f:
                f.write(content)
            
            # Look for analytics endpoints without args and kwargs
            patterns = [
                (r"(/analytics/[^'\"&\s]+)", r"\1?args=null&kwargs=null"),
                (r"(/analytics/[^'\"&\s]+\?[^'\"]+)", r"\1&args=null&kwargs=null")
            ]
            
            original_content = content
            
            for pattern, replacement in patterns:
                content = re.sub(pattern, replacement, content)
            
            if content != original_content:
                with open(file_path, 'w') as f:
                    f.write(content)
                fixed_files += 1
                print(f"Updated API calls in {file_path}")
        
        except Exception as e:
            print(f"Error updating {file_path}: {e}")
    
    if fixed_files > 0:
        print(f"✅ Updated API calls in {fixed_files} frontend files")
    else:
        print("No frontend files needed updating")
    
    return fixed_files > 0

if __name__ == "__main__":
    print("Fixing analytics endpoints...")
    backend_fixed = fix_analytics_endpoints()
    
    if backend_fixed:
        print("Successfully fixed backend analytics endpoints!")
    else:
        print("Failed to fix backend analytics endpoints.")
    
    sys.exit(0 if backend_fixed else 1)

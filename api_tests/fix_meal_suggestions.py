"""
Fix meal suggestion processing.

This script patches the chatbot.py file to fix the issue where meal suggestions 
are just returned as-is instead of being processed.
"""
import os
import sys
import re
import shutil
import traceback

# Ensure we're in the right directory
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(os.path.dirname(current_dir), 'backend')
chatbot_path = os.path.join(backend_dir, 'app', 'chatbot.py')

# Check if chatbot.py exists
if not os.path.exists(chatbot_path):
    print(f"Error: {chatbot_path} not found")
    sys.exit(1)

# Create a backup
backup_path = f"{chatbot_path}.bak.meal"
shutil.copy2(chatbot_path, backup_path)
print(f"Created backup at {backup_path}")

# Read the file content
with open(chatbot_path, 'r') as f:
    content = f.readlines()

# Find the meal suggestion operation code
meal_suggestion_line_start = None
meal_suggestion_line_end = None

for i, line in enumerate(content):
    if "# Check for meal suggestion operation" in line:
        meal_suggestion_line_start = i
    elif meal_suggestion_line_start is not None and "# Check for food index operation" in line:
        meal_suggestion_line_end = i
        break

if meal_suggestion_line_start is None or meal_suggestion_line_end is None:
    print("Could not find meal suggestion operation code section")
    sys.exit(1)

print(f"Found meal suggestion operation code from line {meal_suggestion_line_start} to {meal_suggestion_line_end}")

# Check if the code is actually processing the suggestions
processing_suggestions = False
for i in range(meal_suggestion_line_start, meal_suggestion_line_end):
    line = content[i]
    if "suggestions = generate_meal_suggestions" in line:
        processing_suggestions = True
        break

if processing_suggestions:
    print("Meal suggestions are already being processed. No fix needed.")
    sys.exit(0)

# Create a proper meal suggestion processor
new_meal_suggestion_code = [
    "    # Check for meal suggestion operation\n",
    "    meal_match = re.search(r\"MEAL_SUGGESTION:\\\\s*({.*})\", response, re.DOTALL)\n",
    "    if meal_match:\n",
    "        try:\n",
    "            # Extract and parse the meal data\n",
    "            meal_data_str = meal_match.group(1).replace(\"'\", '\"')\n",
    "            \n",
    "            # Fix common JSON issues in meal data\n",
    "            meal_data_str = re.sub(r',\\\\s*}', '}', meal_data_str)\n",
    "            meal_data_str = re.sub(r',\\\\s*]', ']', meal_data_str)\n",
    "            \n",
    "            # Balance braces if needed\n",
    "            open_braces = meal_data_str.count('{')\n",
    "            close_braces = meal_data_str.count('}')\n",
    "            if open_braces > close_braces:\n",
    "                meal_data_str += '}' * (open_braces - close_braces)\n",
    "            \n",
    "            print(f\"Processed meal suggestion JSON: {meal_data_str}\")\n",
    "            \n",
    "            try:\n",
    "                meal_data = json.loads(meal_data_str)\n",
    "            except json.JSONDecodeError as json_err:\n",
    "                print(f\"JSON decode error in meal suggestion: {json_err}\")\n",
    "                \n",
    "                # Try direct extraction of key fields if JSON parsing fails\n",
    "                try:\n",
    "                    # Extract meal type and preference\n",
    "                    meal_type_match = re.search(r'\"meal_type\":\\\\s*\"([^\"]+)\"', meal_data_str)\n",
    "                    preference_match = re.search(r'\"preference\":\\\\s*\"([^\"]+)\"', meal_data_str)\n",
    "                    \n",
    "                    # Extract remaining macros\n",
    "                    calories_match = re.search(r'\"calories\":\\\\s*(\\\\d+)', meal_data_str)\n",
    "                    protein_match = re.search(r'\"protein\":\\\\s*(\\\\d+)', meal_data_str)\n",
    "                    carbs_match = re.search(r'\"carbs\":\\\\s*(\\\\d+)', meal_data_str)\n",
    "                    fat_match = re.search(r'\"fat\":\\\\s*(\\\\d+)', meal_data_str)\n",
    "                    \n",
    "                    # Build a simplified object\n",
    "                    meal_data = {\n",
    "                        \"meal_type\": meal_type_match.group(1) if meal_type_match else \"dinner\",\n",
    "                        \"time_of_day\": \"evening\",\n",
    "                        \"preference\": preference_match.group(1) if preference_match else \"balanced\"\n",
    "                    }\n",
    "                    \n",
    "                    # Add remaining macros if available\n",
    "                    if calories_match or protein_match or carbs_match or fat_match:\n",
    "                        meal_data[\"remaining_macros\"] = {\n",
    "                            \"calories\": int(calories_match.group(1)) if calories_match else 600,\n",
    "                            \"protein\": int(protein_match.group(1)) if protein_match else 30,\n",
    "                            \"carbs\": int(carbs_match.group(1)) if carbs_match else 60,\n",
    "                            \"fat\": int(fat_match.group(1)) if fat_match else 20\n",
    "                        }\n",
    "                    else:\n",
    "                        meal_data[\"remaining_macros\"] = {\n",
    "                            \"calories\": 600,\n",
    "                            \"protein\": 30,\n",
    "                            \"carbs\": 60,\n",
    "                            \"fat\": 20\n",
    "                        }\n",
    "                    \n",
    "                    print(f\"Reconstructed meal data: {meal_data}\")\n",
    "                except Exception as e:\n",
    "                    print(f\"Failed to reconstruct meal data: {e}\")\n",
    "                    # Use default values as last resort\n",
    "                    meal_data = {\n",
    "                        \"meal_type\": \"dinner\",\n",
    "                        \"time_of_day\": \"evening\",\n",
    "                        \"preference\": \"balanced\",\n",
    "                        \"remaining_macros\": {\n",
    "                            \"calories\": 600,\n",
    "                            \"protein\": 30,\n",
    "                            \"carbs\": 60,\n",
    "                            \"fat\": 20\n",
    "                        }\n",
    "                    }\n",
    "            \n",
    "            # Process meal suggestion\n",
    "            try:\n",
    "                # Validate required fields\n",
    "                required_fields = [\"meal_type\", \"time_of_day\"]\n",
    "                for field in required_fields:\n",
    "                    if field not in meal_data:\n",
    "                        raise ValueError(f\"Missing required field: {field}\")\n",
    "                \n",
    "                # Get meal suggestions based on request\n",
    "                from app.meal_suggestions import generate_meal_suggestions, MealSuggestionRequest, RemainingMacros\n",
    "                \n",
    "                # Handle the case when remaining_macros might be missing or malformed\n",
    "                if \"remaining_macros\" not in meal_data or not isinstance(meal_data[\"remaining_macros\"], dict):\n",
    "                    meal_data[\"remaining_macros\"] = {\n",
    "                        \"calories\": 600,\n",
    "                        \"protein\": 30,\n",
    "                        \"carbs\": 60,\n",
    "                        \"fat\": 20\n",
    "                    }\n",
    "                \n",
    "                # Ensure all fields are present in remaining_macros\n",
    "                for field in [\"calories\", \"protein\", \"carbs\", \"fat\"]:\n",
    "                    if field not in meal_data[\"remaining_macros\"]:\n",
    "                        meal_data[\"remaining_macros\"][field] = {\"calories\": 600, \"protein\": 30, \"carbs\": 60, \"fat\": 20}[field]\n",
    "                \n",
    "                # Create remaining macros object\n",
    "                remaining_macros = RemainingMacros(\n",
    "                    calories=meal_data[\"remaining_macros\"][\"calories\"],\n",
    "                    protein=meal_data[\"remaining_macros\"][\"protein\"],\n",
    "                    carbs=meal_data[\"remaining_macros\"][\"carbs\"],\n",
    "                    fat=meal_data[\"remaining_macros\"][\"fat\"]\n",
    "                )\n",
    "                \n",
    "                # Create the request\n",
    "                request = MealSuggestionRequest(\n",
    "                    meal_type=meal_data[\"meal_type\"],\n",
    "                    time_of_day=meal_data[\"time_of_day\"],\n",
    "                    preference=meal_data.get(\"preference\", \"balanced\"),\n",
    "                    remaining_macros=remaining_macros,\n",
    "                    specific_ingredients=meal_data.get(\"specific_ingredients\", []),\n",
    "                    dietary_restrictions=[],\n",
    "                    use_food_database=True\n",
    "                )\n",
    "                \n",
    "                # Generate suggestions\n",
    "                suggestions = generate_meal_suggestions(request)\n",
    "                max_suggestions = 3\n",
    "                suggestions_to_show = suggestions[:max_suggestions]\n",
    "                \n",
    "                # Format suggestions as text\n",
    "                suggestions_text = f\"Here are some meal suggestions for your {meal_data['meal_type']}:\\n\\n\"\n",
    "                \n",
    "                for i, suggestion in enumerate(suggestions_to_show):\n",
    "                    suggestions_text += f\"**{i+1}. {suggestion.name}**\\n\"\n",
    "                    suggestions_text += f\"- **Serving:** {suggestion.serving_info}\\n\"\n",
    "                    suggestions_text += f\"- Calories: {suggestion.macros.calories:.0f}, \"\n",
    "                    suggestions_text += f\"Protein: {suggestion.macros.protein:.1f}g, \"\n",
    "                    suggestions_text += f\"Carbs: {suggestion.macros.carbs:.1f}g, \"\n",
    "                    suggestions_text += f\"Fat: {suggestion.macros.fat:.1f}g\\n\"\n",
    "                    suggestions_text += f\"- {suggestion.description}\\n\\n\"\n",
    "                \n",
    "                # Replace the command with the meal suggestions\n",
    "                clean_response = re.sub(r\"MEAL_SUGGESTION:\\\\s*({.*})\", suggestions_text, response, flags=re.DOTALL)\n",
    "                return clean_response\n",
    "            except Exception as e:\n",
    "                print(f\"Error generating meal suggestions: {e}\")\n",
    "                traceback.print_exc()\n",
    "                clean_response = re.sub(r\"MEAL_SUGGESTION:\\\\s*({.*})\", \n",
    "                                        f\"I couldn't generate meal suggestions due to an error: {str(e)}\", \n",
    "                                        response, flags=re.DOTALL)\n",
    "                return clean_response\n",
    "        except Exception as e:\n",
    "            print(f\"Error processing meal suggestion: {e}\")\n",
    "            traceback.print_exc()\n",
    "            clean_response = re.sub(r\"MEAL_SUGGESTION:\\\\s*({.*})\", \n",
    "                                    f\"I couldn't generate meal suggestions due to an error: {str(e)}\", \n",
    "                                    response, flags=re.DOTALL)\n",
    "            return clean_response\n"
]

# Replace the meal suggestion operation code
content[meal_suggestion_line_start:meal_suggestion_line_end] = new_meal_suggestion_code

# Write the updated content
with open(chatbot_path, 'w') as f:
    f.writelines(content)

print("Successfully updated meal suggestion processing code")

# Test the fix
print("You can now test the meal suggestion processing by running 'python test_meal_suggestion.py'")
print("Or test all functionality with 'python test_individual.py'") 
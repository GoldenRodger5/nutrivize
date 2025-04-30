#!/usr/bin/env python3
import json
import sys

def main():
    with open('response.json', 'r') as f:
        data = json.load(f)

    # Extract first ingredient from first meal
    meal = data['suggestions'][0]
    ingredient = meal['ingredients'][0]

    print(f"Meal name: {meal['name']}\n")
    print(f"Ingredient: {ingredient['name']}")
    print(f"Amount: {ingredient['amount']} {ingredient['unit']}")
    print(f"In food index: {ingredient['in_food_index']}")
    print(f"Needs indexing: {ingredient['needs_indexing']}")
    print(f"\nMacro information:")
    print(f"Calories: {ingredient['macros']['calories']}")
    print(f"Protein: {ingredient['macros']['protein']}g")
    print(f"Carbs: {ingredient['macros']['carbs']}g")
    print(f"Fat: {ingredient['macros']['fat']}g")

    print(f"\nUnit conversion simulation:")
    original_amount = ingredient['amount']
    if ingredient['unit'] == 'g':
        # Convert to ounces (g * 0.035274)
        oz_amount = original_amount * 0.035274
        print(f"{original_amount}g = {oz_amount:.1f}oz")
        # Simulate doubling the amount
        print(f"\nAmount change simulation:")
        print(f"Original: {original_amount}g = {ingredient['macros']['calories']} calories")
        print(f"Doubled: {original_amount * 2}g = {ingredient['macros']['calories'] * 2} calories")
        
        # Show calories per gram calculation
        cal_per_gram = ingredient['macros']['calories'] / original_amount
        print(f"\nCalories per gram: {cal_per_gram:.2f}")
        print(f"For 170g: {cal_per_gram * 170:.1f} calories")

if __name__ == "__main__":
    main() 
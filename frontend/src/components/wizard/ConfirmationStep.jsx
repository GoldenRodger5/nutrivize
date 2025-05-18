import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Alert,
  Chip
} from '@mui/material';

const ConfirmationStep = ({ data, updateData }) => {
  // Convert macro percentages to grams based on calorie target
  const calculateMacroGrams = () => {
    const calories = data.calorieTarget || 2000;
    
    // Protein: 4 calories per gram
    const proteinGrams = Math.round((calories * (data.proteinPercentage || 30) / 100) / 4);
    
    // Carbs: 4 calories per gram
    const carbsGrams = Math.round((calories * (data.carbsPercentage || 40) / 100) / 4);
    
    // Fat: 9 calories per gram
    const fatGrams = Math.round((calories * (data.fatPercentage || 30) / 100) / 9);
    
    return { proteinGrams, carbsGrams, fatGrams };
  };

  const { proteinGrams, carbsGrams, fatGrams } = calculateMacroGrams();

  // Format weight goal text
  const getWeightGoalText = () => {
    if (!data.weightGoal) return 'Not specified';
    
    if (data.weightGoal === 'maintain') {
      return 'Maintain current weight';
    } else if (data.weightGoal === 'lose') {
      return `Lose ${data.weeklyWeightLossTarget || 0.5} kg per week`;
    } else if (data.weightGoal === 'gain') {
      return `Gain ${data.weeklyWeightGainTarget || 0.3} kg per week`;
    }
    
    return data.weightGoal;
  };

  // Get activity level label
  const getActivityLevelLabel = () => {
    const activityLevels = {
      sedentary: 'Sedentary (little or no exercise)',
      light: 'Lightly active (light exercise 1-3 days/week)',
      moderate: 'Moderately active (moderate exercise 3-5 days/week)',
      active: 'Active (hard exercise 6-7 days/week)',
      very_active: 'Very active (very hard exercise & physical job)'
    };
    
    return activityLevels[data.activityLevel] || data.activityLevel || 'Not specified';
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Review Your Plan
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Please review your information before finalizing your nutrition profile.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Personal Information
            </Typography>
            <List dense disablePadding>
              <ListItem>
                <ListItemText 
                  primary="Age" 
                  secondary={data.age || 'Not specified'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Gender" 
                  secondary={data.gender || 'Not specified'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Height" 
                  secondary={data.height ? `${data.height} cm` : 'Not specified'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Weight" 
                  secondary={data.weight ? `${data.weight} kg` : 'Not specified'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Activity Level" 
                  secondary={getActivityLevelLabel()} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Nutrition Goals
            </Typography>
            <List dense disablePadding>
              <ListItem>
                <ListItemText 
                  primary="Weight Goal" 
                  secondary={getWeightGoalText()} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Daily Calories" 
                  secondary={data.calorieTarget ? `${data.calorieTarget} kcal` : 'Calculated based on stats'} 
                />
              </ListItem>
              <Divider sx={{ my: 1 }} />
              <ListItem>
                <ListItemText 
                  primary="Protein" 
                  secondary={`${data.proteinPercentage || 30}% (${proteinGrams}g)`} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Carbohydrates" 
                  secondary={`${data.carbsPercentage || 40}% (${carbsGrams}g)`} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Fat" 
                  secondary={`${data.fatPercentage || 30}% (${fatGrams}g)`} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Dietary Preferences
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Dietary Style
                </Typography>
                <Chip 
                  label={data.dietaryStyle ? data.dietaryStyle.charAt(0).toUpperCase() + data.dietaryStyle.slice(1) : 'Not specified'} 
                  color="primary" 
                  variant="outlined"
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Meals Per Day
                </Typography>
                <Typography>{data.mealsPerDay || 3}</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Food Allergies & Intolerances
                </Typography>
                {data.allergies && data.allergies.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {data.allergies.map((allergy, index) => (
                      <Chip key={index} label={allergy} size="small" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">None specified</Typography>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Foods to Avoid
                </Typography>
                {data.foodAvoidances && data.foodAvoidances.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {data.foodAvoidances.map((food, index) => (
                      <Chip key={index} label={food} size="small" />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" color="textSecondary">None specified</Typography>
                )}
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Favorite Foods
                </Typography>
                <Typography variant="body2">
                  {data.favoriteFoods || 'None specified'}
                </Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Additional Preferences
                </Typography>
                <Typography variant="body2">
                  {data.additionalPreferences || 'None specified'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Alert severity="info">
            Review your information carefully. You can go back to make any changes before finalizing your profile.
          </Alert>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ConfirmationStep; 
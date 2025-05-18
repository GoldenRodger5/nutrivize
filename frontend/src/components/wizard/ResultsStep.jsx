import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';

const ResultsStep = ({ userData }) => {
  const { basicInfo, weightGoal, nutritionGoal, dietaryPreferences, calculatedValues } = userData;

  // Calculate BMI
  const calculateBMI = () => {
    if (!basicInfo.weight || !basicInfo.height) return { value: null, category: 'Unknown' };
    
    // Height in meters (convert from cm)
    const heightInMeters = basicInfo.height / 100;
    const bmi = basicInfo.weight / (heightInMeters * heightInMeters);
    const roundedBMI = Math.round(bmi * 10) / 10;
    
    let category;
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal weight';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';
    
    return { value: roundedBMI, category };
  };

  const bmi = calculateBMI();

  // Calculate macro details
  const calculateMacroDetails = () => {
    const dailyCalories = nutritionGoal.dailyCalories || calculatedValues.goalCalories || 0;
    const { protein, carbs, fat } = nutritionGoal.macroDistribution || { protein: 30, carbs: 40, fat: 30 };
    
    const proteinCalories = dailyCalories * (protein / 100);
    const carbsCalories = dailyCalories * (carbs / 100);
    const fatCalories = dailyCalories * (fat / 100);
    
    // Convert to grams (protein: 4 cal/g, carbs: 4 cal/g, fat: 9 cal/g)
    const proteinGrams = Math.round(proteinCalories / 4);
    const carbsGrams = Math.round(carbsCalories / 4);
    const fatGrams = Math.round(fatCalories / 9);
    
    return {
      protein: { percentage: protein, calories: Math.round(proteinCalories), grams: proteinGrams },
      carbs: { percentage: carbs, calories: Math.round(carbsCalories), grams: carbsGrams },
      fat: { percentage: fat, calories: Math.round(fatCalories), grams: fatGrams }
    };
  };

  const macros = calculateMacroDetails();

  // Format weight projections
  const calculateWeightProjections = () => {
    if (weightGoal.goalType === 'maintain') {
      return [{ week: 'Current', weight: basicInfo.weight }];
    }
    
    const projections = [];
    let currentWeight = basicInfo.weight;
    const targetWeight = weightGoal.targetWeight;
    const weeklyRate = weightGoal.weeklyRate || 0.5;
    const isLosing = weightGoal.goalType === 'lose';
    
    // Current weight
    projections.push({ week: 'Current', weight: currentWeight });
    
    // Project for 12 weeks
    for (let i = 1; i <= 12; i++) {
      const weightChange = weeklyRate * i;
      const projectedWeight = isLosing 
        ? Math.max(currentWeight - weightChange, targetWeight)
        : Math.min(currentWeight + weightChange, targetWeight);
      
      projections.push({ week: `Week ${i}`, weight: projectedWeight.toFixed(1) });
      
      // Stop if we've reached target weight
      if (isLosing && projectedWeight <= targetWeight) break;
      if (!isLosing && projectedWeight >= targetWeight) break;
    }
    
    return projections;
  };

  const weightProjections = calculateWeightProjections();

  // Calculate estimated time to goal
  const calculateTimeToGoal = () => {
    if (weightGoal.goalType === 'maintain') return 'Ongoing maintenance';
    
    const weightDifference = Math.abs(basicInfo.weight - weightGoal.targetWeight);
    const weeklyRate = weightGoal.weeklyRate || 0.5;
    const weeksToGoal = Math.ceil(weightDifference / weeklyRate);
    
    if (weeksToGoal <= 1) return 'About 1 week';
    if (weeksToGoal < 4) return `About ${weeksToGoal} weeks`;
    
    const months = Math.round(weeksToGoal / 4.3);
    return `About ${months} month${months === 1 ? '' : 's'}`;
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Personalized Nutrition Plan
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Based on your information, we've calculated the following nutrition plan and goals.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Energy Needs
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Basal Metabolic Rate (BMR)</Typography>
                <Typography variant="h6">{calculatedValues.bmr || 'N/A'} calories</Typography>
                <Typography variant="caption">Calories your body needs at rest</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Total Daily Energy</Typography>
                <Typography variant="h6">{calculatedValues.tdee || 'N/A'} calories</Typography>
                <Typography variant="caption">Calories your body burns daily</Typography>
              </Grid>
              
              <Grid item xs={12}>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <Typography variant="body2" color="textSecondary">Daily Calorie Target</Typography>
                  <Typography variant="h5" color="primary">
                    {calculatedValues.goalCalories || nutritionGoal.dailyCalories || 'N/A'} calories
                  </Typography>
                  <Typography variant="caption">
                    Based on your {weightGoal.goalType === 'lose' ? 'weight loss' : 
                                 weightGoal.goalType === 'gain' ? 'weight gain' : 
                                 'weight maintenance'} goals
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>
              Body Metrics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Current Weight</Typography>
                <Typography variant="h6">{basicInfo.weight || 'N/A'} kg</Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Goal Weight</Typography>
                <Typography variant="h6">
                  {weightGoal.goalType === 'maintain' ? 'Maintain current' : weightGoal.targetWeight || 'N/A'} kg
                </Typography>
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">BMI</Typography>
                <Typography variant="h6">{bmi.value || 'N/A'}</Typography>
                <Chip 
                  label={bmi.category} 
                  size="small"
                  color={
                    bmi.category === 'Normal weight' ? 'success' :
                    bmi.category === 'Underweight' || bmi.category === 'Overweight' ? 'warning' :
                    bmi.category === 'Obese' ? 'error' : 'default'
                  }
                />
              </Grid>
              
              <Grid item xs={6}>
                <Typography variant="body2" color="textSecondary">Goal Timeline</Typography>
                <Typography variant="h6">{calculateTimeToGoal()}</Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Macronutrient Distribution
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Nutrient</TableCell>
                    <TableCell align="center">Percentage</TableCell>
                    <TableCell align="center">Calories</TableCell>
                    <TableCell align="right">Grams per day</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell>Protein</TableCell>
                    <TableCell align="center">{macros.protein.percentage}%</TableCell>
                    <TableCell align="center">{macros.protein.calories} cal</TableCell>
                    <TableCell align="right">{macros.protein.grams}g</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Carbohydrates</TableCell>
                    <TableCell align="center">{macros.carbs.percentage}%</TableCell>
                    <TableCell align="center">{macros.carbs.calories} cal</TableCell>
                    <TableCell align="right">{macros.carbs.grams}g</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Fat</TableCell>
                    <TableCell align="center">{macros.fat.percentage}%</TableCell>
                    <TableCell align="center">{macros.fat.calories} cal</TableCell>
                    <TableCell align="right">{macros.fat.grams}g</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="textSecondary" gutterBottom>
                Macronutrient Distribution
              </Typography>
              <Box sx={{ display: 'flex', height: 24, width: '100%', overflow: 'hidden', borderRadius: 1 }}>
                <Box sx={{ 
                  width: `${macros.protein.percentage}%`, 
                  bgcolor: '#4caf50', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {macros.protein.percentage > 10 ? 'Protein' : ''}
                </Box>
                <Box sx={{ 
                  width: `${macros.carbs.percentage}%`, 
                  bgcolor: '#2196f3', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {macros.carbs.percentage > 10 ? 'Carbs' : ''}
                </Box>
                <Box sx={{ 
                  width: `${macros.fat.percentage}%`, 
                  bgcolor: '#ffc107', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'black',
                  fontSize: '0.75rem',
                  fontWeight: 'bold'
                }}>
                  {macros.fat.percentage > 10 ? 'Fat' : ''}
                </Box>
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Weight Projection
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Time Period</TableCell>
                    <TableCell align="right">Projected Weight (kg)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {weightProjections.map((projection, index) => (
                    <TableRow key={index}>
                      <TableCell>{projection.week}</TableCell>
                      <TableCell align="right">{projection.weight}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
              * Projections are estimates based on your goals and may vary based on individual factors.
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper elevation={0} variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Diet Recommendations
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  <strong>Dietary Type:</strong> {dietaryPreferences.dietType || 'Standard'}
                </Typography>
              </Grid>
              
              {dietaryPreferences.allergies && dietaryPreferences.allergies.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Foods to Avoid (Allergies):</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {dietaryPreferences.allergies.map((allergy, index) => (
                      <Chip key={index} label={allergy} size="small" color="error" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              )}
              
              {dietaryPreferences.excludedFoods && dietaryPreferences.excludedFoods.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Foods to Limit:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {dietaryPreferences.excludedFoods.map((food, index) => (
                      <Chip key={index} label={food} size="small" color="warning" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              )}
              
              {dietaryPreferences.preferredFoods && dietaryPreferences.preferredFoods.length > 0 && (
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Foods to Include:</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {dietaryPreferences.preferredFoods.map((food, index) => (
                      <Chip key={index} label={food} size="small" color="success" variant="outlined" />
                    ))}
                  </Box>
                </Grid>
              )}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ResultsStep; 
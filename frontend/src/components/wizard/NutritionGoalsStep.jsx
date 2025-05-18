import React from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  TextField,
  InputAdornment,
  Slider,
  Divider,
  Paper,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';

const NutritionGoalsStep = ({ data, updateData, calculatedValues }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    updateData({ [name]: value === '' ? '' : Number(value) });
  };

  const handleSliderChange = (name) => (e, newValue) => {
    updateData({ [name]: newValue });
  };

  const handleToggleChange = (name) => (e, newValue) => {
    if (newValue !== null) {
      updateData({ [name]: newValue });
    }
  };

  // Calculate macronutrient distribution
  const totalPercentage = (data.proteinPercentage || 30) + 
                          (data.carbsPercentage || 40) + 
                          (data.fatPercentage || 30);
  
  const isBalanced = totalPercentage === 100;

  // Update calorieTarget when calculatedValues change or when user toggles calculated mode
  React.useEffect(() => {
    if (data.useCalculatedCalories && calculatedValues.goalCalories) {
      updateData({ calorieTarget: calculatedValues.goalCalories });
    }
  }, [calculatedValues.goalCalories, data.useCalculatedCalories]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Nutrition & Weight Goals
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Tell us about your nutritional goals so we can customize your meal plan.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Weight Management Goal
            </Typography>

            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                name="weightGoal"
                value={data.weightGoal || 'maintain'}
                onChange={handleChange}
              >
                <FormControlLabel 
                  value="lose" 
                  control={<Radio />} 
                  label="Lose Weight"
                />
                <FormControlLabel 
                  value="maintain" 
                  control={<Radio />} 
                  label="Maintain Current Weight" 
                />
                <FormControlLabel 
                  value="gain" 
                  control={<Radio />} 
                  label="Gain Weight" 
                />
              </RadioGroup>
            </FormControl>

            {data.weightGoal === 'lose' && (
              <Box mt={2}>
                <Typography gutterBottom>
                  Target Weekly Weight Loss
                </Typography>
                <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                  Recommended: 0.5-1kg per week for sustainable weight loss
                </Typography>
                <Slider
                  value={data.weeklyWeightLossTarget || 0.5}
                  onChange={handleSliderChange('weeklyWeightLossTarget')}
                  step={0.1}
                  min={0.2}
                  max={1.5}
                  marks={[
                    { value: 0.2, label: '0.2kg' },
                    { value: 0.5, label: '0.5kg' },
                    { value: 1, label: '1kg' },
                    { value: 1.5, label: '1.5kg' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}kg/week`}
                />
              </Box>
            )}

            {data.weightGoal === 'gain' && (
              <Box mt={2}>
                <Typography gutterBottom>
                  Target Weekly Weight Gain
                </Typography>
                <Typography variant="caption" color="textSecondary" gutterBottom display="block">
                  Recommended: 0.2-0.5kg per week for healthy muscle gain
                </Typography>
                <Slider
                  value={data.weeklyWeightGainTarget || 0.3}
                  onChange={handleSliderChange('weeklyWeightGainTarget')}
                  step={0.1}
                  min={0.1}
                  max={1}
                  marks={[
                    { value: 0.1, label: '0.1kg' },
                    { value: 0.3, label: '0.3kg' },
                    { value: 0.5, label: '0.5kg' },
                    { value: 1, label: '1kg' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}kg/week`}
                />
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Target Calorie Intake
            </Typography>
            <Typography variant="caption" color="textSecondary" paragraph>
              We'll calculate a recommended calorie target based on your stats, but you can override it if you prefer.
            </Typography>

            <FormControl fullWidth>
              <ToggleButtonGroup
                exclusive
                value={data.useCalculatedCalories ? 'calculated' : 'custom'}
                onChange={(e, value) => {
                  if (value) {
                    updateData({ 
                      useCalculatedCalories: value === 'calculated',
                      calorieTarget: value === 'calculated' ? calculatedValues.goalCalories : data.calorieTarget
                    });
                  }
                }}
                fullWidth
              >
                <ToggleButton value="calculated">Calculated (Recommended)</ToggleButton>
                <ToggleButton value="custom">Custom</ToggleButton>
              </ToggleButtonGroup>
            </FormControl>

            {data.useCalculatedCalories && (
              <Box mt={2}>
                <Typography variant="body1" color="textSecondary">
                  Recommended calories: <strong>{calculatedValues.goalCalories} kcal</strong>
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Based on your body metrics and activity level
                </Typography>
              </Box>
            )}

            {!data.useCalculatedCalories && (
              <Box mt={2}>
                <TextField
                  fullWidth
                  label="Daily Calorie Target"
                  name="calorieTarget"
                  type="number"
                  InputProps={{
                    endAdornment: <InputAdornment position="end">kcal</InputAdornment>,
                    inputProps: { min: 1200, max: 5000 }
                  }}
                  value={data.calorieTarget || ''}
                  onChange={handleNumberChange}
                  helperText="Enter your desired daily calorie intake"
                />
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Macronutrient Distribution
            </Typography>
            <Typography variant="caption" color="textSecondary" paragraph>
              Adjust your preferred macronutrient ratio (protein, carbs, fat)
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography gutterBottom>
                  Protein: {data.proteinPercentage || 30}%
                </Typography>
                <Slider
                  value={data.proteinPercentage || 30}
                  onChange={handleSliderChange('proteinPercentage')}
                  step={5}
                  min={10}
                  max={60}
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>
                  Carbohydrates: {data.carbsPercentage || 40}%
                </Typography>
                <Slider
                  value={data.carbsPercentage || 40}
                  onChange={handleSliderChange('carbsPercentage')}
                  step={5}
                  min={10}
                  max={70}
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography gutterBottom>
                  Fat: {data.fatPercentage || 30}%
                </Typography>
                <Slider
                  value={data.fatPercentage || 30}
                  onChange={handleSliderChange('fatPercentage')}
                  step={5}
                  min={10}
                  max={60}
                  valueLabelDisplay="auto"
                />
              </Grid>

              <Grid item xs={12}>
                <Typography 
                  variant="body2" 
                  color={isBalanced ? "textSecondary" : "error"}
                  align="center"
                >
                  {isBalanced 
                    ? "Your macronutrient distribution is balanced (100%)" 
                    : `Total: ${totalPercentage}% (should equal 100%)`}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Additional Nutritional Goals (Optional)"
            name="additionalNutritionGoals"
            value={data.additionalNutritionGoals || ''}
            onChange={handleChange}
            placeholder="E.g., increase protein intake, reduce sugar, eat more vegetables, etc."
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default NutritionGoalsStep; 
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
  Slider,
  InputAdornment,
  Paper,
  Card,
  CardContent,
  Alert
} from '@mui/material';

const WeightGoalStep = ({ data, updateData, currentWeight }) => {
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

  // Calculate estimated time to goal
  const calculateTimeToGoal = () => {
    if (data.goalType === 'maintain' || !data.targetWeight || !currentWeight) {
      return null;
    }
    
    const weightDifference = Math.abs(currentWeight - data.targetWeight);
    const weeklyRate = data.goalType === 'lose' 
      ? (data.weeklyWeightLossTarget || 0.5)
      : (data.weeklyWeightGainTarget || 0.3);
    
    const weeksToGoal = Math.ceil(weightDifference / weeklyRate);
    
    if (weeksToGoal <= 1) return '1 week';
    if (weeksToGoal < 4) return `${weeksToGoal} weeks`;
    
    const months = Math.round(weeksToGoal / 4.3);
    return `${months} month${months === 1 ? '' : 's'}`;
  };

  const timeToGoal = calculateTimeToGoal();

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Weight Management Goals
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Setting realistic weight goals helps create a sustainable nutrition plan tailored to your needs.
      </Typography>

      <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          What would you like to achieve?
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                name="goalType"
                value={data.goalType || 'maintain'}
                onChange={handleChange}
              >
                <FormControlLabel 
                  value="lose" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1">Lose Weight</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Reduce body weight through calorie deficit
                      </Typography>
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="maintain" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1">Maintain Weight</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Keep current weight while improving nutrition
                      </Typography>
                    </Box>
                  } 
                />
                <FormControlLabel 
                  value="gain" 
                  control={<Radio />} 
                  label={
                    <Box>
                      <Typography variant="body1">Gain Weight</Typography>
                      <Typography variant="caption" color="textSecondary">
                        Build muscle and increase body weight
                      </Typography>
                    </Box>
                  } 
                />
              </RadioGroup>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {data.goalType === 'lose' && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Weight Loss Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Target Weight"
                name="targetWeight"
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  inputProps: { min: 30, max: currentWeight > 30 ? currentWeight - 1 : 30 }
                }}
                value={data.targetWeight || ''}
                onChange={handleNumberChange}
                helperText={`Current weight: ${currentWeight || '?'} kg`}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>
                Weekly Weight Loss Target
              </Typography>
              <Slider
                value={data.weeklyWeightLossTarget || 0.5}
                onChange={handleSliderChange('weeklyWeightLossTarget')}
                step={0.1}
                min={0.2}
                max={1}
                marks={[
                  { value: 0.2, label: '0.2kg' },
                  { value: 0.5, label: '0.5kg' },
                  { value: 1, label: '1kg' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}kg/week`}
              />
              <Typography variant="caption" color="textSecondary">
                Recommended: 0.5-1 kg per week for sustainable weight loss
              </Typography>
            </Grid>
            
            {data.weeklyWeightLossTarget > 0.75 && (
              <Grid item xs={12}>
                <Alert severity="warning">
                  Weight loss rates above 0.75kg per week may be difficult to sustain long-term and could lead to nutritional deficiencies.
                </Alert>
              </Grid>
            )}
            
            {timeToGoal && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Estimated Time to Goal
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {timeToGoal}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      To lose {(currentWeight - data.targetWeight).toFixed(1)} kg at {data.weeklyWeightLossTarget} kg per week
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {data.goalType === 'gain' && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Weight Gain Details
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Target Weight"
                name="targetWeight"
                type="number"
                InputProps={{
                  endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  inputProps: { min: currentWeight ? currentWeight + 1 : 40, max: 150 }
                }}
                value={data.targetWeight || ''}
                onChange={handleNumberChange}
                helperText={`Current weight: ${currentWeight || '?'} kg`}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>
                Weekly Weight Gain Target
              </Typography>
              <Slider
                value={data.weeklyWeightGainTarget || 0.3}
                onChange={handleSliderChange('weeklyWeightGainTarget')}
                step={0.1}
                min={0.1}
                max={0.7}
                marks={[
                  { value: 0.1, label: '0.1kg' },
                  { value: 0.3, label: '0.3kg' },
                  { value: 0.5, label: '0.5kg' }
                ]}
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}kg/week`}
              />
              <Typography variant="caption" color="textSecondary">
                Recommended: 0.2-0.5 kg per week for healthy muscle gain
              </Typography>
            </Grid>
            
            {data.weeklyWeightGainTarget > 0.5 && (
              <Grid item xs={12}>
                <Alert severity="info">
                  For optimal muscle growth with minimal fat gain, a moderate weight gain rate of 0.25-0.5kg per week is typically recommended.
                </Alert>
              </Grid>
            )}
            
            {timeToGoal && (
              <Grid item xs={12}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Estimated Time to Goal
                    </Typography>
                    <Typography variant="h6" color="primary">
                      {timeToGoal}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      To gain {(data.targetWeight - currentWeight).toFixed(1)} kg at {data.weeklyWeightGainTarget} kg per week
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}

      {data.goalType === 'maintain' && (
        <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Weight Maintenance
          </Typography>
          
          <Typography paragraph>
            You've chosen to maintain your current weight of {currentWeight || '?'} kg while focusing on balanced nutrition.
          </Typography>
          
          <Alert severity="info">
            Maintaining weight requires balancing calories consumed with calories burned. We'll help you create a nutrition plan that maintains your weight while meeting your nutrient needs.
          </Alert>
        </Paper>
      )}
    </Box>
  );
};

export default WeightGoalStep; 
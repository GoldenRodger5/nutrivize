import React from 'react';
import {
  Box,
  Typography,
  FormControl,
  RadioGroup,
  FormControlLabel,
  Radio,
  TextField,
  Slider,
  Grid,
  InputAdornment,
  Chip,
  Stack
} from '@mui/material';

const UserGoalsStep = ({ data, updateData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };
  
  const handleSliderChange = (name) => (e, newValue) => {
    updateData({ [name]: newValue });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || !isNaN(value)) {
      updateData({ [name]: value });
    }
  };

  const handleGoalChipClick = (goal) => {
    const currentGoals = data.healthGoals || [];
    const updatedGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    
    updateData({ healthGoals: updatedGoals });
  };

  const healthGoalOptions = [
    'Lose weight',
    'Build muscle',
    'Improve endurance',
    'Better sleep',
    'Reduce stress',
    'Lower cholesterol',
    'Lower blood pressure',
    'Increase energy',
    'Improve digestion',
    'Manage medical condition'
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Health Goals
      </Typography>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Weight Goal
        </Typography>
        <RadioGroup
          name="weightGoal"
          value={data.weightGoal || 'maintain'}
          onChange={handleChange}
          sx={{ mb: 2 }}
        >
          <FormControlLabel 
            value="lose" 
            control={<Radio />} 
            label="Lose weight" 
          />
          <FormControlLabel 
            value="maintain" 
            control={<Radio />} 
            label="Maintain current weight" 
          />
          <FormControlLabel 
            value="gain" 
            control={<Radio />} 
            label="Gain weight" 
          />
        </RadioGroup>

        {data.weightGoal === 'lose' || data.weightGoal === 'gain' ? (
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Target Weight"
                name="targetWeight"
                type="number"
                value={data.targetWeight || ''}
                onChange={handleNumberChange}
                InputProps={{
                  endAdornment: <InputAdornment position="end">kg</InputAdornment>,
                  inputProps: { min: 30, max: 250 }
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ width: '100%' }}>
                <Typography gutterBottom>
                  Weekly {data.weightGoal === 'lose' ? 'Loss' : 'Gain'} Rate
                </Typography>
                <Slider
                  name="weightChangeRate"
                  value={data.weightChangeRate || 0.5}
                  onChange={handleSliderChange('weightChangeRate')}
                  step={0.1}
                  marks={[
                    { value: 0.1, label: '0.1kg' },
                    { value: 0.5, label: '0.5kg' },
                    { value: 1, label: '1kg' },
                  ]}
                  min={0.1}
                  max={1}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}kg per week`}
                />
              </Box>
            </Grid>
          </Grid>
        ) : null}
      </Box>

      <Box sx={{ mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Select your health goals (choose all that apply)
        </Typography>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {healthGoalOptions.map((goal) => (
            <Chip
              key={goal}
              label={goal}
              onClick={() => handleGoalChipClick(goal)}
              color={data.healthGoals?.includes(goal) ? "primary" : "default"}
              sx={{ m: 0.5 }}
              clickable
            />
          ))}
        </Stack>
      </Box>

      <Box>
        <Typography variant="subtitle1" gutterBottom>
          Is there anything else you'd like to achieve?
        </Typography>
        <TextField
          fullWidth
          name="otherGoals"
          value={data.otherGoals || ''}
          onChange={handleChange}
          multiline
          rows={3}
          placeholder="Describe any other health or nutrition goals you have..."
        />
      </Box>
    </Box>
  );
};

export default UserGoalsStep; 
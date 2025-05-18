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
  Chip,
  Stack
} from '@mui/material';

const GoalsStep = ({ data, updateData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  const handleSliderChange = (name) => (e, newValue) => {
    updateData({ [name]: newValue });
  };

  const handleGoalSelection = (goal) => () => {
    const currentGoals = data.secondaryGoals || [];
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    
    updateData({ secondaryGoals: newGoals });
  };

  const secondaryGoalOptions = [
    'Improve energy levels',
    'Better sleep',
    'Reduce inflammation',
    'Improve digestive health',
    'Enhance athletic performance',
    'Better mental clarity',
    'Manage specific health condition',
    'Meal planning and prep',
    'Healthier eating habits',
    'Reduce cravings'
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Health Goals
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Let us know what you're hoping to achieve with your nutrition plan.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Primary Goal</FormLabel>
            <RadioGroup
              name="primaryGoal"
              value={data.primaryGoal || ''}
              onChange={handleChange}
            >
              <FormControlLabel value="loseWeight" control={<Radio />} label="Lose weight" />
              <FormControlLabel value="maintainWeight" control={<Radio />} label="Maintain weight" />
              <FormControlLabel value="gainWeight" control={<Radio />} label="Gain weight/muscle" />
            </RadioGroup>
          </FormControl>
        </Grid>

        {data.primaryGoal === 'loseWeight' && (
          <Grid item xs={12}>
            <Typography gutterBottom>
              Weekly Weight Loss Target (kg)
            </Typography>
            <Slider
              value={data.weeklyWeightLossTarget || 0.5}
              onChange={handleSliderChange('weeklyWeightLossTarget')}
              valueLabelDisplay="auto"
              step={0.1}
              marks={[
                { value: 0.2, label: '0.2 kg' },
                { value: 0.5, label: '0.5 kg' },
                { value: 1, label: '1 kg' }
              ]}
              min={0.2}
              max={1}
            />
            <Typography variant="caption" color="textSecondary">
              Recommended: 0.5-1 kg per week for safe, sustainable weight loss
            </Typography>
          </Grid>
        )}

        {data.primaryGoal === 'gainWeight' && (
          <Grid item xs={12}>
            <Typography gutterBottom>
              Weekly Weight Gain Target (kg)
            </Typography>
            <Slider
              value={data.weeklyWeightGainTarget || 0.25}
              onChange={handleSliderChange('weeklyWeightGainTarget')}
              valueLabelDisplay="auto"
              step={0.05}
              marks={[
                { value: 0.1, label: '0.1 kg' },
                { value: 0.25, label: '0.25 kg' },
                { value: 0.5, label: '0.5 kg' }
              ]}
              min={0.1}
              max={0.5}
            />
            <Typography variant="caption" color="textSecondary">
              Recommended: 0.25-0.5 kg per week for healthy muscle gain
            </Typography>
          </Grid>
        )}

        <Grid item xs={12}>
          <Typography gutterBottom>Target Date</Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            How quickly do you want to achieve your primary goal?
          </Typography>
          <RadioGroup
            name="timeframe"
            value={data.timeframe || ''}
            onChange={handleChange}
          >
            <FormControlLabel value="1month" control={<Radio />} label="1 month" />
            <FormControlLabel value="3months" control={<Radio />} label="3 months" />
            <FormControlLabel value="6months" control={<Radio />} label="6 months" />
            <FormControlLabel value="ongoing" control={<Radio />} label="Ongoing/maintenance" />
          </RadioGroup>
        </Grid>

        <Grid item xs={12}>
          <Typography gutterBottom>Secondary Goals</Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Select additional health and nutrition goals (optional)
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {secondaryGoalOptions.map((goal) => (
              <Chip
                key={goal}
                label={goal}
                onClick={handleGoalSelection(goal)}
                color={data.secondaryGoals?.includes(goal) ? "primary" : "default"}
                sx={{ m: 0.5 }}
              />
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Anything else about your goals?"
            name="goalNotes"
            value={data.goalNotes || ''}
            onChange={handleChange}
            placeholder="Tell us more about your specific goals or challenges"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default GoalsStep; 
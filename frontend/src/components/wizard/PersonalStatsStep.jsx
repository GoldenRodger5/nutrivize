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
  ToggleButtonGroup,
  ToggleButton,
  Select,
  MenuItem,
  Slider
} from '@mui/material';

const PersonalStatsStep = ({ data, updateData }) => {
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

  const activityLevels = [
    {
      value: 'sedentary',
      label: 'Sedentary',
      description: 'Little or no exercise, desk job'
    },
    {
      value: 'light',
      label: 'Lightly Active',
      description: 'Light exercise 1-3 days/week'
    },
    {
      value: 'moderate',
      label: 'Moderately Active',
      description: 'Moderate exercise 3-5 days/week'
    },
    {
      value: 'active',
      label: 'Very Active',
      description: 'Hard exercise 6-7 days/week'
    },
    {
      value: 'extreme',
      label: 'Extremely Active',
      description: 'Hard daily exercise & physical job or training twice a day'
    }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Personal Information
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        This information helps us calculate your nutritional needs accurately.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <FormLabel>Sex</FormLabel>
            <ToggleButtonGroup
              exclusive
              value={data.sex || ''}
              onChange={handleToggleChange('sex')}
              fullWidth
            >
              <ToggleButton value="male">Male</ToggleButton>
              <ToggleButton value="female">Female</ToggleButton>
            </ToggleButtonGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Age"
            name="age"
            type="number"
            InputProps={{
              inputProps: { min: 18, max: 100 }
            }}
            value={data.age || ''}
            onChange={handleNumberChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Height"
            name="height"
            type="number"
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
              inputProps: { min: 120, max: 220 }
            }}
            value={data.height || ''}
            onChange={handleNumberChange}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Weight"
            name="weight"
            type="number"
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
              inputProps: { min: 40, max: 200 }
            }}
            value={data.weight || ''}
            onChange={handleNumberChange}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography gutterBottom>Activity Level</Typography>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              name="activityLevel"
              value={data.activityLevel || ''}
              onChange={handleChange}
            >
              {activityLevels.map((level) => (
                <FormControlLabel
                  key={level.value}
                  value={level.value}
                  control={<Radio />}
                  label={
                    <Box>
                      <Typography variant="body1">{level.label}</Typography>
                      <Typography variant="caption" color="textSecondary">
                        {level.description}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography gutterBottom>Exercise Frequency (days per week)</Typography>
          <Slider
            value={data.exerciseFrequency || 0}
            onChange={handleSliderChange('exerciseFrequency')}
            valueLabelDisplay="auto"
            step={1}
            marks
            min={0}
            max={7}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <FormLabel>Exercise Type</FormLabel>
            <Select
              name="exerciseType"
              value={data.exerciseType || ''}
              onChange={handleChange}
              displayEmpty
            >
              <MenuItem value="" disabled>
                Select primary exercise type
              </MenuItem>
              <MenuItem value="cardio">Primarily Cardio</MenuItem>
              <MenuItem value="strength">Primarily Strength Training</MenuItem>
              <MenuItem value="mixed">Mixed Cardio & Strength</MenuItem>
              <MenuItem value="sports">Sports</MenuItem>
              <MenuItem value="yoga">Yoga/Pilates/Low Impact</MenuItem>
              <MenuItem value="none">No Regular Exercise</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Average Exercise Duration"
            name="exerciseDuration"
            type="number"
            InputProps={{
              endAdornment: <InputAdornment position="end">min</InputAdornment>,
              inputProps: { min: 0, max: 240 }
            }}
            value={data.exerciseDuration || ''}
            onChange={handleNumberChange}
            helperText="Minutes per session"
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Health Conditions (Optional)"
            name="healthConditions"
            value={data.healthConditions || ''}
            onChange={handleChange}
            placeholder="List any health conditions that may affect your nutrition needs"
          />
          <Typography variant="caption" color="textSecondary">
            This information is used to personalize your plan but is not medical advice.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PersonalStatsStep; 
import React from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  RadioGroup,
  Radio,
  Slider,
  InputAdornment
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';

const UserStatsStep = ({ data, updateData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  const handleDateChange = (newValue) => {
    updateData({ birthDate: newValue });
  };

  const handleSliderChange = (name) => (e, newValue) => {
    updateData({ [name]: newValue });
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little or no exercise)', multiplier: 1.2 },
    { value: 'lightlyActive', label: 'Lightly active (light exercise/sports 1-3 days/week)', multiplier: 1.375 },
    { value: 'moderatelyActive', label: 'Moderately active (moderate exercise/sports 3-5 days/week)', multiplier: 1.55 },
    { value: 'veryActive', label: 'Very active (hard exercise/sports 6-7 days a week)', multiplier: 1.725 },
    { value: 'extraActive', label: 'Extra active (very hard exercise/physical job/training twice a day)', multiplier: 1.9 }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Physical Information
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        This information helps us calculate your nutritional needs accurately.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth>
            <InputLabel id="gender-label">Gender</InputLabel>
            <Select
              labelId="gender-label"
              id="gender"
              name="gender"
              value={data.gender || ''}
              label="Gender"
              onChange={handleChange}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="other">Other</MenuItem>
              <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Birth Date"
              value={data.birthDate || null}
              onChange={handleDateChange}
              renderInput={(params) => <TextField {...params} fullWidth />}
              disableFuture
              openTo="year"
              views={['year', 'month', 'day']}
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Height"
            name="height"
            type="number"
            value={data.height || ''}
            onChange={handleChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">cm</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Weight"
            name="weight"
            type="number"
            value={data.weight || ''}
            onChange={handleChange}
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography id="activity-level-slider" gutterBottom>
            Activity Level
          </Typography>
          <FormControl component="fieldset" fullWidth>
            <RadioGroup
              name="activityLevel"
              value={data.activityLevel || 'moderatelyActive'}
              onChange={handleChange}
            >
              {activityLevels.map((level) => (
                <FormControlLabel
                  key={level.value}
                  value={level.value}
                  control={<Radio />}
                  label={level.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <Typography id="exercise-frequency-slider" gutterBottom>
            Exercise Frequency (days per week)
          </Typography>
          <Slider
            value={data.exerciseFrequency || 3}
            onChange={handleSliderChange('exerciseFrequency')}
            valueLabelDisplay="auto"
            step={1}
            marks
            min={0}
            max={7}
            aria-labelledby="exercise-frequency-slider"
          />
        </Grid>

        <Grid item xs={12}>
          <Typography gutterBottom>
            Exercise Duration (minutes per session)
          </Typography>
          <Slider
            value={data.exerciseDuration || 30}
            onChange={handleSliderChange('exerciseDuration')}
            valueLabelDisplay="auto"
            step={10}
            marks
            min={0}
            max={120}
          />
        </Grid>

        <Grid item xs={12}>
          <Typography gutterBottom>Exercise Intensity</Typography>
          <Slider
            value={data.exerciseIntensity || 5}
            onChange={handleSliderChange('exerciseIntensity')}
            valueLabelDisplay="auto"
            step={1}
            marks={[
              { value: 1, label: 'Very Light' },
              { value: 5, label: 'Moderate' },
              { value: 10, label: 'Very Intense' }
            ]}
            min={1}
            max={10}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Health Conditions"
            name="healthConditions"
            value={data.healthConditions || ''}
            onChange={handleChange}
            placeholder="Any health conditions that might affect your nutrition needs (e.g., diabetes, hypertension)"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserStatsStep; 
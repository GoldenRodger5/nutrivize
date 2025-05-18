import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Grid,
  InputAdornment,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Slider,
  Switch
} from '@mui/material';
import HeightIcon from '@mui/icons-material/Height';
import MonitorWeightIcon from '@mui/icons-material/MonitorWeight';
import CakeIcon from '@mui/icons-material/Cake';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';

const StatsStep = ({ data, updateData }) => {
  const [units, setUnits] = useState({
    height: data.heightUnit || 'cm',
    weight: data.weightUnit || 'kg'
  });
  
  // Handle unit conversion
  useEffect(() => {
    if (data.height && data.heightUnit !== units.height) {
      // Convert height 
      let convertedHeight;
      if (units.height === 'cm' && data.heightUnit === 'ft') {
        // Convert feet to cm
        const feet = Math.floor(data.height);
        const inches = (data.height - feet) * 12;
        convertedHeight = (feet * 30.48) + (inches * 2.54);
      } else if (units.height === 'ft' && data.heightUnit === 'cm') {
        // Convert cm to feet
        const feet = data.height / 30.48;
        convertedHeight = parseFloat(feet.toFixed(1));
      }
      
      updateData({
        height: convertedHeight,
        heightUnit: units.height
      });
    }
    
    if (data.weight && data.weightUnit !== units.weight) {
      // Convert weight
      let convertedWeight;
      if (units.weight === 'kg' && data.weightUnit === 'lb') {
        // Convert lbs to kg
        convertedWeight = data.weight * 0.453592;
      } else if (units.weight === 'lb' && data.weightUnit === 'kg') {
        // Convert kg to lbs
        convertedWeight = data.weight * 2.20462;
      }
      
      updateData({
        weight: parseFloat(convertedWeight.toFixed(1)), 
        weightUnit: units.weight
      });
    }
  }, [units]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  const handleNumberChange = (e) => {
    const { name, value } = e.target;
    if (value === '' || !isNaN(value)) {
      updateData({ [name]: value === '' ? '' : parseFloat(value) });
    }
  };

  const handleUnitChange = (type) => {
    setUnits(prev => ({
      ...prev,
      [type]: type === 'height' 
        ? (prev.height === 'cm' ? 'ft' : 'cm')
        : (prev.weight === 'kg' ? 'lb' : 'kg')
    }));
  };

  const handleSliderChange = (name) => (e, newValue) => {
    updateData({ [name]: newValue });
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little or no exercise)', factor: 1.2 },
    { value: 'light', label: 'Lightly active (light exercise 1-3 days/week)', factor: 1.375 },
    { value: 'moderate', label: 'Moderately active (moderate exercise 3-5 days/week)', factor: 1.55 },
    { value: 'active', label: 'Active (hard exercise 6-7 days/week)', factor: 1.725 },
    { value: 'very_active', label: 'Very active (very hard exercise & physical job)', factor: 1.9 }
  ];

  // Age marks for the slider
  const ageMarks = [
    { value: 18, label: '18' },
    { value: 30, label: '30' },
    { value: 50, label: '50' },
    { value: 70, label: '70' },
    { value: 90, label: '90' }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Physical Stats
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        We'll use this information to calculate your daily nutritional needs.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Gender</FormLabel>
            <RadioGroup
              row
              name="gender"
              value={data.gender || ''}
              onChange={handleChange}
            >
              <FormControlLabel value="male" control={<Radio />} label="Male" />
              <FormControlLabel value="female" control={<Radio />} label="Female" />
              <FormControlLabel value="other" control={<Radio />} label="Other" />
            </RadioGroup>
          </FormControl>
        </Grid>

        <Grid item xs={12} sm={6}>
          <Typography gutterBottom>Age</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CakeIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Slider
              value={data.age || 30}
              onChange={handleSliderChange('age')}
              min={18}
              max={90}
              marks={ageMarks}
              valueLabelDisplay="auto"
              sx={{ flex: 1 }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Height"
            name="height"
            value={data.height || ''}
            onChange={handleNumberChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <HeightIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 1 }}>{units.height}</Typography>
                    <Switch
                      size="small"
                      checked={units.height === 'ft'}
                      onChange={() => handleUnitChange('height')}
                    />
                  </Box>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            label="Weight"
            name="weight"
            value={data.weight || ''}
            onChange={handleNumberChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <MonitorWeightIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography sx={{ mr: 1 }}>{units.weight}</Typography>
                    <Switch
                      size="small"
                      checked={units.weight === 'lb'}
                      onChange={() => handleUnitChange('weight')}
                    />
                  </Box>
                </InputAdornment>
              )
            }}
          />
        </Grid>

        <Grid item xs={12}>
          <FormControl component="fieldset" fullWidth>
            <FormLabel component="legend">Activity Level</FormLabel>
            <RadioGroup
              name="activityLevel"
              value={data.activityLevel || 'moderate'}
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
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <FitnessCenterIcon sx={{ mr: 2, color: 'text.secondary' }} />
            <Typography>Exercise frequency (days per week)</Typography>
          </Box>
          <Slider
            value={data.exerciseFrequency || 3}
            onChange={handleSliderChange('exerciseFrequency')}
            min={0}
            max={7}
            marks={[0, 1, 2, 3, 4, 5, 6, 7].map(v => ({ value: v, label: `${v}` }))}
            valueLabelDisplay="auto"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StatsStep; 
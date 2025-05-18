import React from 'react';
import {
  Box,
  TextField,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Select,
  MenuItem,
  InputLabel,
  Typography
} from '@mui/material';

const BasicInfoStep = ({ data, updateData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  const activityLevels = [
    { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
    { value: 'light', label: 'Lightly active (light exercise 1-3 days/week)' },
    { value: 'moderate', label: 'Moderately active (moderate exercise 3-5 days/week)' },
    { value: 'active', label: 'Active (hard exercise 6-7 days/week)' },
    { value: 'very_active', label: 'Very active (very hard exercise & physical job)' }
  ];

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Let's start with some basic information
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Age"
          name="age"
          type="number"
          value={data.age}
          onChange={handleChange}
          InputProps={{ inputProps: { min: 18, max: 100 } }}
          helperText="Age in years"
          margin="normal"
        />
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Gender</FormLabel>
          <RadioGroup
            row
            name="gender"
            value={data.gender}
            onChange={handleChange}
          >
            <FormControlLabel value="male" control={<Radio />} label="Male" />
            <FormControlLabel value="female" control={<Radio />} label="Female" />
            <FormControlLabel value="other" control={<Radio />} label="Other" />
          </RadioGroup>
        </FormControl>
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Height"
          name="height"
          type="number"
          value={data.height}
          onChange={handleChange}
          InputProps={{ inputProps: { min: 100, max: 250 } }}
          helperText="Height in centimeters"
          margin="normal"
        />
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Weight"
          name="weight"
          type="number"
          value={data.weight}
          onChange={handleChange}
          InputProps={{ inputProps: { min: 30, max: 300 } }}
          helperText="Weight in kilograms"
          margin="normal"
        />
      </Box>
      
      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth margin="normal">
          <InputLabel id="activity-level-label">Activity Level</InputLabel>
          <Select
            labelId="activity-level-label"
            name="activityLevel"
            value={data.activityLevel}
            onChange={handleChange}
            label="Activity Level"
          >
            {activityLevels.map((level) => (
              <MenuItem key={level.value} value={level.value}>
                {level.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Box>
  );
};

export default BasicInfoStep; 
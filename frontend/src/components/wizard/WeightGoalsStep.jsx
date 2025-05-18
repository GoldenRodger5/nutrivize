import React from 'react';
import {
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormControlLabel,
  Typography,
  TextField,
  Slider,
  InputAdornment
} from '@mui/material';

const WeightGoalsStep = ({ data, updateData }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  const handleSliderChange = (e, newValue) => {
    updateData({ weightChangeRate: newValue });
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        What are your weight goals?
      </Typography>
      
      <Box sx={{ mb: 4 }}>
        <FormControl component="fieldset">
          <FormLabel component="legend">Weight Goal Type</FormLabel>
          <RadioGroup
            name="goalType"
            value={data.goalType}
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
              label="Maintain Weight" 
            />
            <FormControlLabel 
              value="gain" 
              control={<Radio />} 
              label="Gain Weight" 
            />
          </RadioGroup>
        </FormControl>
      </Box>

      {data.goalType && data.goalType !== 'maintain' && (
        <>
          <Box sx={{ mb: 4 }}>
            <Typography id="weight-change-rate-slider" gutterBottom>
              How {data.goalType === 'lose' ? 'fast' : 'quickly'} do you want to {data.goalType} weight?
              <Typography variant="body2" color="text.secondary">
                Recommended: 0.5-1 kg per week
              </Typography>
            </Typography>
            <Slider
              name="weightChangeRate"
              value={data.weightChangeRate || 0.5}
              onChange={handleSliderChange}
              aria-labelledby="weight-change-rate-slider"
              step={0.1}
              marks
              min={0.1}
              max={2}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value} kg/week`}
            />
          </Box>

          <Box sx={{ mb: 4 }}>
            <TextField
              fullWidth
              label="Target Weight"
              name="targetWeight"
              type="number"
              value={data.targetWeight}
              onChange={handleChange}
              InputProps={{ 
                inputProps: { min: 30, max: 300 },
                endAdornment: <InputAdornment position="end">kg</InputAdornment>
              }}
              helperText="Your goal weight in kilograms"
              margin="normal"
            />
          </Box>
        </>
      )}

      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          label="Target Date"
          name="targetDate"
          type="date"
          value={data.targetDate}
          onChange={handleChange}
          InputLabelProps={{
            shrink: true,
          }}
          helperText="When do you want to reach your goal?"
          margin="normal"
        />
      </Box>
    </Box>
  );
};

export default WeightGoalsStep; 
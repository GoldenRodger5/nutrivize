import React from 'react';
import {
  Box,
  Typography,
  Grid,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Chip,
  Paper,
  Autocomplete,
  Divider
} from '@mui/material';

const commonAllergies = [
  'Dairy', 'Eggs', 'Peanuts', 'Tree Nuts', 'Soy', 'Wheat', 'Gluten', 
  'Fish', 'Shellfish', 'Sesame'
];

const dietaryStyles = [
  { id: 'omnivore', label: 'Omnivore (Everything)', description: 'No restrictions on food groups' },
  { id: 'flexitarian', label: 'Flexitarian', description: 'Primarily vegetarian with occasional meat' },
  { id: 'pescatarian', label: 'Pescatarian', description: 'Vegetarian plus seafood' },
  { id: 'vegetarian', label: 'Vegetarian', description: 'No meat or seafood' },
  { id: 'vegan', label: 'Vegan', description: 'No animal products whatsoever' },
  { id: 'keto', label: 'Ketogenic', description: 'Very low carb, high fat' },
  { id: 'paleo', label: 'Paleo', description: 'Focus on whole foods, no processed items' },
  { id: 'mediterranean', label: 'Mediterranean', description: 'Focus on vegetables, fruits, whole grains, lean proteins' },
  { id: 'lowCarb', label: 'Low Carb', description: 'Reduced carbohydrate intake' },
  { id: 'lowFat', label: 'Low Fat', description: 'Reduced fat intake' },
  { id: 'diabetic', label: 'Diabetic Friendly', description: 'Low glycemic index foods' },
  { id: 'glutenFree', label: 'Gluten Free', description: 'No gluten-containing foods' },
];

const DietaryPreferencesStep = ({ data, updateData }) => {
  const handleDietStyleChange = (e) => {
    const { checked, name } = e.target;
    updateData({ dietaryStyle: name });
  };

  const handleAvoidanceChange = (e) => {
    const { checked, name } = e.target;
    const currentAvoidances = data.foodAvoidances || [];
    
    if (checked) {
      updateData({ foodAvoidances: [...currentAvoidances, name] });
    } else {
      updateData({ foodAvoidances: currentAvoidances.filter(item => item !== name) });
    }
  };

  const handleAllergiesChange = (event, newValue) => {
    updateData({ allergies: newValue });
  };

  const handleTextChange = (e) => {
    const { name, value } = e.target;
    updateData({ [name]: value });
  };

  // Format data to match backend expectations when user interacts
  const formatDataToBackend = () => {
    // Map dietary style ID to a format matching backend expectations
    const styleMap = {
      'omnivore': 'standard',
      'flexitarian': 'flexitarian',
      'pescatarian': 'pescatarian',
      'vegetarian': 'vegetarian',
      'vegan': 'vegan',
      'keto': 'keto',
      'paleo': 'paleo',
      'mediterranean': 'mediterranean',
      'lowCarb': 'low_carb',
      'lowFat': 'low_fat',
      'diabetic': 'diabetic',
      'glutenFree': 'gluten_free',
    };
    
    // Update diet type to match backend format
    if (data.dietaryStyle && styleMap[data.dietaryStyle]) {
      updateData({ dietType: styleMap[data.dietaryStyle] });
    }
  };

  // When component renders or dietary style changes, update backend-compatible values
  React.useEffect(() => {
    formatDataToBackend();
  }, [data.dietaryStyle]);

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Dietary Preferences
      </Typography>
      <Typography variant="body2" color="textSecondary" paragraph>
        Tell us about your eating habits and restrictions so we can tailor your meal plans.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Your Dietary Style
            </Typography>
            <Typography variant="caption" color="textSecondary" paragraph>
              Choose the eating pattern that best describes your approach to food
            </Typography>

            <Grid container spacing={2}>
              {dietaryStyles.map(style => (
                <Grid item xs={12} sm={6} md={4} key={style.id}>
                  <Paper 
                    variant="outlined" 
                    sx={{ 
                      p: 2, 
                      height: '100%',
                      cursor: 'pointer',
                      borderColor: data.dietaryStyle === style.id ? 'primary.main' : 'divider',
                      borderWidth: data.dietaryStyle === style.id ? 2 : 1,
                      bgcolor: data.dietaryStyle === style.id ? 'action.selected' : 'background.paper'
                    }}
                    onClick={() => updateData({ dietaryStyle: style.id })}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox 
                          checked={data.dietaryStyle === style.id} 
                          onChange={handleDietStyleChange}
                          name={style.id}
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="subtitle2">{style.label}</Typography>
                          <Typography variant="caption" color="textSecondary">{style.description}</Typography>
                        </Box>
                      }
                      sx={{ width: '100%', m: 0 }}
                    />
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Food Allergies & Intolerances
            </Typography>
            <Typography variant="caption" color="textSecondary" paragraph>
              Select any allergies or intolerances you have
            </Typography>

            <Autocomplete
              multiple
              id="allergies"
              options={commonAllergies}
              value={data.allergies || []}
              onChange={handleAllergiesChange}
              freeSolo
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip 
                    label={option} 
                    {...getTagProps({ index })} 
                    color="primary" 
                    variant="outlined"
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="outlined"
                  label="Allergies & Intolerances"
                  placeholder="Type and press enter to add more"
                  helperText="Select from the list or type your own and press Enter"
                />
              )}
            />
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Foods You Want to Avoid
            </Typography>
            <Typography variant="caption" color="textSecondary" paragraph>
              Select foods or ingredients you dislike or prefer not to eat
            </Typography>

            <FormControl component="fieldset" fullWidth>
              <FormGroup>
                <Grid container spacing={1}>
                  {[
                    'Red Meat', 'Poultry', 'Pork', 'Seafood', 'Dairy', 'Eggs', 
                    'Gluten', 'Soy', 'Nuts', 'Mushrooms', 'Onions', 'Garlic',
                    'Spicy Foods', 'Processed Foods', 'Artificial Sweeteners'
                  ].map(food => (
                    <Grid item xs={6} sm={4} key={food}>
                      <FormControlLabel
                        control={
                          <Checkbox 
                            checked={data.foodAvoidances?.includes(food) || false} 
                            onChange={handleAvoidanceChange}
                            name={food}
                          />
                        }
                        label={food}
                      />
                    </Grid>
                  ))}
                </Grid>
              </FormGroup>
            </FormControl>

            <Box mt={2}>
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Other foods or ingredients to avoid"
                name="otherAvoidances"
                value={data.otherAvoidances || ''}
                onChange={handleTextChange}
                placeholder="List any other foods or ingredients you want to avoid"
              />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Meal Preferences
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  select
                  SelectProps={{
                    native: true
                  }}
                  name="mealsPerDay"
                  label="Preferred Meals Per Day"
                  value={data.mealsPerDay || 3}
                  onChange={handleTextChange}
                  helperText="How many meals do you prefer to eat daily?"
                >
                  {[2, 3, 4, 5, 6].map(num => (
                    <option key={num} value={num}>{num} meals</option>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Favorite Foods (Optional)"
                  name="favoriteFoods"
                  value={data.favoriteFoods || ''}
                  onChange={handleTextChange}
                  placeholder="What are some of your favorite foods or ingredients?"
                  helperText="We'll try to incorporate these into your meal plans"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Additional Preferences (Optional)"
                  name="additionalPreferences"
                  value={data.additionalPreferences || ''}
                  onChange={handleTextChange}
                  placeholder="Any other dietary preferences or information we should know about?"
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DietaryPreferencesStep; 
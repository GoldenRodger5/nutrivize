// Get user profile data
router.get('/profile', auth, async (req, res) => {
  try {
    // Find profile by user ID
    const profile = await UserProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({ msg: 'Profile not found' });
    }
    
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create or update user profile
router.post('/profile', auth, async (req, res) => {
  try {
    const {
      basicInfo,
      weightGoal,
      nutritionGoal,
      dietaryPreferences,
      calculatedValues
    } = req.body;
    
    // Build profile object
    const profileFields = {
      userId: req.user.id,
      basicInfo: {
        age: basicInfo.age,
        gender: basicInfo.gender,
        height: basicInfo.height,
        weight: basicInfo.weight,
        activityLevel: basicInfo.activityLevel
      },
      weightGoal: {
        goalType: weightGoal.goalType,
        targetWeight: weightGoal.targetWeight,
        weeklyRate: weightGoal.weeklyRate
      },
      nutritionGoal: {
        dailyCalories: nutritionGoal.dailyCalories,
        macroDistribution: {
          protein: nutritionGoal.macroDistribution.protein,
          carbs: nutritionGoal.macroDistribution.carbs,
          fat: nutritionGoal.macroDistribution.fat
        }
      },
      dietaryPreferences: {
        dietType: dietaryPreferences.dietType,
        allergies: dietaryPreferences.allergies,
        excludedFoods: dietaryPreferences.excludedFoods,
        preferredFoods: dietaryPreferences.preferredFoods
      },
      calculatedValues: {
        bmr: calculatedValues.bmr,
        tdee: calculatedValues.tdee,
        goalCalories: calculatedValues.goalCalories
      }
    };
    
    // Update or create profile
    let profile = await UserProfile.findOne({ userId: req.user.id });
    
    if (profile) {
      // Update
      profile = await UserProfile.findOneAndUpdate(
        { userId: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    }
    
    // Create
    profile = new UserProfile(profileFields);
    await profile.save();
    res.json(profile);
    
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}); 
const mongoose = require('mongoose');

const UserProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true
  },
  basicInfo: {
    age: {
      type: Number,
      required: true
    },
    gender: {
      type: String,
      required: true
    },
    height: {
      type: Number,
      required: true
    },
    weight: {
      type: Number,
      required: true
    },
    activityLevel: {
      type: String,
      required: true
    }
  },
  weightGoal: {
    goalType: {
      type: String,
      enum: ['lose', 'maintain', 'gain'],
      required: true
    },
    targetWeight: {
      type: Number,
      required: true
    },
    weeklyRate: {
      type: Number,
      default: 0.5
    }
  },
  nutritionGoal: {
    dailyCalories: {
      type: Number,
      required: true
    },
    macroDistribution: {
      protein: {
        type: Number,
        default: 30
      },
      carbs: {
        type: Number,
        default: 40
      },
      fat: {
        type: Number,
        default: 30
      }
    }
  },
  dietaryPreferences: {
    dietType: {
      type: String,
      default: 'standard'
    },
    allergies: [String],
    excludedFoods: [String],
    preferredFoods: [String]
  },
  calculatedValues: {
    bmr: Number,
    tdee: Number,
    goalCalories: Number
  },
  setupCompleted: {
    type: Boolean,
    default: false
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = UserProfile = mongoose.model('userProfile', UserProfileSchema); 
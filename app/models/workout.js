const mongoose = require('mongoose')

// the rulebook: every workout must look like this before mongo will save it
const workoutSchema = new mongoose.Schema({
  // what lift or movement, trimmed so "  Deadlift " becomes "Deadlift"
  exercise: {
    type: String,
    required: [true, 'Exercise is required'],
    trim: true,
    maxlength: [60, 'Keep the exercise name under 60 characters']
  },
  // only these five words are allowed, anything else gets rejected
  category: {
    type: String,
    required: [true, 'Pick a category'],
    enum: {
      values: ['Push', 'Pull', 'Legs', 'Core', 'Conditioning'],
      message: '{VALUE} is not a valid category'
    }
  },
  sets: {
    type: Number,
    required: [true, 'Sets are required'],
    min: [1, 'At least 1 set'],
    max: [50, 'That is a lot of sets, max is 50']
  },
  reps: {
    type: Number,
    required: [true, 'Reps are required'],
    min: [1, 'At least 1 rep'],
    max: [500, 'Max is 500 reps']
  },
  // weight in pounds, 0 is allowed for bodyweight moves like pull-ups
  weight: {
    type: Number,
    required: [true, 'Weight is required, use 0 for bodyweight'],
    min: [0, 'Weight cannot be negative'],
    max: [2000, 'Max is 2000 lbs']
  },
  // how hard it felt, 1 is easy and 10 is all-out
  effort: {
    type: Number,
    required: [true, 'Effort is required'],
    min: [1, 'Effort goes from 1 to 10'],
    max: [10, 'Effort goes from 1 to 10']
  },
  // if the form leaves date empty, mongoose fills in right now
  date: {
    type: Date,
    default: Date.now
  },
  // optional short note, like "grip gave out on set 4"
  note: {
    type: String,
    trim: true,
    maxlength: [200, 'Keep the note under 200 characters']
  },
  // the owner stamp: a real id pointing at a document in the users collection
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  // adds createdAt and updatedAt automatically
  timestamps: true
})

// turn the rulebook into a model, mongoose saves these in a collection called "workouts"
module.exports = mongoose.model('Workout', workoutSchema)
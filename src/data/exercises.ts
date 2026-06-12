import type { Equipment, Exercise, ExerciseType, MuscleGroup } from '../types'

function e(
  name: string,
  muscleGroup: MuscleGroup,
  equipment: Equipment,
  type: ExerciseType = 'weight_reps',
): Exercise {
  return {
    id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name,
    muscleGroup,
    equipment,
    type,
  }
}

export const SEED_EXERCISES: Exercise[] = [
  // Chest
  e('Bench Press (Barbell)', 'Chest', 'Barbell'),
  e('Bench Press (Dumbbell)', 'Chest', 'Dumbbell'),
  e('Incline Bench Press (Barbell)', 'Chest', 'Barbell'),
  e('Incline Bench Press (Dumbbell)', 'Chest', 'Dumbbell'),
  e('Decline Bench Press (Barbell)', 'Chest', 'Barbell'),
  e('Chest Press (Machine)', 'Chest', 'Machine'),
  e('Chest Fly (Dumbbell)', 'Chest', 'Dumbbell'),
  e('Chest Fly (Machine)', 'Chest', 'Machine'),
  e('Cable Crossover', 'Chest', 'Cable'),
  e('Push Up', 'Chest', 'Bodyweight', 'reps_only'),
  e('Dip (Chest)', 'Chest', 'Bodyweight', 'reps_only'),
  e('Smith Machine Bench Press', 'Chest', 'Smith Machine'),

  // Back
  e('Deadlift (Barbell)', 'Back', 'Barbell'),
  e('Romanian Deadlift (Barbell)', 'Hamstrings', 'Barbell'),
  e('Romanian Deadlift (Dumbbell)', 'Hamstrings', 'Dumbbell'),
  e('Bent Over Row (Barbell)', 'Back', 'Barbell'),
  e('Bent Over Row (Dumbbell)', 'Back', 'Dumbbell'),
  e('Pendlay Row', 'Back', 'Barbell'),
  e('T-Bar Row', 'Back', 'Barbell'),
  e('Seated Cable Row', 'Back', 'Cable'),
  e('Lat Pulldown (Cable)', 'Back', 'Cable'),
  e('Lat Pulldown (Machine)', 'Back', 'Machine'),
  e('Pull Up', 'Back', 'Bodyweight', 'reps_only'),
  e('Weighted Pull Up', 'Back', 'Bodyweight'),
  e('Chin Up', 'Back', 'Bodyweight', 'reps_only'),
  e('Single Arm Row (Dumbbell)', 'Back', 'Dumbbell'),
  e('Machine Row', 'Back', 'Machine'),
  e('Straight Arm Pulldown', 'Back', 'Cable'),
  e('Back Extension', 'Back', 'Bodyweight', 'reps_only'),
  e('Rack Pull', 'Back', 'Barbell'),
  e('Good Morning', 'Hamstrings', 'Barbell'),

  // Shoulders
  e('Overhead Press (Barbell)', 'Shoulders', 'Barbell'),
  e('Overhead Press (Dumbbell)', 'Shoulders', 'Dumbbell'),
  e('Seated Shoulder Press (Machine)', 'Shoulders', 'Machine'),
  e('Arnold Press', 'Shoulders', 'Dumbbell'),
  e('Lateral Raise (Dumbbell)', 'Shoulders', 'Dumbbell'),
  e('Lateral Raise (Cable)', 'Shoulders', 'Cable'),
  e('Lateral Raise (Machine)', 'Shoulders', 'Machine'),
  e('Front Raise (Dumbbell)', 'Shoulders', 'Dumbbell'),
  e('Rear Delt Fly (Dumbbell)', 'Shoulders', 'Dumbbell'),
  e('Rear Delt Fly (Machine)', 'Shoulders', 'Machine'),
  e('Face Pull', 'Shoulders', 'Cable'),
  e('Upright Row (Barbell)', 'Shoulders', 'Barbell'),
  e('Shrug (Barbell)', 'Shoulders', 'Barbell'),
  e('Shrug (Dumbbell)', 'Shoulders', 'Dumbbell'),

  // Biceps
  e('Bicep Curl (Barbell)', 'Biceps', 'Barbell'),
  e('Bicep Curl (Dumbbell)', 'Biceps', 'Dumbbell'),
  e('Bicep Curl (Cable)', 'Biceps', 'Cable'),
  e('Hammer Curl (Dumbbell)', 'Biceps', 'Dumbbell'),
  e('EZ Bar Curl', 'Biceps', 'Barbell'),
  e('Preacher Curl', 'Biceps', 'Barbell'),
  e('Incline Curl (Dumbbell)', 'Biceps', 'Dumbbell'),
  e('Concentration Curl', 'Biceps', 'Dumbbell'),
  e('Machine Bicep Curl', 'Biceps', 'Machine'),

  // Triceps
  e('Triceps Pushdown (Cable)', 'Triceps', 'Cable'),
  e('Triceps Rope Pushdown', 'Triceps', 'Cable'),
  e('Overhead Triceps Extension (Cable)', 'Triceps', 'Cable'),
  e('Overhead Triceps Extension (Dumbbell)', 'Triceps', 'Dumbbell'),
  e('Skullcrusher (Barbell)', 'Triceps', 'Barbell'),
  e('Close Grip Bench Press', 'Triceps', 'Barbell'),
  e('Dip (Triceps)', 'Triceps', 'Bodyweight', 'reps_only'),
  e('Triceps Kickback (Dumbbell)', 'Triceps', 'Dumbbell'),
  e('Triceps Extension (Machine)', 'Triceps', 'Machine'),

  // Forearms
  e('Wrist Curl', 'Forearms', 'Barbell'),
  e('Reverse Curl (Barbell)', 'Forearms', 'Barbell'),
  e('Farmer Walk', 'Forearms', 'Dumbbell', 'weighted_duration'),
  e('Dead Hang', 'Forearms', 'Bodyweight', 'duration'),

  // Quads
  e('Squat (Barbell)', 'Quads', 'Barbell'),
  e('Front Squat (Barbell)', 'Quads', 'Barbell'),
  e('Goblet Squat', 'Quads', 'Dumbbell'),
  e('Hack Squat (Machine)', 'Quads', 'Machine'),
  e('Smith Machine Squat', 'Quads', 'Smith Machine'),
  e('Leg Press', 'Quads', 'Machine'),
  e('Leg Extension (Machine)', 'Quads', 'Machine'),
  e('Bulgarian Split Squat', 'Quads', 'Dumbbell'),
  e('Lunge (Dumbbell)', 'Quads', 'Dumbbell'),
  e('Lunge (Barbell)', 'Quads', 'Barbell'),
  e('Step Up', 'Quads', 'Dumbbell'),
  e('Sissy Squat', 'Quads', 'Bodyweight', 'reps_only'),

  // Hamstrings
  e('Lying Leg Curl (Machine)', 'Hamstrings', 'Machine'),
  e('Seated Leg Curl (Machine)', 'Hamstrings', 'Machine'),
  e('Stiff Leg Deadlift', 'Hamstrings', 'Barbell'),
  e('Nordic Hamstring Curl', 'Hamstrings', 'Bodyweight', 'reps_only'),

  // Glutes
  e('Hip Thrust (Barbell)', 'Glutes', 'Barbell'),
  e('Hip Thrust (Machine)', 'Glutes', 'Machine'),
  e('Glute Kickback (Cable)', 'Glutes', 'Cable'),
  e('Glute Bridge', 'Glutes', 'Bodyweight', 'reps_only'),
  e('Hip Abduction (Machine)', 'Glutes', 'Machine'),
  e('Hip Adduction (Machine)', 'Glutes', 'Machine'),
  e('Sumo Deadlift', 'Glutes', 'Barbell'),
  e('Kettlebell Swing', 'Glutes', 'Kettlebell'),

  // Calves
  e('Standing Calf Raise', 'Calves', 'Machine'),
  e('Seated Calf Raise', 'Calves', 'Machine'),
  e('Calf Press (Leg Press)', 'Calves', 'Machine'),

  // Abs
  e('Crunch', 'Abs', 'Bodyweight', 'reps_only'),
  e('Cable Crunch', 'Abs', 'Cable'),
  e('Hanging Leg Raise', 'Abs', 'Bodyweight', 'reps_only'),
  e('Hanging Knee Raise', 'Abs', 'Bodyweight', 'reps_only'),
  e('Plank', 'Abs', 'Bodyweight', 'duration'),
  e('Side Plank', 'Abs', 'Bodyweight', 'duration'),
  e('Russian Twist', 'Abs', 'Bodyweight', 'reps_only'),
  e('Ab Wheel Rollout', 'Abs', 'Other', 'reps_only'),
  e('Sit Up', 'Abs', 'Bodyweight', 'reps_only'),
  e('Decline Crunch', 'Abs', 'Bodyweight', 'reps_only'),
  e('Leg Raise', 'Abs', 'Bodyweight', 'reps_only'),

  // Cardio
  e('Treadmill Run', 'Cardio', 'Machine', 'duration'),
  e('Treadmill Walk', 'Cardio', 'Machine', 'duration'),
  e('Stationary Bike', 'Cardio', 'Machine', 'duration'),
  e('Rowing Machine', 'Cardio', 'Machine', 'duration'),
  e('Stair Climber', 'Cardio', 'Machine', 'duration'),
  e('Elliptical', 'Cardio', 'Machine', 'duration'),
  e('Jump Rope', 'Cardio', 'Other', 'duration'),
  e('Burpee', 'Cardio', 'Bodyweight', 'reps_only'),

  // Full body / other
  e('Clean and Jerk', 'Full Body', 'Barbell'),
  e('Power Clean', 'Full Body', 'Barbell'),
  e('Snatch', 'Full Body', 'Barbell'),
  e('Thruster', 'Full Body', 'Barbell'),
  e('Sled Push', 'Full Body', 'Other'),
]

/**
 * Medical Quiz Categories
 * UK Medical Student Curriculum Categories
 */

export const QUIZ_CATEGORIES = [
  // Core Medical Sciences
  'Anatomy',
  'Physiology',
  'Biochemistry',
  'Pathology',
  'Pharmacology',
  'Microbiology',
  'Immunology',
  
  // Clinical Medicine
  'Cardiology',
  'Respiratory Medicine',
  'Gastroenterology',
  'Neurology',
  'Endocrinology',
  'Renal Medicine',
  'Hematology',
  'Emergency Medicine',
  'General Practice',
  'Psychiatry',
  'Obstetrics & Gynecology',
  'Pediatrics',
  'Surgery (General)',
  'Anesthesia',
  'Radiology',
  
  // Clinical Skills
  'Clinical Skills',
  'Communication Skills',
  'Professionalism & Ethics',
  
  // Exam Preparation
  'UKMLA Preparation',
] as const

export type QuizCategory = typeof QUIZ_CATEGORIES[number]

export const QUIZ_DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export type QuizDifficulty = typeof QUIZ_DIFFICULTIES[number]

/**
 * Get category display name
 */
export function getCategoryDisplayName(category: string): string {
  return category
}

/**
 * Get difficulty display name
 */
export function getDifficultyDisplayName(difficulty: QuizDifficulty): string {
  const names: Record<QuizDifficulty, string> = {
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',
  }
  return names[difficulty]
}

/**
 * Get difficulty color for badges
 */
export function getDifficultyColor(difficulty: QuizDifficulty): string {
  const colors: Record<QuizDifficulty, string> = {
    easy: 'bg-green-100 text-green-800 border-green-300',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    hard: 'bg-red-100 text-red-800 border-red-300',
  }
  return colors[difficulty]
}


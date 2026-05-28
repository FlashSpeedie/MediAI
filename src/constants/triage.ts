// src/constants/triage.ts
import { TriageQuestion } from '@/types';

export const TRIAGE_QUESTIONS: TriageQuestion[] = [
  // Round 1: Chief complaint
  {
    id: 'q1_main',
    question: 'What is your main symptom or concern today?',
    category: 'onset',
  },
  // Round 2: Onset
  {
    id: 'q2_onset',
    question: 'When did this symptom start? (e.g., today, 2 days ago, a week ago)',
    category: 'onset',
  },
  // Round 3: Severity
  {
    id: 'q3_severity',
    question: 'On a scale of 1–10, how severe is it right now? (1 = barely noticeable, 10 = worst pain of your life)',
    category: 'severity',
  },
  // Round 4: Location/Radiation
  {
    id: 'q4_location',
    question: 'Where exactly is the discomfort located? Does it spread anywhere?',
    category: 'location',
  },
  // Round 5: Associated symptoms
  {
    id: 'q5_associated',
    question: 'Are you experiencing any other symptoms such as fever, nausea, dizziness, shortness of breath, or chest pain?',
    category: 'associated_symptoms',
  },
  // Round 6: Medical history
  {
    id: 'q6_history',
    question: 'Do you have any known medical conditions (e.g., diabetes, heart disease, asthma, high blood pressure)?',
    category: 'medical_history',
  },
  // Round 7: Current medications
  {
    id: 'q7_medications',
    question: 'Are you currently taking any medications, vitamins, or supplements?',
    category: 'medications',
  },
  // Round 8: Allergies
  {
    id: 'q8_allergies',
    question: 'Do you have any known allergies to medications?',
    category: 'allergies',
  },
];

// Emergency red-flag symptom keywords to detect in user messages
export const EMERGENCY_KEYWORDS = [
  'chest pain',
  'chest tightness',
  'heart attack',
  'stroke',
  'can\'t breathe',
  'cannot breathe',
  'not breathing',
  'stopped breathing',
  'unconscious',
  'unresponsive',
  'severe bleeding',
  'won\'t stop bleeding',
  'overdose',
  'suicidal',
  'want to die',
  'poisoning',
  'seizure',
  'numbness in face',
  'face drooping',
  'sudden severe headache',
  'worst headache of my life',
  'anaphylaxis',
  'throat closing',
  'can\'t swallow',
  'blue lips',
  'passed out',
  'blacked out',
];

export const HIGH_URGENCY_KEYWORDS = [
  'high fever',
  '104',
  '105',
  'fever over 103',
  'severe pain',
  'pain 8',
  'pain 9',
  'pain 10',
  'blood in urine',
  'blood in stool',
  'vomiting blood',
  'coughing blood',
  'vision changes',
  'sudden confusion',
  'difficulty walking',
  'loss of balance',
  'severe vomiting',
  'can\'t keep fluids down',
];

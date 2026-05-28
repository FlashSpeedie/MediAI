// src/constants/onboarding.ts

import { OnboardingStep } from '@/types';

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'account_type',
    title: 'How will you use MediAI?',
    description: 'This helps us set up your account correctly.',
    fields: [
      {
        key: 'accountType',
        label: 'Account Type',
        type: 'radio',
        options: ['SOLO', 'FAMILY'],
        required: true,
      },
    ],
  },
  {
    id: 'basic_info',
    title: 'Tell us about yourself',
    description: 'Basic information helps the AI give more accurate guidance.',
    fields: [
      {
        key: 'age',
        label: 'Age',
        type: 'number',
        placeholder: 'e.g. 28',
        unit: 'years',
        required: true,
      },
      {
        key: 'gender',
        label: 'Biological Sex',
        type: 'select',
        options: ['Male', 'Female', 'Other', 'Prefer not to say'],
        required: true,
      },
      {
        key: 'bloodType',
        label: 'Blood Type',
        type: 'select',
        options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
      },
    ],
  },
  {
    id: 'measurements',
    title: 'Body Measurements',
    description: 'Used to calculate BMI and assess health context.',
    fields: [
      {
        key: 'heightCm',
        label: 'Height',
        type: 'number',
        placeholder: 'e.g. 175',
        unit: 'cm',
        required: true,
      },
      {
        key: 'weightKg',
        label: 'Weight',
        type: 'number',
        placeholder: 'e.g. 70',
        unit: 'kg',
        required: true,
      },
      {
        key: 'heartRateBpm',
        label: 'Resting Heart Rate',
        type: 'number',
        placeholder: 'e.g. 72',
        unit: 'bpm',
      },
      {
        key: 'bloodPressure',
        label: 'Blood Pressure (if known)',
        type: 'text',
        placeholder: 'e.g. 120/80',
        unit: 'mmHg',
      },
    ],
  },
  {
    id: 'lifestyle',
    title: 'Lifestyle & Diet',
    description: 'Lifestyle factors are important for health assessment.',
    fields: [
      {
        key: 'dietType',
        label: 'Diet Type',
        type: 'select',
        options: [
          'Omnivore',
          'Vegetarian',
          'Vegan',
          'Pescatarian',
          'Keto',
          'Gluten-free',
          'Other',
        ],
      },
      {
        key: 'activityLevel',
        label: 'Activity Level',
        type: 'select',
        options: [
          'Sedentary (little or no exercise)',
          'Light (1-3 days/week)',
          'Moderate (3-5 days/week)',
          'Active (6-7 days/week)',
          'Very Active (athlete)',
        ],
      },
      {
        key: 'smokingStatus',
        label: 'Smoking Status',
        type: 'select',
        options: ['Never smoked', 'Former smoker', 'Current smoker'],
      },
      {
        key: 'alcoholUse',
        label: 'Alcohol Use',
        type: 'select',
        options: ['None', 'Occasional', 'Moderate', 'Heavy'],
      },
    ],
  },
  {
    id: 'medical_history',
    title: 'Medical History',
    description: 'This helps the AI avoid dangerous recommendations.',
    fields: [
      {
        key: 'chronicConditions',
        label: 'Chronic Conditions',
        type: 'multiselect',
        options: [
          'None',
          'Diabetes (Type 1)',
          'Diabetes (Type 2)',
          'Hypertension',
          'Heart Disease',
          'Asthma',
          'COPD',
          'Kidney Disease',
          'Liver Disease',
          'Thyroid Disorder',
          'Cancer',
          'Autoimmune Disease',
          'Mental Health Condition',
          'Other',
        ],
      },
      {
        key: 'currentMedications',
        label: 'Current Medications',
        type: 'multiselect',
        options: [
          'None',
          'Blood thinners (Warfarin/Aspirin)',
          'Blood pressure medication',
          'Diabetes medication',
          'Antidepressants/Antianxiety',
          'Thyroid medication',
          'Steroids',
          'Immunosuppressants',
          'Other',
        ],
      },
      {
        key: 'knownAllergies',
        label: 'Known Drug Allergies',
        type: 'multiselect',
        options: [
          'None',
          'Penicillin',
          'Sulfa drugs',
          'NSAIDs (Ibuprofen/Aspirin)',
          'Acetaminophen',
          'Codeine/Opioids',
          'Latex',
          'Other',
        ],
      },
    ],
  },
];

export const FAMILY_STEPS: OnboardingStep[] = [
  {
    id: 'family_choice',
    title: 'Family Account Setup',
    description: 'Create a new family group or join an existing one.',
    fields: [
      {
        key: 'familyAction',
        label: 'What would you like to do?',
        type: 'radio',
        options: ['Create a new family group', 'Join existing family with a code'],
        required: true,
      },
    ],
  },
  {
    id: 'family_name',
    title: 'Name Your Family Group',
    description: 'This name will be visible to all family members.',
    fields: [
      {
        key: 'familyName',
        label: 'Family Group Name',
        type: 'text',
        placeholder: 'e.g. The Johnson Family',
        required: true,
      },
    ],
  },
  {
    id: 'family_join',
    title: 'Join Family Group',
    description: 'Enter the 6-digit code shared by your family admin.',
    fields: [
      {
        key: 'familyCode',
        label: 'Family Code',
        type: 'text',
        placeholder: 'e.g. ABC123',
        required: true,
      },
    ],
  },
];

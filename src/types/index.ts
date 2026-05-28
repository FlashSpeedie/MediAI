// src/types/index.ts

export type UrgencyLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  urgencyLevel?: UrgencyLevel;
  recommendedMedicines?: Medicine[];
  isTriageQuestion?: boolean;
  questionIndex?: number;
  imageUrl?: string;
}

export interface Medicine {
  name: string;
  genericName: string;
  dosage: string;
  frequency: string;
  warnings: string[];
  conditions: string[];   // symptoms this treats
  category: MedicineCategory;
  requiresPrescription: boolean;
}

export type MedicineCategory =
  | 'pain_fever'
  | 'allergy'
  | 'cold_flu'
  | 'digestive'
  | 'skin'
  | 'eye'
  | 'sleep'
  | 'vitamins';

export interface TriageQuestion {
  id: string;
  question: string;
  followUpTo?: string;    // id of question this follows
  category: TriageCategory;
}

export type TriageCategory =
  | 'onset'
  | 'severity'
  | 'location'
  | 'associated_symptoms'
  | 'medical_history'
  | 'medications'
  | 'allergies';

export interface ChatSession {
  id: string;
  messages: Message[];
  urgencyLevel: UrgencyLevel;
  chiefComplaint?: string;
  triageComplete: boolean;
  startedAt: Date;
}

export interface SymptomSessionRecord {
  id: string;
  createdAt: string;
  chiefComplaint: string;
  urgencyLevel: UrgencyLevel;
  summary?: string;
  completed: boolean;
  messageCount?: number;
}

export interface UrgencyAssessment {
  level: UrgencyLevel;
  reason: string;
  action: string;
  callEmergency: boolean;
  goToER: boolean;
}

// Camera / Video types
export interface CameraState {
  isActive: boolean;
  stream: MediaStream | null;
  error: string | null;
  isAnalyzing: boolean;
  lastAnalysis: string | null;
}

// Voice input types
export interface VoiceState {
  isListening: boolean;
  transcript: string;
  error: string | null;
  isSupported: boolean;
}

// API response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

export interface ChatApiRequest {
  message: string;
  sessionId?: string;
  imageBase64?: string;        // for medicine bottle analysis
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
  }>;
}

export interface ChatApiResponse {
  reply: string;
  urgencyLevel: UrgencyLevel;
  urgencyAssessment?: UrgencyAssessment;
  recommendedMedicines?: Medicine[];
  sessionId: string;
  triageComplete: boolean;
}

// ─── Account Types ────────────────────────────────────────────────────────────
export type AccountType = 'SOLO' | 'FAMILY';

export interface HealthProfile {
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  bloodType?: string;
  heartRateBpm?: number;
  bloodPressure?: string;
  activityLevel?: string;
  dietType?: string;
  smokingStatus?: string;
  alcoholUse?: string;
  chronicConditions?: string[];
  currentMedications?: string[];
  knownAllergies?: string[];
  accountType?: AccountType;
}

export interface FamilyGroup {
  id: string;
  name: string;
  code: string;
  adminId: string;
  members: FamilyMember[];
}

export interface FamilyMember {
  id: string;
  name: string | null;
  image: string | null;
  age?: number;
  gender?: string;
  onboardingComplete: boolean;
}

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  fields: OnboardingField[];
}

export interface OnboardingField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'radio';
  options?: string[];
  placeholder?: string;
  unit?: string;
  required?: boolean;
}

export interface UserContextForAI {
  age?: number;
  gender?: string;
  heightCm?: number;
  weightKg?: number;
  bmi?: number;
  bloodType?: string;
  heartRateBpm?: number;
  bloodPressure?: string;
  activityLevel?: string;
  dietType?: string;
  smokingStatus?: string;
  alcoholUse?: string;
  chronicConditions?: string[];
  currentMedications?: string[];
  knownAllergies?: string[];
  currentDateTime: string;
  currentDate: string;
  currentTime: string;
  dayOfWeek: string;
  pastHealthSummary?: string;
}

import { UrgencyLevel } from '@/types';

export interface ValidatedChatResponse {
  reply: string;
  urgencyLevel: UrgencyLevel;
  urgencyAssessment?: {
    level: UrgencyLevel;
    reason: string;
    action: string;
    callEmergency: boolean;
    goToER: boolean;
  };
  recommendedMedicines: Array<{
    name: string;
    genericName: string;
    dosage: string;
    frequency: string;
    warnings: string[];
    conditions: string[];
    category: string;
    requiresPrescription: boolean;
  }>;
  followUpQuestion?: string;
  triageComplete: boolean;
}

export function parseUrgencyFromResponse(reply: string, isHighUrgency: boolean): UrgencyLevel {
  const upper = reply.toUpperCase();
  if (upper.includes('[URGENCY: CRITICAL]') || upper.includes('CALL 911')) return 'CRITICAL';
  if (upper.includes('[URGENCY: HIGH]')) return 'HIGH';
  if (upper.includes('[URGENCY: MEDIUM]')) return 'MEDIUM';
  if (upper.includes('[URGENCY: LOW]')) return 'LOW';
  if (isHighUrgency) return 'HIGH';
  return 'LOW';
}

export function extractMedicineRecommendations(reply: string) {
  const knownMedicines = [
    { name: 'Tylenol', genericName: 'Acetaminophen', dosage: '500-1000mg', frequency: 'every 4-6 hours', warnings: ['Do not exceed 3000mg/day', 'Avoid if liver disease'], conditions: ['fever', 'headache', 'mild pain'], category: 'pain_fever', requiresPrescription: false },
    { name: 'Advil', genericName: 'Ibuprofen', dosage: '200-400mg', frequency: 'every 4-6 hours', warnings: ['Take with food', 'Avoid if stomach issues'], conditions: ['fever', 'inflammation', 'pain', 'headache'], category: 'pain_fever', requiresPrescription: false },
    { name: 'Motrin', genericName: 'Ibuprofen', dosage: '200-400mg', frequency: 'every 4-6 hours', warnings: ['Take with food'], conditions: ['fever', 'pain', 'inflammation'], category: 'pain_fever', requiresPrescription: false },
    { name: 'Aleve', genericName: 'Naproxen', dosage: '220mg', frequency: 'every 12 hours', warnings: ['Take with food'], conditions: ['pain', 'arthritis', 'cramps'], category: 'pain_fever', requiresPrescription: false },
    { name: 'Aspirin', genericName: 'Aspirin', dosage: '325mg', frequency: 'every 4-6 hours', warnings: ['NOT for under 18', 'Take with food'], conditions: ['fever', 'mild pain'], category: 'pain_fever', requiresPrescription: false },
    { name: 'Claritin', genericName: 'Loratadine', dosage: '10mg', frequency: 'once daily', warnings: ['May cause drowsiness'], conditions: ['allergies', 'runny nose', 'sneezing'], category: 'allergy', requiresPrescription: false },
    { name: 'Zyrtec', genericName: 'Cetirizine', dosage: '10mg', frequency: 'once daily', warnings: ['May cause drowsiness'], conditions: ['allergies', 'hives', 'itchy eyes'], category: 'allergy', requiresPrescription: false },
    { name: 'Benadryl', genericName: 'Diphenhydramine', dosage: '25-50mg', frequency: 'every 4-6 hours', warnings: ['Causes drowsiness', 'Do not drive'], conditions: ['severe allergies', 'itching', 'insomnia'], category: 'allergy', requiresPrescription: false },
    { name: 'DayQuil', genericName: 'Acetaminophen/Dextromethorphan', dosage: '30ml', frequency: 'every 4 hours', warnings: ['Daytime only', 'Do not combine with other Tylenol'], conditions: ['cold', 'flu', 'congestion', 'cough'], category: 'cold_flu', requiresPrescription: false },
    { name: 'NyQuil', genericName: 'Acetaminophen/Dextromethorphan', dosage: '30ml', frequency: 'every 6 hours', warnings: ['Nighttime only', 'Do not drive'], conditions: ['cold', 'flu', 'cough'], category: 'cold_flu', requiresPrescription: false },
    { name: 'Mucinex', genericName: 'Guaifenesin', dosage: '600mg', frequency: 'every 12 hours', warnings: ['Drink plenty of water'], conditions: ['chest congestion', 'mucus'], category: 'cold_flu', requiresPrescription: false },
    { name: 'Sudafed', genericName: 'Pseudoephedrine', dosage: '30mg', frequency: 'every 4-6 hours', warnings: ['May cause insomnia', 'Limit to 7 days'], conditions: ['nasal congestion', 'sinus congestion'], category: 'cold_flu', requiresPrescription: false },
    { name: 'Robitussin', genericName: 'Dextromethorphan', dosage: '10ml', frequency: 'every 4 hours', warnings: ['Do not combine with MAOIs'], conditions: ['dry cough'], category: 'cold_flu', requiresPrescription: false },
    { name: 'Pepto-Bismol', genericName: 'Bismuth Subsalicylate', dosage: '30ml', frequency: 'every 30-60 min', warnings: ['May turn tongue black'], conditions: ['nausea', 'diarrhea', 'upset stomach'], category: 'digestive', requiresPrescription: false },
    { name: 'Imodium', genericName: 'Loperamide', dosage: '4mg', frequency: 'after each bowel movement', warnings: ['Do not exceed 8mg/day'], conditions: ['diarrhea'], category: 'digestive', requiresPrescription: false },
    { name: 'Tums', genericName: 'Calcium Carbonate', dosage: '500-1000mg', frequency: 'as needed', warnings: ['May cause constipation'], conditions: ['heartburn', 'acid reflux'], category: 'digestive', requiresPrescription: false },
    { name: 'Famotidine', genericName: 'Famotidine', dosage: '20mg', frequency: 'twice daily', warnings: ['May cause headache'], conditions: ['heartburn', 'GERD'], category: 'digestive', requiresPrescription: false },
    { name: 'Hydrocortisone cream', genericName: 'Hydrocortisone', dosage: '1%', frequency: '3-4 times daily', warnings: ['Do not use on broken skin'], conditions: ['rash', 'eczema', 'insect bites'], category: 'skin', requiresPrescription: false },
    { name: 'Neosporin', genericName: 'Bacitracin/Polymyxin', dosage: 'ointment', frequency: '3 times daily', warnings: ['Do not use for more than 7 days'], conditions: ['minor cuts', 'scrapes', 'burns'], category: 'skin', requiresPrescription: false },
  ];

  return knownMedicines.filter((med) => {
    const nameInReply = reply.toLowerCase().includes(med.name.toLowerCase());
    const genericInReply = reply.toLowerCase().includes(med.genericName.toLowerCase());
    return nameInReply || genericInReply;
  });
}

export function buildUrgencyAssessment(level: UrgencyLevel, reply: string) {
  const assessments: Record<UrgencyLevel, { level: UrgencyLevel; reason: string; action: string; callEmergency: boolean; goToER: boolean }> = {
    LOW: {
      level: 'LOW',
      reason: 'Symptoms appear mild and manageable',
      action: 'Home care recommended. Monitor symptoms.',
      callEmergency: false,
      goToER: false,
    },
    MEDIUM: {
      level: 'MEDIUM',
      reason: 'Symptoms warrant medical attention',
      action: 'See a doctor within 24-48 hours or visit urgent care.',
      callEmergency: false,
      goToER: false,
    },
    HIGH: {
      level: 'HIGH',
      reason: 'Symptoms require prompt medical evaluation',
      action: 'Go to urgent care or ER within a few hours.',
      callEmergency: false,
      goToER: true,
    },
    CRITICAL: {
      level: 'CRITICAL',
      reason: 'Potential medical emergency detected',
      action: 'CALL 911 or go to the ER IMMEDIATELY.',
      callEmergency: true,
      goToER: true,
    },
  };
  return assessments[level];
}

export function validateChatResponse(data: unknown): ValidatedChatResponse {
  const reply = typeof data === 'object' && data !== null && 'reply' in data
    ? String((data as Record<string, unknown>).reply)
    : 'I encountered an error. Please try again.';

  const urgencyLevel = parseUrgencyFromResponse(reply, false);
  const recommendedMedicines = extractMedicineRecommendations(reply);
  const urgencyAssessment = buildUrgencyAssessment(urgencyLevel, reply);
  const triageComplete = reply.includes('[URGENCY:') || reply.includes('ASSESSMENT') || reply.includes('Possible Concern');
  const followUpQuestion = !triageComplete && !reply.includes('[URGENCY:') ? 'Can you tell me more about your symptoms?' : undefined;

  return {
    reply,
    urgencyLevel,
    urgencyAssessment,
    recommendedMedicines,
    followUpQuestion,
    triageComplete,
  };
}
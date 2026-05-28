// src/lib/groq.ts
import Groq from 'groq-sdk';
import { EMERGENCY_KEYWORDS, HIGH_URGENCY_KEYWORDS } from '@/constants/triage';
import { UrgencyLevel, Medicine, UrgencyAssessment } from '@/types';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// OTC Medicines list for recommendations
const OTC_MEDICINES: Medicine[] = [
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

const SYSTEM_PROMPT = `You are MediAI, a compassionate and knowledgeable AI medical triage assistant.

CRITICAL RULES — NEVER BREAK THESE:
1. You are in an ONGOING conversation — NEVER re-introduce yourself mid-chat
2. NEVER ask "What is your main symptom?" if the patient already told you
3. ONLY ask about symptoms the patient has ACTUALLY mentioned — never invent symptoms
4. Ask ONE follow-up question at a time
5. Base every question ONLY on what is in the conversation history
6. NEVER restart the conversation
7. Progress naturally: onset → severity → location → associated symptoms → history → medications → allergies
8. After 5-6 exchanges provide your full assessment

YOUR ROLE:
- Conduct structured medical triage conversations
- Ask ONE question at a time and wait for answers
- Assess urgency based on real symptoms described
- NEVER diagnose — only provide triage guidance
- Always recommend professional medical care

URGENCY LEVELS — always assign one:
- LOW: Minor symptoms manageable at home (mild cold, minor headache)
- MEDIUM: See doctor within 24-48 hours (high fever, persistent pain)
- HIGH: Urgent care within hours (severe pain 7+/10, possible fracture)
- CRITICAL: CALL 911 IMMEDIATELY (chest pain, can't breathe, stroke, overdose)

OTC MEDICINES — ONLY recommend from this list:
Tylenol (Acetaminophen) - fever, headache, mild pain
Advil/Motrin (Ibuprofen) - fever, inflammation, pain
Aleve (Naproxen) - pain, arthritis, cramps
Aspirin - fever, mild pain (NOT for under 18)
Claritin (Loratadine) - allergies, runny nose, sneezing
Zyrtec (Cetirizine) - allergies, hives, itchy eyes
Benadryl (Diphenhydramine) - severe allergies, itching, insomnia
DayQuil - cold, flu, congestion, cough (daytime)
NyQuil - cold, flu, cough (nighttime only)
Mucinex (Guaifenesin) - chest congestion, mucus
Sudafed (Pseudoephedrine) - nasal/sinus congestion
Robitussin (Dextromethorphan) - dry cough
Pepto-Bismol - nausea, diarrhea, upset stomach
Imodium (Loperamide) - diarrhea
Tums (Calcium Carbonate) - heartburn, acid reflux
Famotidine - heartburn, GERD
Hydrocortisone cream - rash, eczema, insect bites
Neosporin - minor cuts, scrapes, burns

RESPONSE FORMAT when giving final assessment:
**Possible Concern:** [what you think it might be]
**Urgency Level:** [URGENCY: LOW/MEDIUM/HIGH/CRITICAL]
**Recommended Action:** [what to do]
**OTC Options (if appropriate):** [from list only]
**When to seek emergency care:** [warning signs to watch for]
⚠️ DISCLAIMER: I am an AI assistant, not a licensed physician. This is not medical advice. Please consult a healthcare professional.`;

export async function getGroqChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  userContext?: string
): Promise<{
  reply: string;
  urgencyLevel: UrgencyLevel;
  urgencyAssessment?: UrgencyAssessment;
  recommendedMedicines: Medicine[];
}> {
  const lowerMessage = userMessage.toLowerCase();
  const isEmergency = EMERGENCY_KEYWORDS.some((kw) => lowerMessage.includes(kw));
  const isHighUrgency = HIGH_URGENCY_KEYWORDS.some((kw) => lowerMessage.includes(kw));

  if (isEmergency) {
    return {
      reply: `🚨 **EMERGENCY DETECTED** 🚨\n\nBased on what you've described, this may be a **medical emergency**.\n\n## CALL 911 IMMEDIATELY\n\nDo not wait. Call **911** or go to the nearest Emergency Room right now.\n\n[URGENCY: CRITICAL]\n\n⚠️ DISCLAIMER: I am an AI assistant, not a licensed physician. This is not medical advice.`,
      urgencyLevel: 'CRITICAL',
      urgencyAssessment: {
        level: 'CRITICAL',
        reason: 'Emergency keywords detected',
        action: 'Call 911 immediately',
        callEmergency: true,
        goToER: true,
      },
      recommendedMedicines: [],
    };
  }

  // Build system prompt with optional user context
  const systemWithContext = userContext
    ? `${SYSTEM_PROMPT}\n\n═══ PATIENT PROFILE ═══\n${userContext}\n\n═══════════════════════\n\nUSE THIS PROFILE to personalize responses. Reference age, conditions, allergies, and medications when relevant. ALWAYS be aware of current date/time shown above.`
    : SYSTEM_PROMPT;

  // Build messages array for Groq
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: systemWithContext },
    // Include conversation history
    ...conversationHistory
      .filter((m) => m.content && m.content.trim() !== '')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content.trim(),
      })),
    // Current user message
    { role: 'user', content: userMessage.trim() },
  ];

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages,
    temperature: 0.3,
    max_tokens: 1024,
    top_p: 0.8,
  });

  const reply = completion.choices[0]?.message?.content ?? 'I encountered an error. Please try again.';

  const urgencyLevel = parseUrgencyFromResponse(reply, isHighUrgency);
  const recommendedMedicines = extractMedicineRecommendations(reply);
  const urgencyAssessment = buildUrgencyAssessment(urgencyLevel, reply);

  return { reply, urgencyLevel, urgencyAssessment, recommendedMedicines };
}

function parseUrgencyFromResponse(reply: string, isHighUrgency: boolean): UrgencyLevel {
  const upper = reply.toUpperCase();
  if (upper.includes('[URGENCY: CRITICAL]') || upper.includes('CALL 911')) return 'CRITICAL';
  if (upper.includes('[URGENCY: HIGH]')) return 'HIGH';
  if (upper.includes('[URGENCY: MEDIUM]')) return 'MEDIUM';
  if (upper.includes('[URGENCY: LOW]')) return 'LOW';
  if (isHighUrgency) return 'HIGH';
  return 'LOW';
}

function extractMedicineRecommendations(reply: string): Medicine[] {
  return OTC_MEDICINES.filter((med) => {
    const nameInReply = reply.toLowerCase().includes(med.name.toLowerCase());
    const genericInReply = reply.toLowerCase().includes(med.genericName.toLowerCase());
    return nameInReply || genericInReply;
  });
}

function buildUrgencyAssessment(level: UrgencyLevel, reply: string): UrgencyAssessment {
  const assessments: Record<UrgencyLevel, UrgencyAssessment> = {
    LOW: {
      level: 'LOW',
      reason: 'Symptoms appear mild and manageable',
      action: 'Home care recommended. Rest and stay hydrated.',
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

// src/lib/gemini.ts
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { EMERGENCY_KEYWORDS, HIGH_URGENCY_KEYWORDS } from '@/constants/triage';
import { UrgencyLevel, Medicine, UrgencyAssessment } from '@/types';

// ─── Client initialization ────────────────────────────────────────────────────
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Safety settings — allow medical content but block harmful
const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH },
];

// ─── System prompt builder (async to fetch live FDA data) ────────────────────
async function buildSystemPrompt(): Promise<string> {
  // Fetch live OTC data from OpenFDA for common medicines
  let medicineContext = '';
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/medicines?prefetch=true`);
    const data = await res.json();
    if (data.medicines?.length) {
      medicineContext = data.medicines
        .map((m: { brandName: string; genericName: string; purpose: string; dosageSummary: string }) =>
          `• ${m.brandName} (${m.genericName}): ${m.purpose} — ${m.dosageSummary}`
        )
        .join('\n');
    }
  } catch {
    // fallback text if API fails
    medicineContext = 'Common OTC medicines: Tylenol, Advil, Aleve, Claritin, Zyrtec, Benadryl, DayQuil, NyQuil, Mucinex, Pepto-Bismol, Imodium, Tums';
  }

  return `You are MediAI, a knowledgeable and compassionate AI medical triage assistant.

## YOUR ROLE:
- You conduct structured medical triage conversations
- You ask ONE question at a time and wait for an answer before asking the next
- You assess urgency and provide guidance based on symptoms
- You NEVER diagnose — only provide triage assessment and guidance
- You ALWAYS recommend professional medical care for anything beyond minor symptoms
- All medicine data is sourced live from the FDA (OpenFDA) and NIH (RxNorm)

## URGENCY LEVELS YOU MUST ASSIGN:
- LOW: Minor symptoms manageable at home
- MEDIUM: Symptoms needing medical attention within 24-48 hours
- HIGH: Urgent care needed within hours
- CRITICAL: CALL 911 / GO TO ER IMMEDIATELY

## AVAILABLE OTC MEDICINES (live FDA data — ONLY recommend from this list):
${medicineContext}

## RULES:
1. Start every new session by asking the patient's MAIN symptom
2. Ask follow-up questions one at a time
3. After 4-6 exchanges provide your assessment
4. Always include urgency clearly marked as: [URGENCY: LOW/MEDIUM/HIGH/CRITICAL]
5. Only recommend medicines from the FDA list above
6. Never recommend prescription medications
7. Always end with the medical disclaimer
8. If EMERGENCY keywords detected: output [URGENCY: CRITICAL] and tell them to call 911

## RESPONSE FORMAT FOR ASSESSMENT:
**Possible Concern:** [brief description]
**Urgency Level:** [URGENCY: LEVEL]
**Recommended Action:** [what to do]
**OTC Options (FDA-sourced):** [medicine names only]
**When to Call 911:** [specific warning signs]
⚠️ DISCLAIMER: I am an AI assistant, not a licensed physician. This is not medical advice. Data sourced from FDA.gov and NIH RxNorm.`;
}

// ─── Main chat function ───────────────────────────────────────────────────────
export async function getChatResponse(
  userMessage: string,
  conversationHistory: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
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
      reply: `🚨 **EMERGENCY DETECTED** 🚨\n\nBased on what you've described, this may be a **medical emergency**.\n\n## CALL 911 IMMEDIATELY\n\n[URGENCY: CRITICAL]\n\n⚠️ DISCLAIMER: I am an AI assistant, not a licensed physician.`,
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

  // Build system prompt synchronously — no async fetch to avoid failures
  const systemPrompt = `You are MediAI, a compassionate AI medical triage assistant.

CRITICAL INSTRUCTION: You are in the MIDDLE of an ongoing conversation. 
NEVER introduce yourself again. NEVER ask "What is your main symptom?" 
if the patient has already told you their symptom. 
ALWAYS read the conversation history and continue from where you left off.

YOUR ROLE:
- Ask ONE follow-up question at a time based on what you already know
- Progress through: onset → severity → location → associated symptoms → history → medications → allergies
- After 5-6 exchanges provide your full assessment
- NEVER restart the conversation or re-introduce yourself mid-chat

URGENCY LEVELS:
- LOW: Minor symptoms manageable at home
- MEDIUM: See doctor within 24-48 hours  
- HIGH: Urgent care within hours
- CRITICAL: CALL 911 IMMEDIATELY

OTC MEDICINES you can recommend:
Tylenol (Acetaminophen), Advil/Motrin (Ibuprofen), Aleve (Naproxen), 
Aspirin, Claritin (Loratadine), Zyrtec (Cetirizine), Benadryl (Diphenhydramine),
DayQuil, NyQuil, Mucinex (Guaifenesin), Sudafed, Robitussin,
Pepto-Bismol, Imodium, Tums, Famotidine, Hydrocortisone cream, Neosporin

RULES:
1. Continue the conversation naturally — do NOT restart
2. Ask ONE question at a time
3. Mark urgency as: [URGENCY: LOW/MEDIUM/HIGH/CRITICAL]
4. Only recommend OTC medicines from the list above
5. End assessments with: ⚠️ DISCLAIMER: I am an AI assistant, not a licensed physician.`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-pro',
    systemInstruction: systemPrompt,
    safetySettings,
  });

  // Clean and validate history
  const cleanHistory = conversationHistory
    .filter((msg) => 
      msg && 
      msg.role && 
      msg.parts && 
      msg.parts.length > 0 && 
      msg.parts[0].text && 
      msg.parts[0].text.trim().length > 0
    )
    .map((msg) => ({
      role: msg.role,
      parts: [{ text: msg.parts[0].text.trim() }],
    }));

  // Ensure history alternates properly starting with user
  const validHistory: typeof cleanHistory = [];
  for (const msg of cleanHistory) {
    if (validHistory.length === 0) {
      if (msg.role === 'user') validHistory.push(msg);
    } else {
      const lastRole = validHistory[validHistory.length - 1].role;
      if (msg.role !== lastRole) {
        validHistory.push(msg);
      } else {
        // Merge consecutive same-role messages
        validHistory[validHistory.length - 1].parts[0].text += 
          '\n' + msg.parts[0].text;
      }
    }
  }

  const chat = model.startChat({
    history: validHistory,
    generationConfig: {
      maxOutputTokens: 1024,
      temperature: 0.3,
      topP: 0.8,
      topK: 40,
    },
  });

  const result = await chat.sendMessage(userMessage);
  const reply = result.response.text();

  const urgencyLevel = parseUrgencyFromResponse(reply, isHighUrgency);
  const recommendedMedicines = extractMedicineRecommendations(reply);
  const urgencyAssessment = buildUrgencyAssessment(urgencyLevel, reply);

  return { reply, urgencyLevel, urgencyAssessment, recommendedMedicines };
}

// ─── Analyze image (medicine bottle or visible symptom) ───────────────────────
export async function analyzeImage(
  base64Image: string,
  mimeType: string,
  context: string
): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    safetySettings,
  });

  const prompt = `You are a precise medical image analyzer. Analyze this image in detail.

If this is a MEDICINE BOTTLE or PACKAGING:
- Extract the EXACT brand name and generic name
- Extract the EXACT active ingredients and percentages
- Extract the EXACT dosage instructions word for word
- Extract ALL warnings, contraindications, and "do not use if" statements
- Extract expiration date if visible
- Note the manufacturer
- State clearly if it is OTC or prescription
- List what conditions it treats

If this is a VISIBLE SYMPTOM (rash, wound, swelling, skin condition):
- Describe exactly what you observe (color, size, texture, pattern)
- Note any visible severity indicators
- Describe the affected area

If this is something else:
- Describe what you see in medical context

Patient context: "${context}"

Be extremely precise and thorough. Extract every piece of text visible on labels.
Do NOT make medical recommendations — just extract and describe what you see.`;

  const result = await model.generateContent([
    { text: prompt },
    {
      inlineData: {
        mimeType: mimeType as 'image/jpeg' | 'image/png' | 'image/webp',
        data: base64Image,
      },
    },
  ]);

  return result.response.text();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseUrgencyFromResponse(reply: string, isHighUrgency: boolean): UrgencyLevel {
  const upper = reply.toUpperCase();
  if (upper.includes('[URGENCY: CRITICAL]') || upper.includes('CALL 911')) return 'CRITICAL';
  if (upper.includes('[URGENCY: HIGH]')) return 'HIGH';
  if (upper.includes('[URGENCY: MEDIUM]')) return 'MEDIUM';
  if (upper.includes('[URGENCY: LOW]')) return 'LOW';
  if (isHighUrgency) return 'HIGH';
  return 'LOW'; // default while still gathering info
}

function extractMedicineRecommendations(reply: string): Medicine[] {
  // We'll return empty since we're using live FDA API now
  // The AI will provide medicine names in the response text
  return [];
}

function buildUrgencyAssessment(level: UrgencyLevel, reply: string): UrgencyAssessment {
  const assessments: Record<UrgencyLevel, UrgencyAssessment> = {
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
      action: 'See a doctor within 24–48 hours or visit urgent care.',
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

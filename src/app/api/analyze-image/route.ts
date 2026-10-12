import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/gemini';
import { getGroqChatResponse } from '@/lib/groq';
import { validateRequest, analyzeImageRequestSchema } from '@/lib/validation';
import { imageAnalysisRateLimiter, addRateLimitHeaders } from '@/lib/rate-limit';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function validateBase64Image(base64: string, mimeType: string): { valid: boolean; error?: string } {
  if (!base64 || base64.length === 0) {
    return { valid: false, error: 'Image data is empty' };
  }

  if (base64.length > MAX_IMAGE_SIZE * 1.5) { // base64 is ~33% larger
    return { valid: false, error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE / (1024 * 1024)}MB` };
  }

  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return { valid: false, error: `Unsupported image type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}` };
  }

  // Basic base64 validation
  const base64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  if (!base64Regex.test(base64)) {
    return { valid: false, error: 'Invalid image encoding' };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  const rateLimitResult = await imageAnalysisRateLimiter(request);

  try {
    const body = await request.json();
    const validation = validateRequest(analyzeImageRequestSchema, body);

    if (!validation.success) {
      const response = NextResponse.json({ error: validation.error }, { status: 400 });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    const { imageBase64, mimeType = 'image/jpeg', context } = validation.data;

    const imageValidation = validateBase64Image(imageBase64, mimeType);
    if (!imageValidation.valid) {
      const response = NextResponse.json({ error: imageValidation.error }, { status: 400 });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    // Step 1: Gemini Vision reads the image and extracts all text/details
    const geminiAnalysis = await analyzeImage(
      imageBase64,
      mimeType,
      context ?? 'Patient uploaded a medicine or symptom photo.'
    );

    // Step 2: Groq takes Gemini's analysis and gives smart medical recommendation
    const { reply: groqRecommendation } = await getGroqChatResponse(
      `A patient uploaded a photo. Here is what the image analysis detected:\n\n${geminiAnalysis}\n\nBased on this information, provide a clear, helpful medical guidance. If this is a medicine bottle: confirm what it treats, correct dosage, important warnings, and whether it is appropriate OTC. If this is a symptom photo: describe what you observe and urgency level. Be concise and helpful.`,
      [] // no prior history needed for image analysis
    );

    // Combine both analyses
    const combinedAnalysis = `**📷 Image Analysis (Gemini Vision):**\n${geminiAnalysis}\n\n**💊 Medical Guidance (AI):**\n${groqRecommendation}`;

    const response = NextResponse.json({ analysis: combinedAnalysis, geminiAnalysis, groqRecommendation });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Image analysis error:', error);
    const response = NextResponse.json(
      { error: 'Failed to analyze image. Please try again.' },
      { status: 500 }
    );
    return addRateLimitHeaders(response, rateLimitResult);
  }
}

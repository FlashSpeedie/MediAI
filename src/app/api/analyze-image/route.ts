import { NextRequest, NextResponse } from 'next/server';
import { analyzeImage } from '@/lib/gemini';
import { getGroqChatResponse } from '@/lib/groq';

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, mimeType, context } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: 'Image data is required' }, { status: 400 });
    }

    // Step 1: Gemini Vision reads the image and extracts all text/details
    const geminiAnalysis = await analyzeImage(
      imageBase64,
      mimeType ?? 'image/jpeg',
      context ?? 'Patient uploaded a medicine or symptom photo.'
    );

    // Step 2: Groq takes Gemini's analysis and gives smart medical recommendation
    const { reply: groqRecommendation } = await getGroqChatResponse(
      `A patient uploaded a photo. Here is what the image analysis detected:\n\n${geminiAnalysis}\n\nBased on this information, provide a clear, helpful medical guidance. If this is a medicine bottle: confirm what it treats, correct dosage, important warnings, and whether it is appropriate OTC. If this is a symptom photo: describe what you observe and urgency level. Be concise and helpful.`,
      [] // no prior history needed for image analysis
    );

    // Combine both analyses
    const combinedAnalysis = `**📷 Image Analysis (Gemini Vision):**\n${geminiAnalysis}\n\n**💊 Medical Guidance (AI):**\n${groqRecommendation}`;

    return NextResponse.json({ analysis: combinedAnalysis });
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image' },
      { status: 500 }
    );
  }
}

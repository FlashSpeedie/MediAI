import { NextRequest, NextResponse } from 'next/server';
import { getDrugInfo, searchMedicinesBySymptom, OTC_SEED_NAMES, CombinedDrugInfo, getDrugInfoWithRecalls, searchFDAEnforcement } from '@/lib/medicine-api';
import { validateRequest, medicineSearchSchema, MedicineSearchParams } from '@/lib/validation';
import { medicineLookupRateLimiter, addRateLimitHeaders } from '@/lib/rate-limit';

// GET /api/medicines?drug=Tylenol  — look up one drug
// GET /api/medicines?symptom=headache  — search by symptom
// GET /api/medicines?prefetch=true  — get full seed list
// GET /api/medicines?recall=drugname  — look up recalls for a drug

export async function GET(request: NextRequest) {
  const rateLimitResult = await medicineLookupRateLimiter(request);

  const { searchParams } = new URL(request.url);
  const validation = validateRequest(medicineSearchSchema, Object.fromEntries(searchParams.entries()));

  if (!validation.success) {
    const response = NextResponse.json({ error: validation.error }, { status: 400 });
    return addRateLimitHeaders(response, rateLimitResult);
  }

  const params: MedicineSearchParams = validation.data;
  const { drug, symptom, prefetch, recall } = params;

  try {
    if (recall) {
      const recalls = await searchFDAEnforcement(recall, { limit: 10 });
      const response = NextResponse.json({ recalls });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    if (drug) {
      const result = await getDrugInfoWithRecalls(drug);
      const response = NextResponse.json({ medicine: result.drugInfo, recalls: result.recalls });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    if (symptom) {
      const results = await searchMedicinesBySymptom(symptom);
      const response = NextResponse.json({ medicines: results });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    if (prefetch === 'true') {
      // Fetch all seed medicines with recalls in parallel
      const results = await Promise.allSettled(
        OTC_SEED_NAMES.map((name) => getDrugInfoWithRecalls(name))
      );
      const medicines = results
        .filter((r) => r.status === 'fulfilled' && r.value?.drugInfo)
        .map((r) => (r as PromiseFulfilledResult<{ drugInfo: CombinedDrugInfo | null; recalls: unknown }>).value);
      const response = NextResponse.json({ medicines: medicines.map(m => m.drugInfo) });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    if (prefetch === 'false') {
      // Fetch first 8 from seed list in parallel
      const results = await Promise.allSettled(
        OTC_SEED_NAMES.slice(0, 8).map((name) => getDrugInfo(name))
      );
      const medicines = results
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => (r as PromiseFulfilledResult<CombinedDrugInfo | null>).value);
      const response = NextResponse.json({ medicines });
      return addRateLimitHeaders(response, rateLimitResult);
    }

    const response = NextResponse.json({ error: 'Provide drug, symptom, recall, or prefetch param' }, { status: 400 });
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error('Medicine API error:', error);
    const response = NextResponse.json({ error: 'Medicine API error' }, { status: 500 });
    return addRateLimitHeaders(response, rateLimitResult);
  }
}
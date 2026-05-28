// src/app/api/medicines/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getDrugInfo, searchMedicinesBySymptom, OTC_SEED_NAMES, CombinedDrugInfo } from '@/lib/medicine-api';

// GET /api/medicines?drug=Tylenol  — look up one drug
// GET /api/medicines?symptom=headache  — search by symptom
// GET /api/medicines?prefetch=true  — get full seed list

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const drug = searchParams.get('drug');
  const symptom = searchParams.get('symptom');
  const prefetch = searchParams.get('prefetch');

  try {
    if (drug) {
      const info = await getDrugInfo(drug);
      if (!info) return NextResponse.json({ error: 'Drug not found' }, { status: 404 });
      return NextResponse.json({ medicine: info });
    }

    if (symptom) {
      const results = await searchMedicinesBySymptom(symptom);
      return NextResponse.json({ medicines: results });
    }

    if (prefetch === 'false') {
      // Fetch first 8 from seed list in parallel (don't fetch all 20 at once)
      const results = await Promise.allSettled(
        OTC_SEED_NAMES.slice(0, 8).map((name) => getDrugInfo(name))
      );
      const medicines = results
        .filter((r) => r.status === 'fulfilled' && r.value)
        .map((r) => (r as PromiseFulfilledResult<CombinedDrugInfo | null>).value);
      return NextResponse.json({ medicines });
    }

    return NextResponse.json({ error: 'Provide drug, symptom, or prefetch param' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Medicine API error' }, { status: 500 });
  }
}

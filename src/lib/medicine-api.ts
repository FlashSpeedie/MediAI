// src/lib/medicine-api.ts

// ─── OpenFDA API Response Types ───────────────────────────────────────────────
interface OpenFDA {
  brand_name?: string[];
  generic_name?: string[];
  manufacturer_name?: string[];
  product_ndc?: string[];
  route?: string[];
  substance_name?: string[];
  rxcui?: string[];
}

interface FDALabelResult {
  openfda?: OpenFDA;
  purpose?: string[];
  indications_and_usage?: string[];
  warnings?: string[];
  dosage_and_administration?: string[];
  adverse_reactions?: string[];
  do_not_use?: string[];
  ask_doctor?: string[];
  active_ingredient?: string[];
  "ask_d pharmacist"?: string[];
  stop_use?: string[];
  keep_out_of_reach?: string[];
}

export interface FDADrugInfo {
  brandName: string;
  genericName: string;
  purpose: string[];
  indications: string[];
  warnings: string[];
  dosage: string[];
  sideEffects: string[];
  activeIngredients: string[];
  doNotUse: string[];
  askDoctorBefore: string[];
  source: 'openFDA';
}

export interface RxNormDrugInfo {
  rxcui: string;
  name: string;
  synonym: string;
  drugClass: string;
  source: 'rxNorm';
}

export interface CombinedDrugInfo {
  brandName: string;
  genericName: string;
  rxcui?: string;
  drugClass?: string;
  purpose: string;
  indications: string[];
  warnings: string[];
  dosageSummary: string;
  sideEffects: string[];
  doNotUse: string[];
  askDoctorBefore: string[];
  fdaSource: boolean;
  rxNormSource: boolean;
}

// ─── FDA Recall Types ──────────────────────────────────────────────────────────
interface FDAEnforcementResult {
  recall_number?: string;
  product_description?: string;
  product_quantity?: string;
  reason_for_recall?: string;
  recall_initiation_date?: string;
  classification?: string;
  status?: string;
  distribution_pattern?: string;
  code_info?: string;
  recalling_firm?: string;
  product_type?: string;
  voluntary_mandated?: string;
  report_date?: string;
  recalling_firm_city?: string;
  recalling_firm_state?: string;
  termination_date?: string;
  openfda?: OpenFDA;
}

export interface RecallResult {
  recallNumber: string;
  productDescription: string;
  reasonForRecall: string;
  recallDate: string;
  classification: string;
  status: string;
  firmName: string;
  productType: string;
  sourceUrl: string;
  retrievedAt: string;
}

export interface RecallSearchResult {
  matches: RecallResult[];
  searchTerm: string;
  searchedAt: string;
  queryStatus: 'success' | 'no_matches' | 'ambiguous' | 'error';
  error?: string;
}

// ─── OpenFDA Search ───────────────────────────────────────────────────────────
export async function searchOpenFDA(drugName: string): Promise<FDADrugInfo | null> {
  try {
    const query = encodeURIComponent(`brand_name:"${drugName}" OR generic_name:"${drugName}"`);
    const url = `https://api.fda.gov/drug/label.json?search=${query}&limit=1`;
    
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MediAI-App/1.0' },
      next: { revalidate: 3600 }, // cache for 1 hour
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;

    const r = data.results[0];

    return {
      brandName: r.openfda?.brand_name?.[0] ?? drugName,
      genericName: r.openfda?.generic_name?.[0] ?? '',
      purpose: r.purpose ?? [],
      indications: r.indications_and_usage ?? [],
      warnings: r.warnings ?? r.warnings_and_cautions ?? [],
      dosage: r.dosage_and_administration ?? [],
      sideEffects: r.adverse_reactions ?? [],
      activeIngredients: r.active_ingredient ?? [],
      doNotUse: r.do_not_use ?? [],
      askDoctorBefore: r.ask_doctor ?? r.ask_doctor_or_pharmacist ?? [],
      source: 'openFDA',
    };
  } catch {
    return null;
  }
}

// ─── RxNorm Search ────────────────────────────────────────────────────────────
export async function searchRxNorm(drugName: string): Promise<RxNormDrugInfo | null> {
  try {
    // Step 1: Get RxCUI (drug identifier)
    const spellingUrl = `https://rxnav.nlm.nih.gov/REST/spellingsuggestions.json?name=${encodeURIComponent(drugName)}`;
    const approxUrl = `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(drugName)}&maxEntries=1`;
    
    const approxRes = await fetch(approxUrl, {
      next: { revalidate: 3600 },
    });
    const approxData = await approxRes.json();
    const rxcui = approxData.approximateGroup?.candidate?.[0]?.rxcui;
    if (!rxcui) return null;

    // Step 2: Get drug class
    const classUrl = `https://rxnav.nlm.nih.gov/REST/rxclass/class/byRxcui.json?rxcui=${rxcui}&relaSource=MEDRT&relas=may_treat`;
    const classRes = await fetch(classUrl, { next: { revalidate: 3600 } });
    const classData = await classRes.json();
    const drugClass = classData.rxclassDrugInfoList?.rxclassDrugInfo?.[0]?.rxclassMinConceptItem?.className ?? '';

    return {
      rxcui,
      name: drugName,
      synonym: approxData.approximateGroup?.candidate?.[0]?.name ?? drugName,
      drugClass,
      source: 'rxNorm',
    };
  } catch {
    return null;
  }
}

// ─── Combined lookup (calls both APIs in parallel) ────────────────────────────
export async function getDrugInfo(drugName: string): Promise<CombinedDrugInfo | null> {
  const [fdaInfo, rxInfo] = await Promise.allSettled([
    searchOpenFDA(drugName),
    searchRxNorm(drugName),
  ]);

  const fda = fdaInfo.status === 'fulfilled' ? fdaInfo.value : null;
  const rx = rxInfo.status === 'fulfilled' ? rxInfo.value : null;

  if (!fda && !rx) return null;

  // Truncate long FDA text to first 300 chars for readability
  const truncate = (arr: string[]) =>
    arr.map((s) => s.replace(/\s+/g, ' ').trim().substring(0, 300)).filter(Boolean);

  return {
    brandName: fda?.brandName ?? rx?.name ?? drugName,
    genericName: fda?.genericName ?? '',
    rxcui: rx?.rxcui,
    drugClass: rx?.drugClass,
    purpose: fda?.purpose?.[0]?.substring(0, 150) ?? 'OTC Medicine',
    indications: truncate(fda?.indications ?? []).slice(0, 2),
    warnings: truncate(fda?.warnings ?? []).slice(0, 3),
    dosageSummary: fda?.dosage?.[0]?.substring(0, 200) ?? 'Follow package directions',
    sideEffects: truncate(fda?.sideEffects ?? []).slice(0, 2),
    doNotUse: truncate(fda?.doNotUse ?? []).slice(0, 3),
    askDoctorBefore: truncate(fda?.askDoctorBefore ?? []).slice(0, 2),
    fdaSource: !!fda,
    rxNormSource: !!rx,
  };
}

// ─── Search for OTC medicines by symptom keyword ──────────────────────────────
export async function searchMedicinesBySymptom(symptom: string): Promise<CombinedDrugInfo[]> {
  try {
    const encoded = encodeURIComponent(symptom);
    const url = `https://api.fda.gov/drug/label.json?search=indications_and_usage:"${encoded}"+AND+marketing_category:"OTC monograph final"&limit=5`;
    
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    
    const data = await res.json();
    if (!data.results?.length) return [];

    const results: CombinedDrugInfo[] = data.results.map((r: FDALabelResult) => ({
      brandName: r.openfda?.brand_name?.[0] ?? 'Unknown',
      genericName: r.openfda?.generic_name?.[0] ?? '',
      purpose: r.purpose?.[0]?.substring(0, 150) ?? '',
      indications: (r.indications_and_usage ?? []).map((s: string) => s.substring(0, 300)).slice(0, 1),
      warnings: (r.warnings ?? []).map((s: string) => s.substring(0, 200)).slice(0, 2),
      dosageSummary: r.dosage_and_administration?.[0]?.substring(0, 200) ?? 'See package',
      sideEffects: (r.adverse_reactions ?? []).map((s: string) => s.substring(0, 150)).slice(0, 2),
      doNotUse: (r.do_not_use ?? []).map((s: string) => s.substring(0, 200)).slice(0, 2),
      askDoctorBefore: (r.ask_doctor ?? []).map((s: string) => s.substring(0, 150)).slice(0, 2),
      fdaSource: true,
      rxNormSource: false,
    }));

    return results;
  } catch {
    return [];
  }
}

// ─── Curated safe OTC seed list (used for pre-fetching on app load) ────────────
export const OTC_SEED_NAMES = [
  'Tylenol',
  'Advil',
  'Aleve',
  'Aspirin',
  'Claritin',
  'Zyrtec',
  'Benadryl',
  'DayQuil',
  'NyQuil',
  'Mucinex',
  'Sudafed',
  'Pepto-Bismol',
  'Imodium',
  'Tums',
  'Famotidine',
  'Hydrocortisone',
  'Neosporin',
  'Robitussin',
  'Theraflu',
  'Dramamine',
];

// ─── FDA Recall Lookup ─────────────────────────────────────────────────────────
export async function searchFDAEnforcement(
  searchTerm: string,
  options: { limit?: number } = {}
): Promise<RecallSearchResult> {
  const { limit = 10 } = options;
  const searchedAt = new Date().toISOString();

  try {
    const encodedTerm = encodeURIComponent(searchTerm);
    const url = `https://api.fda.gov/drug/enforcement.json?search=product_description:${encodedTerm}+OR+recalling_firm:${encodedTerm}&limit=${limit}`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'MediAI-App/1.0' },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return {
        matches: [],
        searchTerm,
        searchedAt,
        queryStatus: 'error',
        error: `FDA API error: ${res.status}`,
      };
    }

    const data = await res.json();
    const results = data.results as FDAEnforcementResult[] | undefined;

    if (!results?.length) {
      return {
        matches: [],
        searchTerm,
        searchedAt,
        queryStatus: 'no_matches',
      };
    }

    const matches: RecallResult[] = results.map((r) => ({
      recallNumber: r.recall_number ?? 'Unknown',
      productDescription: r.product_description ?? 'Unknown product',
      reasonForRecall: r.reason_for_recall ?? 'No reason provided',
      recallDate: r.recall_initiation_date ?? 'Unknown date',
      classification: r.classification ?? 'Unclassified',
      status: r.status ?? 'Unknown',
      firmName: r.recalling_firm ?? 'Unknown firm',
      productType: r.product_type ?? 'Drug',
      sourceUrl: `https://www.accessdata.fda.gov/scripts/cdrh/cfdocs/cfRes/res.cfm?recall_number=${r.recall_number}`,
      retrievedAt: searchedAt,
    }));

    return {
      matches,
      searchTerm,
      searchedAt,
      queryStatus: matches.length === 1 ? 'success' : 'ambiguous',
    };
  } catch (error) {
    return {
      matches: [],
      searchTerm,
      searchedAt,
      queryStatus: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ─── Enhanced drug info with recall data ───────────────────────────────────────
export async function getDrugInfoWithRecalls(drugName: string): Promise<{
  drugInfo: CombinedDrugInfo | null;
  recalls: RecallSearchResult;
}> {
  const [drugInfo, recalls] = await Promise.allSettled([
    getDrugInfo(drugName),
    searchFDAEnforcement(drugName, { limit: 5 }),
  ]);

  return {
    drugInfo: drugInfo.status === 'fulfilled' ? drugInfo.value : null,
    recalls: recalls.status === 'fulfilled' ? recalls.value : {
      matches: [],
      searchTerm: drugName,
      searchedAt: new Date().toISOString(),
      queryStatus: 'error',
      error: recalls.status === 'rejected' ? recalls.reason?.message : 'Unknown error',
    },
  };
}

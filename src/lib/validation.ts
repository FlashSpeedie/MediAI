import { z } from 'zod';

export const chatApiRequestSchema = z.object({
  message: z.string().max(5000).optional(),
  sessionId: z.string().cuid().optional(),
  imageBase64: z.string().max(10 * 1024 * 1024).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().min(1).max(5000),
  })).max(20).optional(),
}).refine((data) => data.message?.trim() || data.imageBase64, {
  message: 'Either message or imageBase64 is required',
  path: ['message'],
});

export const analyzeImageRequestSchema = z.object({
  imageBase64: z.string().min(1).max(10 * 1024 * 1024),
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']).optional(),
  context: z.string().max(1000).optional(),
});

export const medicineSearchSchema = z.object({
  drug: z.string().min(1).max(100).optional(),
  symptom: z.string().min(1).max(100).optional(),
  prefetch: z.enum(['true', 'false']).optional(),
  recall: z.string().min(1).max(100).optional(),
}).refine((data) => data.drug || data.symptom || data.prefetch || data.recall, {
  message: 'At least one of drug, symptom, prefetch, or recall is required',
  path: ['drug'],
});

export const onboardingSchema = z.object({
  age: z.coerce.number().int().min(1).max(120).optional(),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say']).optional(),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown']).optional(),
  heightCm: z.coerce.number().positive().max(300).optional(),
  weightKg: z.coerce.number().positive().max(500).optional(),
  heartRateBpm: z.coerce.number().int().positive().max(300).optional(),
  bloodPressure: z.string().regex(/^\d{2,3}\/\d{2,3}$/).optional(),
  activityLevel: z.enum(['Sedentary (little or no exercise)', 'Light (1-3 days/week)', 'Moderate (3-5 days/week)', 'Active (6-7 days/week)', 'Very Active (athlete)']).optional(),
  dietType: z.enum(['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Gluten-free', 'Halal', 'Kosher', 'Other']).optional(),
  smokingStatus: z.enum(['Never smoked', 'Former smoker', 'Current smoker']).optional(),
  alcoholUse: z.enum(['None', 'Occasional', 'Moderate', 'Heavy']).optional(),
  chronicConditions: z.array(z.string().max(100)).optional(),
  currentMedications: z.array(z.string().max(100)).optional(),
  knownAllergies: z.array(z.string().max(100)).optional(),
  accountType: z.enum(['SOLO', 'FAMILY']).optional(),
});

export const registerSchema = z.object({
  name: z.string().max(100).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const familyCreateSchema = z.object({
  familyName: z.string().min(1).max(100),
});

export const familyJoinSchema = z.object({
  code: z.string().length(6).regex(/^[A-Z0-9]+$/),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const cabinetCreateSchema = z.object({
  productName: z.string().min(1).max(200),
  brandName: z.string().max(200).optional(),
  genericName: z.string().max(200).optional(),
  strength: z.string().max(100).optional(),
  dosageForm: z.string().max(100).optional(),
  ndc: z.string().max(20).optional(),
  manufacturer: z.string().max(200).optional(),
  expirationDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().max(1000).optional(),
  verificationState: z.enum(['needs_review', 'user_confirmed', 'unable_to_match']).default('needs_review'),
  sourceIdentifiers: z.record(z.string(), z.string()).optional(),
});

export const cabinetUpdateSchema = cabinetCreateSchema.partial().extend({
  id: z.string().cuid(),
});

export type ChatApiRequest = z.infer<typeof chatApiRequestSchema>;
export type AnalyzeImageRequest = z.infer<typeof analyzeImageRequestSchema>;
export type MedicineSearchParams = z.infer<typeof medicineSearchSchema>;
export type OnboardingRequest = z.infer<typeof onboardingSchema>;
export type RegisterRequest = z.infer<typeof registerSchema>;
export type LoginRequest = z.infer<typeof loginSchema>;
export type FamilyCreateRequest = z.infer<typeof familyCreateSchema>;
export type FamilyJoinRequest = z.infer<typeof familyJoinSchema>;
export type PasswordChangeRequest = z.infer<typeof passwordChangeSchema>;
export type CabinetCreateRequest = z.infer<typeof cabinetCreateSchema>;
export type CabinetUpdateRequest = z.infer<typeof cabinetUpdateSchema>;

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errorMessages = result.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  return { success: false, error: errorMessages };
}

import { describe, it, expect } from 'vitest';
import { validateRequest, chatApiRequestSchema, analyzeImageRequestSchema, medicineSearchSchema, onboardingSchema, registerSchema, cabinetCreateSchema } from '@/lib/validation';

describe('Validation Schemas', () => {
  describe('chatApiRequestSchema', () => {
    it('should validate valid chat request', () => {
      const result = validateRequest(chatApiRequestSchema, {
        message: 'I have a headache',
        sessionId: 'clx1234567890abcdef',
        conversationHistory: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: 'Hi there' },
        ],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe('I have a headache');
      }
    });

    it('should reject empty message without image', () => {
      const result = validateRequest(chatApiRequestSchema, {
        message: '',
        conversationHistory: [],
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty message with image', () => {
      const result = validateRequest(chatApiRequestSchema, {
        message: '',
        imageBase64: 'base64imagedata',
      });
      expect(result.success).toBe(true);
    });

    it('should reject message too long', () => {
      const result = validateRequest(chatApiRequestSchema, {
        message: 'a'.repeat(5001),
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid sessionId', () => {
      const result = validateRequest(chatApiRequestSchema, {
        message: 'Hello',
        sessionId: 'invalid-id',
      });
      expect(result.success).toBe(false);
    });

    it('should reject too many history messages', () => {
      const history = Array(21).fill({ role: 'user', content: 'test' });
      const result = validateRequest(chatApiRequestSchema, {
        message: 'Hello',
        conversationHistory: history,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('analyzeImageRequestSchema', () => {
    it('should validate valid image request', () => {
      const result = validateRequest(analyzeImageRequestSchema, {
        imageBase64: 'base64data',
        mimeType: 'image/jpeg',
        context: 'Medicine bottle',
      });
      expect(result.success).toBe(true);
    });

    it('should reject missing image', () => {
      const result = validateRequest(analyzeImageRequestSchema, {
        mimeType: 'image/jpeg',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid mime type', () => {
      const result = validateRequest(analyzeImageRequestSchema, {
        imageBase64: 'data',
        mimeType: 'image/gif',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('medicineSearchSchema', () => {
    it('should validate drug search', () => {
      const result = validateRequest(medicineSearchSchema, {
        drug: 'Tylenol',
      });
      expect(result.success).toBe(true);
    });

    it('should validate symptom search', () => {
      const result = validateRequest(medicineSearchSchema, {
        symptom: 'headache',
      });
      expect(result.success).toBe(true);
    });

    it('should validate recall search', () => {
      const result = validateRequest(medicineSearchSchema, {
        recall: 'Tylenol',
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty search', () => {
      const result = validateRequest(medicineSearchSchema, {});
      expect(result.success).toBe(false);
    });
  });

  describe('onboardingSchema', () => {
    it('should validate valid onboarding data', () => {
      const result = validateRequest(onboardingSchema, {
        age: 30,
        gender: 'Male',
        bloodType: 'A+',
        heightCm: 175,
        weightKg: 70,
        heartRateBpm: 72,
        bloodPressure: '120/80',
        activityLevel: 'Moderate (3-5 days/week)',
        dietType: 'Omnivore',
        smokingStatus: 'Never smoked',
        alcoholUse: 'Occasional',
        chronicConditions: ['Hypertension'],
        currentMedications: ['Aspirin'],
        knownAllergies: ['Penicillin'],
        accountType: 'SOLO',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid age', () => {
      const result = validateRequest(onboardingSchema, {
        age: 150,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid blood pressure format', () => {
      const result = validateRequest(onboardingSchema, {
        bloodPressure: '120',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('should validate valid registration', () => {
      const result = validateRequest(registerSchema, {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = validateRequest(registerSchema, {
        email: 'invalid-email',
        password: 'password123',
      });
      expect(result.success).toBe(false);
    });

    it('should reject short password', () => {
      const result = validateRequest(registerSchema, {
        email: 'john@example.com',
        password: 'short',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('cabinetCreateSchema', () => {
    it('should validate valid cabinet item', () => {
      const result = validateRequest(cabinetCreateSchema, {
        productName: 'Tylenol 500mg',
        brandName: 'Tylenol',
        genericName: 'Acetaminophen',
        strength: '500mg',
        dosageForm: 'tablet',
        ndc: '12345-6789-01',
        manufacturer: 'Johnson & Johnson',
        expirationDate: '2026-12-31',
        notes: 'For headaches',
        verificationState: 'user_confirmed',
        sourceIdentifiers: { rxcui: '161' },
      });
      expect(result.success).toBe(true);
    });

    it('should require productName', () => {
      const result = validateRequest(cabinetCreateSchema, {
        brandName: 'Tylenol',
      });
      expect(result.success).toBe(false);
    });

    it('should default verificationState to needs_review', () => {
      const result = validateRequest(cabinetCreateSchema, {
        productName: 'Tylenol',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.verificationState).toBe('needs_review');
      }
    });

    it('should reject invalid expiration date format', () => {
      const result = validateRequest(cabinetCreateSchema, {
        productName: 'Tylenol',
        expirationDate: '31-12-2026',
      });
      expect(result.success).toBe(false);
    });
  });
});

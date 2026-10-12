import { describe, it, expect, vi } from 'vitest';
import { parseUrgencyFromResponse, extractMedicineRecommendations, buildUrgencyAssessment } from '@/lib/chat-response';
import { UrgencyLevel } from '@/types';

describe('Chat API Response Validation', () => {
  describe('parseUrgencyFromResponse', () => {
    it('should detect CRITICAL urgency', () => {
      expect(parseUrgencyFromResponse('[URGENCY: CRITICAL]', false)).toBe('CRITICAL');
      expect(parseUrgencyFromResponse('CALL 911 IMMEDIATELY', false)).toBe('CRITICAL');
    });

    it('should detect HIGH urgency', () => {
      expect(parseUrgencyFromResponse('[URGENCY: HIGH]', false)).toBe('HIGH');
    });

    it('should detect MEDIUM urgency', () => {
      expect(parseUrgencyFromResponse('[URGENCY: MEDIUM]', false)).toBe('MEDIUM');
    });

    it('should detect LOW urgency', () => {
      expect(parseUrgencyFromResponse('[URGENCY: LOW]', false)).toBe('LOW');
    });

    it('should default to LOW for unknown responses', () => {
      expect(parseUrgencyFromResponse('Some random text', false)).toBe('LOW');
    });

    it('should detect HIGH from high urgency keywords', () => {
      expect(parseUrgencyFromResponse('Some text', true)).toBe('HIGH');
    });
  });

  describe('extractMedicineRecommendations', () => {
    it('should extract Tylenol from response', () => {
      const meds = extractMedicineRecommendations('You can take Tylenol for pain');
      expect(meds.some(m => m.name === 'Tylenol')).toBe(true);
    });

    it('should extract generic name matches', () => {
      const meds = extractMedicineRecommendations('Acetaminophen is recommended');
      expect(meds.some(m => m.genericName === 'Acetaminophen')).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const meds = extractMedicineRecommendations('No medicine mentioned');
      expect(meds.length).toBe(0);
    });

    it('should not match unrelated words', () => {
      const meds = extractMedicineRecommendations('Take vitamin C daily');
      expect(meds.length).toBe(0);
    });
  });

  describe('buildUrgencyAssessment', () => {
    it('should build LOW assessment', () => {
      const assessment = buildUrgencyAssessment('LOW', 'Low risk');
      expect(assessment.level).toBe('LOW');
      expect(assessment.callEmergency).toBe(false);
      expect(assessment.goToER).toBe(false);
    });

    it('should build CRITICAL assessment with emergency flags', () => {
      const assessment = buildUrgencyAssessment('CRITICAL', 'Emergency');
      expect(assessment.level).toBe('CRITICAL');
      expect(assessment.callEmergency).toBe(true);
      expect(assessment.goToER).toBe(true);
    });
  });
});

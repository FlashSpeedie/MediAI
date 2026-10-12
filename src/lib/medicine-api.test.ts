import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchOpenFDA, searchRxNorm, getDrugInfo, searchMedicinesBySymptom, getDrugInfoWithRecalls, searchFDAEnforcement } from '@/lib/medicine-api';
import { CombinedDrugInfo, RecallSearchResult } from '@/lib/medicine-api';

describe('Medicine API', () => {
  describe('searchOpenFDA', () => {
    it('should return null on fetch failure', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      const result = await searchOpenFDA('Tylenol');
      expect(result).toBeNull();
    });

    it('should return null for non-ok response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 404,
      } as Response);
      const result = await searchOpenFDA('InvalidDrug');
      expect(result).toBeNull();
    });

    it('should return null for empty results', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);
      const result = await searchOpenFDA('UnknownDrug');
      expect(result).toBeNull();
    });
  });

  describe('searchRxNorm', () => {
    it('should return null on fetch failure', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      const result = await searchRxNorm('Tylenol');
      expect(result).toBeNull();
    });

    it('should return null for no rxcui', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ approximateGroup: { candidate: [] } }),
      } as Response);
      const result = await searchRxNorm('UnknownDrug');
      expect(result).toBeNull();
    });
  });

  describe('getDrugInfo', () => {
    it('should return null when both APIs fail', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      const result = await getDrugInfo('Tylenol');
      expect(result).toBeNull();
    });
  });

  describe('searchMedicinesBySymptom', () => {
    it('should return empty array on fetch failure', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      const result = await searchMedicinesBySymptom('headache');
      expect(result).toEqual([]);
    });

    it('should return empty array for non-ok response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);
      const result = await searchMedicinesBySymptom('headache');
      expect(result).toEqual([]);
    });
  });

  describe('searchFDAEnforcement', () => {
    it('should return error status on fetch failure', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
      const result = await searchFDAEnforcement('Tylenol');
      expect(result.queryStatus).toBe('error');
      expect(result.error).toBeDefined();
    });

    it('should return error status for non-ok response', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);
      const result = await searchFDAEnforcement('Tylenol');
      expect(result.queryStatus).toBe('error');
    });

    it('should return no_matches for empty results', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      } as Response);
      const result = await searchFDAEnforcement('UnknownDrug');
      expect(result.queryStatus).toBe('no_matches');
      expect(result.matches).toEqual([]);
    });

    it('should return success for single match', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{
            recall_number: 'R-123',
            product_description: 'Tylenol 500mg',
            reason_for_recall: 'Contamination',
            recall_initiation_date: '2024-01-01',
            classification: 'Class II',
            status: 'Ongoing',
            recalling_firm: 'Johnson & Johnson',
            product_type: 'Drug',
          }],
        }),
      } as Response);
      const result = await searchFDAEnforcement('Tylenol');
      expect(result.queryStatus).toBe('success');
      expect(result.matches.length).toBe(1);
      expect(result.matches[0].recallNumber).toBe('R-123');
    });

    it('should return ambiguous for multiple matches', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [
            { recall_number: 'R-123', product_description: 'Tylenol 500mg', reason_for_recall: 'Contamination', recall_initiation_date: '2024-01-01', classification: 'Class II', status: 'Ongoing', recalling_firm: 'Johnson & Johnson', product_type: 'Drug' },
            { recall_number: 'R-124', product_description: 'Tylenol 325mg', reason_for_recall: 'Labeling', recall_initiation_date: '2024-02-01', classification: 'Class I', status: 'Completed', recalling_firm: 'Johnson & Johnson', product_type: 'Drug' },
          ],
        }),
      } as Response);
      const result = await searchFDAEnforcement('Tylenol');
      expect(result.queryStatus).toBe('ambiguous');
      expect(result.matches.length).toBe(2);
    });
  });

  describe('getDrugInfoWithRecalls', () => {
    it('should return null drugInfo and error recalls when both fail', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));
      const result = await getDrugInfoWithRecalls('Tylenol');
      expect(result.drugInfo).toBeNull();
      expect(result.recalls.queryStatus).toBe('error');
    });
  });
});
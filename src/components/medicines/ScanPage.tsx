'use client';
import MedicineScanner from '@/components/medicines/MedicineScanner';

export default function ScanPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-navy mb-2">Scan Medicine Label</h1>
          <p className="text-gray-500">Take a photo or upload an image of a medicine label to extract information and save to your cabinet</p>
        </div>
        
        <MedicineScanner />
      </div>
    </div>
  );
}
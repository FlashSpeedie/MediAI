'use client';
import { useState, useCallback, useRef, useEffect } from 'react';
import { useOCR, OCRResult } from '@/hooks/useOCR';
import { cn } from '@/lib/utils';
import {
  Camera, Upload, Search, Check, X, AlertTriangle,
  CheckCircle, Loader2, Eye, Edit2, Save, Trash2,
  RotateCcw, Image, FileText, Pill, Shield, ExternalLink
} from 'lucide-react';

interface ScannedMedicine {
  productName: string;
  brandName: string;
  genericName: string;
  strength: string;
  dosageForm: string;
  ndc: string;
  manufacturer: string;
  confidence: number;
}

export interface MedicineScanResult {
  originalImage: string;
  extractedText: string;
  correctedText: string;
  parsedMedicine: ScannedMedicine | null;
  drugInfo: {
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
  } | null;
  recalls: {
    matches: Array<{
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
    }>;
    searchTerm: string;
    searchedAt: string;
    queryStatus: 'success' | 'no_matches' | 'ambiguous' | 'error';
    error?: string;
  } | null;
  step: 'capture' | 'review' | 'verify' | 'saved';
  saving: boolean;
}

export function useMedicineScanner() {
  const ocr = useOCR();
  const [scanState, setScanState] = useState<MedicineScanResult>({
    originalImage: '',
    extractedText: '',
    correctedText: '',
    parsedMedicine: null,
    drugInfo: null,
    recalls: null,
    step: 'capture',
    saving: false,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetScan = useCallback(() => {
    setScanState({
      originalImage: '',
      extractedText: '',
      correctedText: '',
      parsedMedicine: null,
      drugInfo: null,
      recalls: null,
      step: 'capture',
      saving: false,
    });
    ocr.reset();
  }, [ocr]);

  const handleImageSelect = useCallback(async (file: File) => {
    // Validate file
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setScanState(prev => ({ ...prev, step: 'capture' }));
      alert('Please select a valid image file (JPEG, PNG, or WebP)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be less than 10MB');
      return;
    }

    // Create object URL for preview
    const imageUrl = URL.createObjectURL(file);
    
    setScanState(prev => ({
      ...prev,
      originalImage: imageUrl,
      extractedText: '',
      correctedText: '',
      parsedMedicine: null,
      drugInfo: null,
      recalls: null,
      step: 'review',
    }));

    // Run OCR
    try {
      const result = await ocr.recognize(file);
      if (result) {
        const fullText = result.text.trim();
        const parsed = parseMedicineText(fullText);
        
        setScanState(prev => ({
          ...prev,
          extractedText: fullText,
          correctedText: fullText,
          parsedMedicine: parsed,
        }));

        // Auto-fetch drug info if we have a product name
        if (parsed?.productName) {
          fetchDrugInfo(parsed.productName);
        }
      }
    } catch (err) {
      console.error('OCR failed:', err);
      setScanState(prev => ({ ...prev, step: 'review' }));
    }
  }, [ocr]);

  const fetchDrugInfo = async (productName: string) => {
    try {
      const res = await fetch(`/api/medicines?drug=${encodeURIComponent(productName)}`);
      if (res.ok) {
        const data = await res.json();
        setScanState(prev => ({ ...prev, drugInfo: data.medicine }));
      }
    } catch {
      // Silently fail - user can manually search
    }
  };

  const fetchRecalls = async (productName: string) => {
    try {
      const res = await fetch(`/api/medicines?recall=${encodeURIComponent(productName)}`);
      if (res.ok) {
        const data = await res.json();
        setScanState(prev => ({ ...prev, recalls: data.recalls }));
      }
    } catch {
      // Silently fail
    }
  };

  const handleTextChange = useCallback((text: string) => {
    setScanState(prev => ({ ...prev, correctedText: text }));
  }, []);

  const handleReparse = useCallback(() => {
    const parsed = parseMedicineText(scanState.correctedText);
    setScanState(prev => ({ ...prev, parsedMedicine: parsed }));
    
    if (parsed?.productName) {
      fetchDrugInfo(parsed.productName);
      fetchRecalls(parsed.productName);
    }
  }, [scanState.correctedText]);

  const handleSave = useCallback(async () => {
    if (!scanState.parsedMedicine) return;
    
    setScanState(prev => ({ ...prev, saving: true, step: 'saved' }));
    
    try {
      const res = await fetch('/api/cabinet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...scanState.parsedMedicine,
          expirationDate: null,
          notes: `Scanned on ${new Date().toLocaleDateString()}. OCR confidence: ${Math.round((ocr.result?.confidence || 0) * 100)}%`,
          verificationState: 'NEEDS_REVIEW',
        }),
      });
      
      if (!res.ok) throw new Error('Failed to save');
      
      setScanState(prev => ({ ...prev, saving: false, step: 'saved' }));
      
      // Reset after short delay
      setTimeout(() => {
        resetScan();
      }, 2000);
    } catch (err) {
      setScanState(prev => ({ ...prev, saving: false, step: 'verify' }));
      alert('Failed to save medicine. Please try again.');
    }
  }, [scanState.parsedMedicine, ocr.result?.confidence, resetScan]);

  return {
    scanState,
    setScanState,
    ocr,
    handleImageSelect,
    handleTextChange,
    handleReparse,
    handleSave,
    resetScan,
    fetchDrugInfo,
    fetchRecalls,
    fileInputRef,
  };
}

function parseMedicineText(text: string): ScannedMedicine | null {
  if (!text || text.trim().length < 3) return null;
  
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const fullText = lines.join(' ');
  
  // Common medicine name patterns
  const medicineNames = [
    'tylenol', 'advil', 'motrin', 'aleve', 'aspirin', 'claritin', 'zyrtec', 'benadryl',
    'dayquil', 'nyquil', 'mucinex', 'sudafed', 'robitussin', 'pepto-bismol', 'imodium',
    'tums', 'famotidine', 'hydrocortisone', 'neosporin', 'ibuprofen', 'acetaminophen',
    'naproxen', 'loratadine', 'cetirizine', 'diphenhydramine', 'guaifenesin',
    'pseudoephedrine', 'dextromethorphan', 'bismuth subsalicylate', 'loperamide',
    'calcium carbonate', 'omeprazole', 'esomeprazole', 'ranitidine'
  ];
  
  let foundName = '';
  let foundBrand = '';
  const foundGeneric = '';
  
  for (const name of medicineNames) {
    const regex = new RegExp(`\\b${name.replace(/-/g, '\\-?')}\\b`, 'i');
    if (regex.test(fullText)) {
      foundName = name.charAt(0).toUpperCase() + name.slice(1);
      // Check if it's a brand name (capitalized in text)
      const brandRegex = new RegExp(`\\b${name.charAt(0).toUpperCase() + name.slice(1)}\\b`, 'i');
      if (brandRegex.test(fullText)) {
        foundBrand = name.charAt(0).toUpperCase() + name.slice(1);
      }
      break;
    }
  }
  
  // Extract strength (e.g., 500mg, 10mg, 200mg)
  const strengthMatch = fullText.match(/\b(\d+(?:\.\d+)?)\s*(mg|g|ml|mcg|IU)\b/i);
  const strength = strengthMatch ? `${strengthMatch[1]}${strengthMatch[2].toLowerCase()}` : '';
  
  // Extract NDC (11-digit or formatted)
  const ndcMatch = fullText.match(/\b\d{4,5}-\d{3,4}-\d{1,2}\b/);
  const ndc = ndcMatch ? ndcMatch[0] : '';
  
  // Extract dosage form
  const formKeywords = ['tablet', 'capsule', 'caplet', 'softgel', 'liquid', 'syrup', 'suspension', 'cream', 'ointment', 'gel', 'spray', 'inhaler', 'patch'];
  let dosageForm = '';
  for (const form of formKeywords) {
    if (new RegExp(`\\b${form}\\b`, 'i').test(fullText)) {
      dosageForm = form.charAt(0).toUpperCase() + form.slice(1);
      break;
    }
  }
  
  // If no medicine name found, use first meaningful line
  if (!foundName && lines.length > 0) {
    foundName = lines[0].substring(0, 50);
  }
  
  return {
    productName: foundName || 'Unknown Medicine',
    brandName: foundBrand || foundName,
    genericName: foundGeneric || '',
    strength,
    dosageForm,
    ndc,
    manufacturer: '',
    confidence: 0.5, // Will be updated with actual OCR confidence
  };
}

export function MedicineScanner() {
  const {
    scanState,
    setScanState,
    ocr,
    handleImageSelect,
    handleTextChange,
    handleReparse,
    handleSave,
    resetScan,
    fileInputRef,
  } = useMedicineScanner();

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file) handleImageSelect(file);
  };

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (scanState.originalImage) {
        URL.revokeObjectURL(scanState.originalImage);
      }
    };
  }, [scanState.originalImage]);

  if (scanState.step === 'saved') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-floating max-w-md w-full animate-slide-in p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="font-display text-xl font-bold text-navy mb-2">Medicine Saved!</h2>
          <p className="text-gray-500 mb-6">{scanState.parsedMedicine?.productName} has been added to your cabinet.</p>
          <button
            onClick={resetScan}
            className="px-6 py-2.5 bg-teal text-white rounded-xl font-medium hover:bg-teal-dark transition"
          >
            Scan Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step indicator */}
      <div className="flex items-center justify-between mb-6">
        {['capture', 'review', 'verify'].map((step, i) => (
          <div key={step} className="flex items-center">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
              scanState.step === step || (step === 'capture' && scanState.step !== 'capture') || 
              (step === 'review' && (scanState.step === 'verify' || scanState.step === 'saved'))
                ? 'bg-teal text-white'
                : 'bg-gray-200 text-gray-500'
            )}>
              {i + 1}
            </div>
            <span className={cn(
              'ml-2 text-sm font-medium',
              scanState.step === step ? 'text-teal' : 'text-gray-400'
            )}>
              {step.charAt(0).toUpperCase() + step.slice(1)}
            </span>
            {i < 2 && <div className={cn(
              'w-16 h-0.5 ml-2',
              (scanState.step === 'review' || scanState.step === 'verify' || scanState.step === 'saved') && i === 0
                ? 'bg-teal'
                : (scanState.step === 'verify' || scanState.step === 'saved') && i === 1
                ? 'bg-teal'
                : 'bg-gray-200'
            )} />}
          </div>
        ))}
      </div>

      {/* Capture Step */}
      {scanState.step === 'capture' && (
        <div className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-teal-400 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files?.[0] && handleImageSelect(e.target.files[0])}
            className="hidden"
          />
          <div className="space-y-4">
            <Camera className="w-16 h-16 text-gray-300 mx-auto" />
            <div>
              <h3 className="font-semibold text-gray-700 text-lg">Add Medicine Label Photo</h3>
              <p className="text-gray-500 mt-1">Drag & drop or click to upload a medicine label image</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={triggerFileInput}
                className="px-6 py-3 bg-teal text-white rounded-xl font-medium hover:bg-teal-dark transition flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Choose File
              </button>
              <button
                onClick={() => { /* Camera capture would go here */ }}
                className="px-6 py-3 border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-teal-400 hover:text-teal transition flex items-center gap-2"
              >
                <Camera className="w-4 h-4" />
                Use Camera
              </button>
            </div>
            <p className="text-xs text-gray-400">JPEG, PNG, WebP · Max 10MB</p>
          </div>
        </div>
      )}

      {/* Review Step */}
      {scanState.step === 'review' && (
        <div className="space-y-6">
          {/* Image & OCR Text */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Source Image */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Image className="w-4 h-4" /> Source Image
              </h4>
              <div className="aspect-[4/3] bg-white rounded-lg overflow-hidden border relative">
                {scanState.originalImage && (
                  <img
                    src={scanState.originalImage}
                    alt="Medicine label"
                    className="w-full h-full object-cover"
                  />
                )}
                {ocr.isLoading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 text-white">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p>{ocr.status}</p>
                    <div className="w-full max-w-xs h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal rounded-full transition-all duration-300"
                        style={{ width: `${ocr.progress}%` }}
                      />
                    </div>
                    <p className="text-sm">{ocr.progress}%</p>
                  </div>
                )}
              </div>
            </div>

            {/* Extracted Text (Editable) */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                  <FileText className="w-4 h-4" /> Extracted Text
                </h4>
                <span className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium',
                  ocr.result ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
                )}>
                  {ocr.result ? `Confidence: ${Math.round(ocr.result.confidence * 100)}%` : 'No text detected'}
                </span>
              </div>
              <textarea
                value={scanState.correctedText}
                onChange={(e) => handleTextChange(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-none"
                placeholder="OCR text will appear here. Edit any mistakes before continuing."
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleReparse}
                  disabled={!scanState.correctedText.trim()}
                  className="px-4 py-2 bg-teal text-white rounded-lg font-medium hover:bg-teal-dark transition disabled:opacity-50 flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Re-parse Medicine
                </button>
                <button
                  onClick={() => setScanState(prev => ({ ...prev, step: 'capture' }))}
                  className="px-4 py-2 border border-gray-200 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  <X className="w-4 h-4 mr-1" />
                  Retake
                </button>
              </div>
            </div>
          </div>

          {/* Parsed Medicine Preview */}
          {scanState.parsedMedicine && (
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-5">
              <h4 className="font-semibold text-teal-800 mb-3 flex items-center gap-2">
                <Pill className="w-4 h-4" /> Parsed Medicine Information
              </h4>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-teal-600">Product:</span>
                  <span className="font-medium text-gray-800 ml-2">{scanState.parsedMedicine.productName}</span>
                </div>
                <div>
                  <span className="text-teal-600">Brand:</span>
                  <span className="font-medium text-gray-800 ml-2">{scanState.parsedMedicine.brandName || '-'}</span>
                </div>
                <div>
                  <span className="text-teal-600">Generic:</span>
                  <span className="font-medium text-gray-800 ml-2">{scanState.parsedMedicine.genericName || '-'}</span>
                </div>
                <div>
                  <span className="text-teal-600">Strength:</span>
                  <span className="font-medium text-gray-800 ml-2">{scanState.parsedMedicine.strength || '-'}</span>
                </div>
                <div>
                  <span className="text-teal-600">Form:</span>
                  <span className="font-medium text-gray-800 ml-2">{scanState.parsedMedicine.dosageForm || '-'}</span>
                </div>
                <div>
                  <span className="text-teal-600">NDC:</span>
                  <span className="font-medium text-gray-800 ml-2 font-mono">{scanState.parsedMedicine.ndc || '-'}</span>
                </div>
              </div>
              <p className="text-xs text-teal-600 mt-3">Review and correct any errors above, then continue to verify with official sources.</p>
            </div>
          )}

          {/* Continue Button */}
          <button
            onClick={() => setScanState(prev => ({ ...prev, step: 'verify' }))}
            disabled={!scanState.parsedMedicine}
            className="w-full px-6 py-3 bg-teal text-white rounded-xl font-semibold hover:bg-teal-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Continue to Verify with Official Sources
          </button>
        </div>
      )}

      {/* Verify Step */}
      {scanState.step === 'verify' && (
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
            <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5" /> Verify with Official Sources
            </h3>
            <p className="text-blue-700 text-sm">
              Cross-reference the parsed medicine with FDA and NIH databases. Review any recalls.
            </p>
          </div>

          {/* Drug Info */}
          {scanState.drugInfo ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal" /> Official Drug Information
              </h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {scanState.drugInfo.fdaSource && (
                    <span className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-200">FDA</span>
                  )}
                  {scanState.drugInfo.rxNormSource && (
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs border border-purple-200">NIH RxNorm</span>
                  )}
                </div>
                {scanState.drugInfo.purpose && (
                  <div><dt className="text-sm font-medium text-gray-500">Purpose</dt><dd className="text-sm text-gray-700">{scanState.drugInfo.purpose}</dd></div>
                )}
                {scanState.drugInfo.dosageSummary && (
                  <div><dt className="text-sm font-medium text-gray-500">Dosage</dt><dd className="text-sm text-gray-700">{scanState.drugInfo.dosageSummary}</dd></div>
                )}
                {scanState.drugInfo.warnings.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Warnings</dt>
                    <ul className="space-y-1 mt-1">
                      {scanState.drugInfo.warnings.map((w: string, i: number) => (
                        <li key={i} className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1">{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
                <a href="https://www.fda.gov/drugs" target="_blank" rel="noopener noreferrer" className="text-sm text-teal hover:underline flex items-center gap-1 mt-2">
                  View on FDA.gov <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ) : (
            <button
              onClick={() => fetch(`/api/medicines?drug=${encodeURIComponent(scanState.parsedMedicine?.productName || '')}`).then(async r => { if (r.ok) { const d = await r.json(); setScanState(prev => ({ ...prev, drugInfo: d.medicine })); } })}
              className="w-full px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-teal-400 hover:text-teal transition flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Search FDA/NIH for "{scanState.parsedMedicine?.productName}"
            </button>
          )}

          {/* Recall Info */}
          {scanState.recalls ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber" /> Recall Check
              </h4>
              {scanState.recalls.queryStatus === 'success' && scanState.recalls.matches.length > 0 ? (
                <div className="space-y-2">
                  {scanState.recalls.matches.slice(0, 2).map((recall: { productDescription: string; reasonForRecall: string; sourceUrl: string }, i: number) => (
                    <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-medium text-red-800 text-sm">{recall.productDescription}</p>
                      <p className="text-xs text-red-700 mt-1">{recall.reasonForRecall}</p>
                      <a href={recall.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-red-700 hover:underline flex items-center gap-1 mt-1">
                        View Recall <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    </div>
                  ))}
                </div>
              ) : scanState.recalls.queryStatus === 'no_matches' ? (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> No matching recalls found
                  </p>
                </div>
              ) : scanState.recalls.queryStatus === 'ambiguous' ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> {scanState.recalls.matches.length} possible matches - review manually
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => fetch(`/api/medicines?recall=${encodeURIComponent(scanState.parsedMedicine?.productName || '')}`).then(async r => { if (r.ok) { const d = await r.json(); setScanState(prev => ({ ...prev, recalls: d.recalls })); } })}
                  className="w-full px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-amber-400 hover:text-amber transition flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-4 h-4" />
                  Check FDA Recalls
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={() => fetch(`/api/medicines?recall=${encodeURIComponent(scanState.parsedMedicine?.productName || '')}`).then(async r => { if (r.ok) { const d = await r.json(); setScanState(prev => ({ ...prev, recalls: d.recalls })); } })}
              className="w-full px-6 py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-amber-400 hover:text-amber transition flex items-center justify-center gap-2"
            >
              <AlertTriangle className="w-4 h-4" />
              Check FDA Recalls for "{scanState.parsedMedicine?.productName}"
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={scanState.saving}
            className="w-full px-6 py-3 bg-teal text-white rounded-xl font-semibold hover:bg-teal-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {scanState.saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {scanState.saving ? 'Saving to Cabinet...' : 'Save to Medicine Cabinet'}
          </button>

          <button
            onClick={resetScan}
            className="w-full px-6 py-2 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition mt-3"
          >
            Start Over
          </button>
        </div>
      )}
    </div>
  );
}

export default MedicineScanner;

// src/components/medicines/MedicinePanel.tsx
'use client';
import { useState, useEffect } from 'react';
import { CombinedDrugInfo } from '@/lib/medicine-api';
import { Search, Pill, AlertTriangle, Info, ChevronDown, ChevronUp, Loader2, ExternalLink } from 'lucide-react';

export default function MedicinePanel() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'drug' | 'symptom'>('symptom');
  const [results, setResults] = useState<CombinedDrugInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [prefetched, setPrefetched] = useState<CombinedDrugInfo[]>([]);

  // Pre-fetch common medicines on mount
  useEffect(() => {
    fetch('/api/medicines?prefetch=true')
      .then((r) => r.json())
      .then((d) => setPrefetched(d.medicines ?? []))
      .catch(() => {});
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResults([]);
    try {
      const param = mode === 'drug' ? `drug=${encodeURIComponent(query)}` : `symptom=${encodeURIComponent(query)}`;
      const res = await fetch(`/api/medicines?${param}`);
      const data = await res.json();
      setResults(
        mode === 'drug'
          ? data.medicine ? [data.medicine] : []
          : data.medicines ?? []
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const displayList = results.length > 0 ? results : prefetched;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Pill className="w-4 h-4 text-brand-600" />
        <h2 className="font-semibold text-gray-800 text-sm">Medicine Lookup</h2>
        <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          FDA + NIH
        </span>
      </div>

      {/* Search */}
      <div className="p-3 border-b border-gray-100">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => setMode('symptom')}
            className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition ${
              mode === 'symptom'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            By Symptom
          </button>
          <button
            onClick={() => setMode('drug')}
            className={`flex-1 py-1.5 text-xs rounded-lg font-medium transition ${
              mode === 'drug'
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            By Drug Name
          </button>
        </div>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={mode === 'symptom' ? 'e.g. headache, fever...' : 'e.g. Tylenol, ibuprofen...'}
            className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="overflow-y-auto max-h-96 divide-y divide-gray-50">
        {displayList.length === 0 && !loading && (
          <div className="py-8 text-center text-gray-400 text-xs">
            <Pill className="w-6 h-6 mx-auto mb-2 opacity-30" />
            Search for a symptom or medicine name
          </div>
        )}

        {displayList.map((med, i) => {
          const key = med.brandName + i;
          const isOpen = expanded === key;

          return (
            <div key={key} className="p-3">
              {/* Medicine header row */}
              <button
                onClick={() => setExpanded(isOpen ? null : key)}
                className="w-full flex items-start justify-between gap-2 text-left"
              >
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{med.brandName}</p>
                  {med.genericName && (
                    <p className="text-xs text-gray-400">{med.genericName}</p>
                  )}
                  {med.drugClass && (
                    <span className="inline-block mt-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">
                      {med.drugClass}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {med.fdaSource && (
                    <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded-full">FDA</span>
                  )}
                  {med.rxNormSource && (
                    <span className="text-xs bg-purple-50 text-purple-700 border border-purple-200 px-1.5 py-0.5 rounded-full">NIH</span>
                  )}
                  {isOpen ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
                </div>
              </button>

              {/* Expanded details */}
              {isOpen && (
                <div className="mt-3 space-y-2.5 text-xs animate-fade-in">
                  {/* Purpose */}
                  {med.purpose && (
                    <div>
                      <p className="font-semibold text-gray-600 mb-1 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Purpose
                      </p>
                      <p className="text-gray-600">{med.purpose}</p>
                    </div>
                  )}

                  {/* Dosage */}
                  {med.dosageSummary && (
                    <div>
                      <p className="font-semibold text-gray-600 mb-1">💊 Dosage</p>
                      <p className="text-gray-600">{med.dosageSummary}</p>
                    </div>
                  )}

                  {/* Warnings */}
                  {med.warnings.length > 0 && (
                    <div>
                      <p className="font-semibold text-amber-700 mb-1 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Warnings
                      </p>
                      <ul className="space-y-1">
                        {med.warnings.map((w, j) => (
                          <li key={j} className="text-amber-700 bg-amber-50 rounded px-2 py-1">{w}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Do Not Use */}
                  {med.doNotUse.length > 0 && (
                    <div>
                      <p className="font-semibold text-red-600 mb-1">🚫 Do Not Use If</p>
                      <ul className="space-y-1">
                        {med.doNotUse.map((d, j) => (
                          <li key={j} className="text-red-600 bg-red-50 rounded px-2 py-1">{d}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Ask Doctor */}
                  {med.askDoctorBefore.length > 0 && (
                    <div>
                      <p className="font-semibold text-blue-700 mb-1">🩺 Ask Doctor Before Use</p>
                      <ul className="space-y-1">
                        {med.askDoctorBefore.map((a, j) => (
                          <li key={j} className="text-blue-700 bg-blue-50 rounded px-2 py-1">{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Side Effects */}
                  {med.sideEffects.length > 0 && (
                    <div>
                      <p className="font-semibold text-gray-600 mb-1">⚠️ Possible Side Effects</p>
                      <ul className="space-y-1">
                        {med.sideEffects.map((s, j) => (
                          <li key={j} className="text-gray-600 bg-gray-50 rounded px-2 py-1">{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Source badges */}
                  <div className="pt-1 flex items-center gap-2 text-gray-400">
                    <span>Sources:</span>
                    {med.fdaSource && (
                      <a
                        href={`https://www.fda.gov/drugs`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-green-600 hover:underline"
                      >
                        FDA.gov <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                    {med.rxNormSource && (
                      <a
                        href={`https://rxnav.nlm.nih.gov`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-0.5 text-purple-600 hover:underline"
                      >
                        NIH RxNorm <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pill, Plus, Search, Edit, Trash2, AlertTriangle, CheckCircle,
  X, Loader2, Eye, Shield, Clock, Package, Calendar,
  ChevronDown, ChevronUp, ExternalLink, Download, HelpCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CabinetItem {
  id: string;
  productName: string;
  brandName: string | null;
  genericName: string | null;
  strength: string | null;
  dosageForm: string | null;
  ndc: string | null;
  manufacturer: string | null;
  expirationDate: string | null;
  notes: string | null;
  verificationState: 'NEEDS_REVIEW' | 'USER_CONFIRMED' | 'UNABLE_TO_MATCH';
  sourceIdentifiers: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

interface DrugInfo {
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

interface RecallResult {
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

interface RecallSearchResult {
  matches: RecallResult[];
  searchTerm: string;
  searchedAt: string;
  queryStatus: 'success' | 'no_matches' | 'ambiguous' | 'error';
  error?: string;
}

export default function CabinetPage({ userId }: { userId: string }) {
  const router = useRouter();
  const [items, setItems] = useState<CabinetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [drugInfo, setDrugInfo] = useState<Record<string, DrugInfo | null>>({});
  const [recallInfo, setRecallInfo] = useState<Record<string, RecallSearchResult | null>>({});
  const [fetchingDetails, setFetchingDetails] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  // Form state for adding
  const [formData, setFormData] = useState({
    productName: '',
    brandName: '',
    genericName: '',
    strength: '',
    dosageForm: '',
    ndc: '',
    manufacturer: '',
    expirationDate: '',
    notes: '',
    verificationState: 'NEEDS_REVIEW' as 'NEEDS_REVIEW' | 'USER_CONFIRMED' | 'UNABLE_TO_MATCH',
  });

  const fetchCabinet = useCallback(async () => {
    try {
      const res = await fetch('/api/cabinet');
      if (!res.ok) throw new Error('Failed to fetch cabinet');
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (err) {
      console.error('Failed to fetch cabinet:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCabinet();
  }, [fetchCabinet]);

  const fetchDrugInfo = async (item: CabinetItem) => {
    if (drugInfo[item.id] || fetchingDetails === item.id) return;
    setFetchingDetails(item.id);
    try {
      const searchTerm = item.brandName || item.genericName || item.productName;
      const res = await fetch(`/api/medicines?drug=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setDrugInfo(prev => ({ ...prev, [item.id]: data.medicine }));
      } else {
        setDrugInfo(prev => ({ ...prev, [item.id]: null }));
      }
    } catch {
      setDrugInfo(prev => ({ ...prev, [item.id]: null }));
    } finally {
      setFetchingDetails(null);
    }
  };

  const fetchRecalls = async (item: CabinetItem) => {
    if (recallInfo[item.id] || fetchingDetails === item.id) return;
    setFetchingDetails(item.id);
    try {
      const searchTerm = item.brandName || item.genericName || item.productName;
      const res = await fetch(`/api/medicines?recall=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setRecallInfo(prev => ({ ...prev, [item.id]: data.recalls }));
      } else {
        setRecallInfo(prev => ({ ...prev, [item.id]: null }));
      }
    } catch {
      setRecallInfo(prev => ({ ...prev, [item.id]: null }));
    } finally {
      setFetchingDetails(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this medicine from your cabinet?')) return;
    setDeleting(id);
    try {
      const res = await fetch(`/api/cabinet/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setItems(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to remove medicine. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError('');
    setAdding(true);
    try {
      const res = await fetch('/api/cabinet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expirationDate: formData.expirationDate || null,
          verificationState: formData.verificationState,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to add medicine');
      }
      const data = await res.json();
      setItems(prev => [data.item, ...prev]);
      setShowAddModal(false);
      setFormData({
        productName: '',
        brandName: '',
        genericName: '',
        strength: '',
        dosageForm: '',
        ndc: '',
        manufacturer: '',
        expirationDate: '',
        notes: '',
        verificationState: 'NEEDS_REVIEW',
      });
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Failed to add medicine');
    } finally {
      setAdding(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.brandName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.genericName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getVerificationBadge = (state: string) => {
    switch (state) {
      case 'USER_CONFIRMED':
        return { label: 'Verified', className: 'bg-green-50 text-green-700 border-green-200', icon: <CheckCircle className="w-3 h-3" /> };
      case 'NEEDS_REVIEW':
        return { label: 'Needs Review', className: 'bg-amber-50 text-amber-700 border-amber-200', icon: <AlertTriangle className="w-3 h-3" /> };
      case 'UNABLE_TO_MATCH':
        return { label: 'No Match', className: 'bg-gray-50 text-gray-700 border-gray-200', icon: <X className="w-3 h-3" /> };
      default:
        return { label: state, className: 'bg-gray-50 text-gray-700 border-gray-200', icon: <Shield className="w-3 h-3" /> };
    }
  };

  const getExpirationStatus = (dateStr: string | null) => {
    if (!dateStr) return { label: 'Unknown', className: 'text-gray-500', icon: <HelpCircle className="w-3 h-3" /> };
    const exp = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: `Expired ${Math.abs(diffDays)} days ago`, className: 'text-red-600', icon: <AlertTriangle className="w-3 h-3" /> };
    if (diffDays <= 30) return { label: `Expires in ${diffDays} days`, className: 'text-amber-600', icon: <Clock className="w-3 h-3" /> };
    return { label: `Expires ${exp.toLocaleDateString()}`, className: 'text-green-600', icon: <Calendar className="w-3 h-3" /> };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-teal" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-navy">Medicine Cabinet</h1>
          <p className="text-gray-500 text-sm mt-1">Your saved medications with official drug information</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal text-white rounded-xl font-medium hover:bg-teal-dark transition shadow-glow-teal"
        >
          <Plus className="w-4 h-4" />
          Add Medicine
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search your cabinet..."
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
          />
        </div>
      </div>

      {/* Cabinet Items */}
      {filteredItems.length === 0 ? (
        <div className="text-center py-16">
          <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="font-semibold text-gray-700 mb-2">Cabinet is empty</h3>
          <p className="text-gray-500 mb-6">Add your first medicine to get started</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-5 py-2.5 bg-teal text-white rounded-xl font-medium hover:bg-teal-dark transition"
          >
            Add Medicine
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredItems.map(item => {
            const badge = getVerificationBadge(item.verificationState);
            const expStatus = getExpirationStatus(item.expirationDate);
            const isExpanded = expandedItem === item.id;
            const info = drugInfo[item.id];
            const recalls = recallInfo[item.id];

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
              >
                {/* Main card */}
                <button
                  onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                  className="w-full p-5 flex items-start justify-between gap-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
                          <Pill className="w-6 h-6 text-teal" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">{item.productName}</h3>
                          {(item.brandName || item.genericName) && (
                            <p className="text-sm text-gray-500 truncate">
                              {item.brandName} {item.genericName && `(${item.genericName})`}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border',
                          badge.className
                        )}>
                          {badge.icon}
                          {badge.label}
                        </span>
                        <span className={cn('flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium', expStatus.className)}>
                          {expStatus.icon}
                          {expStatus.label}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                      {item.strength && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
                          <Package className="w-3 h-3" /> {item.strength}
                        </span>
                      )}
                      {item.dosageForm && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg">
                          <Package className="w-3 h-3" /> {item.dosageForm}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                      disabled={deleting === item.id}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                      aria-label="Delete medicine"
                    >
                      {deleting === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50 p-5 animate-fade-in">
                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Basic Info */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <Package className="w-4 h-4 text-teal" /> Product Details
                        </h4>
                        <dl className="space-y-2 text-sm">
                          {item.brandName && (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Brand</dt>
                              <dd className="font-medium text-gray-800">{item.brandName}</dd>
                            </div>
                          )}
                          {item.genericName && (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Generic</dt>
                              <dd className="font-medium text-gray-800">{item.genericName}</dd>
                            </div>
                          )}
                          {item.strength && (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Strength</dt>
                              <dd className="font-medium text-gray-800">{item.strength}</dd>
                            </div>
                          )}
                          {item.dosageForm && (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Form</dt>
                              <dd className="font-medium text-gray-800">{item.dosageForm}</dd>
                            </div>
                          )}
                          {item.ndc && (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">NDC</dt>
                              <dd className="font-medium text-gray-800 font-mono">{item.ndc}</dd>
                            </div>
                          )}
                          {item.manufacturer && (
                            <div className="flex justify-between">
                              <dt className="text-gray-500">Manufacturer</dt>
                              <dd className="font-medium text-gray-800">{item.manufacturer}</dd>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <dt className="text-gray-500">Added</dt>
                            <dd className="font-medium text-gray-800">{new Date(item.createdAt).toLocaleDateString()}</dd>
                          </div>
                        </dl>
                      </div>

                      {/* Notes & Expiration */}
                      <div className="space-y-3">
                        <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-teal" /> Expiration & Notes
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 p-3 bg-white rounded-lg border">
                            {expStatus.icon}
                            <span className={expStatus.className}>{expStatus.label}</span>
                          </div>
                          {item.notes && (
                            <div className="p-3 bg-white rounded-lg border">
                              <p className="text-sm text-gray-600">{item.notes}</p>
                            </div>
                          )}
                          {!item.notes && (
                            <p className="text-sm text-gray-400 italic">No notes added</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Official Drug Info */}
                    {(fetchingDetails === item.id || info || recalls) && (
                      <div className="md:col-span-2 border-t border-gray-200 pt-4">
                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-teal" /> Official Drug Information
                        </h4>
                        {fetchingDetails === item.id ? (
                          <div className="flex items-center gap-2 text-gray-500">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading drug information...
                          </div>
                        ) : (
                          <>
                            {info ? (
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 flex-wrap">
                                  {info.fdaSource && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 rounded-full text-xs border border-green-200">
                                      <Shield className="w-3 h-3" /> FDA
                                    </span>
                                  )}
                                  {info.rxNormSource && (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs border border-purple-200">
                                      <Shield className="w-3 h-3" /> NIH RxNorm
                                    </span>
                                  )}
                                </div>
                                {info.purpose && (
                                  <div>
                                    <dt className="text-sm font-medium text-gray-500 mb-1">Purpose</dt>
                                    <dd className="text-sm text-gray-700">{info.purpose}</dd>
                                  </div>
                                )}
                                {info.dosageSummary && (
                                  <div>
                                    <dt className="text-sm font-medium text-gray-500 mb-1">Dosage</dt>
                                    <dd className="text-sm text-gray-700">{info.dosageSummary}</dd>
                                  </div>
                                )}
                                {info.warnings.length > 0 && (
                                  <div>
                                    <dt className="text-sm font-medium text-amber-700 mb-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3 h-3" /> Warnings
                                    </dt>
                                    <ul className="space-y-1">
                                      {info.warnings.map((w, i) => (
                                        <li key={i} className="text-sm text-amber-700 bg-amber-50 rounded px-2 py-1">{w}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {info.doNotUse.length > 0 && (
                                  <div>
                                    <dt className="text-sm font-medium text-red-700 mb-1">🚫 Do Not Use If</dt>
                                    <ul className="space-y-1">
                                      {info.doNotUse.map((d, i) => (
                                        <li key={i} className="text-sm text-red-700 bg-red-50 rounded px-2 py-1">{d}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {info.askDoctorBefore.length > 0 && (
                                  <div>
                                    <dt className="text-sm font-medium text-blue-700 mb-1">🩺 Ask Doctor Before Use</dt>
                                    <ul className="space-y-1">
                                      {info.askDoctorBefore.map((a, i) => (
                                        <li key={i} className="text-sm text-blue-700 bg-blue-50 rounded px-2 py-1">{a}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-xs text-gray-400">
                                  <span>Source: {info.fdaSource ? 'FDA' : ''} {info.fdaSource && info.rxNormSource ? '+' : ''} {info.rxNormSource ? 'NIH RxNorm' : ''}</span>
                                  <a
                                    href={`https://www.fda.gov/drugs`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-teal hover:underline"
                                  >
                                    FDA.gov <ExternalLink className="w-3 h-3" />
                                  </a>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">No official drug information found for this product.</p>
                            )}
                            {recalls && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h5 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4 text-amber" /> Recall Information
                                </h5>
                                {recalls.queryStatus === 'success' && recalls.matches.length > 0 ? (
                                  <div className="space-y-2">
                                    {recalls.matches.slice(0, 3).map((recall, i) => (
                                      <div key={i} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="font-medium text-red-800 text-sm">{recall.productDescription}</p>
                                        <p className="text-xs text-red-700 mt-1">{recall.reasonForRecall}</p>
                                        <div className="flex items-center gap-2 text-xs text-red-600 mt-1">
                                          <span className="px-1.5 py-0.5 bg-red-100 rounded">{recall.classification}</span>
                                          <span>{recall.status}</span>
                                          <span>{recall.recallDate}</span>
                                        </div>
                                        <a
                                          href={recall.sourceUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs text-red-700 hover:underline flex items-center gap-1 mt-1"
                                        >
                                          View FDA Recall <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                      </div>
                                    ))}
                                    {recalls.matches.length > 3 && (
                                      <p className="text-xs text-gray-500">+{recalls.matches.length - 3} more recalls</p>
                                    )}
                                  </div>
                                ) : recalls.queryStatus === 'no_matches' ? (
                                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                    <p className="text-sm text-green-800 flex items-center gap-1">
                                      <CheckCircle className="w-4 h-4" />
                                      No matching recalls found in FDA database
                                    </p>
                                    <p className="text-xs text-green-700 mt-1">Retrieved {new Date(recalls.searchedAt).toLocaleDateString()}</p>
                                  </div>
                                ) : recalls.queryStatus === 'ambiguous' ? (
                                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <p className="text-sm text-amber-800 flex items-center gap-1">
                                      <AlertTriangle className="w-4 h-4" />
                                      {recalls.matches.length} possible recall matches - review manually
                                    </p>
                                    <p className="text-xs text-amber-700 mt-1">Multiple products matched; verify by NDC or exact product name</p>
                                  </div>
                                ) : recalls.queryStatus === 'error' ? (
                                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-800 flex items-center gap-1">
                                      <AlertTriangle className="w-4 h-4" />
                                      Unable to check recalls: {recalls.error || 'Service unavailable'}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-gray-500">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Checking recalls...
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="md:col-span-2 border-t border-gray-200 pt-4 flex flex-wrap gap-3">
                      <button
                        onClick={() => fetchDrugInfo(item)}
                        disabled={!!drugInfo[item.id] || fetchingDetails === item.id}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        <Shield className="w-4 h-4" />
                        {drugInfo[item.id] ? 'Drug Info Loaded' : 'Load Drug Info'}
                      </button>
                      <button
                        onClick={() => fetchRecalls(item)}
                        disabled={!!recallInfo[item.id] || fetchingDetails === item.id}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        {recallInfo[item.id] ? 'Recalls Checked' : 'Check Recalls'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-floating max-w-md w-full max-h-[90vh] overflow-y-auto animate-slide-in">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="font-display font-semibold text-navy">Add Medicine</h2>
              <button
                onClick={() => { setShowAddModal(false); setAddError(''); }}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-5 space-y-4">
              {addError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                  {addError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Name *</label>
                <input
                  type="text"
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g., Tylenol 500mg"
                  required
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Brand Name</label>
                  <input
                    type="text"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="e.g., Tylenol"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Generic Name</label>
                  <input
                    type="text"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g., Acetaminophen"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Strength</label>
                  <input
                    type="text"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g., 500mg"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Form</label>
                  <input
                    type="text"
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                    placeholder="e.g., tablet"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">NDC</label>
                  <input
                    type="text"
                    value={formData.ndc}
                    onChange={(e) => setFormData({ ...formData, ndc: e.target.value })}
                    placeholder="e.g., 12345-6789-01"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Manufacturer</label>
                  <input
                    type="text"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g., Johnson & Johnson"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Expiration Date</label>
                <input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  placeholder="Optional notes..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Verification State</label>
                <select
                  value={formData.verificationState}
                  onChange={(e) => setFormData({ ...formData, verificationState: e.target.value as 'NEEDS_REVIEW' | 'USER_CONFIRMED' | 'UNABLE_TO_MATCH' })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400"
                >
                  <option value="NEEDS_REVIEW">Needs Review</option>
                  <option value="USER_CONFIRMED">User Confirmed</option>
                  <option value="UNABLE_TO_MATCH">Unable to Match</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); setAddError(''); }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !formData.productName.trim()}
                  className="flex-1 px-4 py-2.5 bg-teal text-white rounded-xl font-medium hover:bg-teal-dark transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  {adding ? 'Adding...' : 'Add Medicine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

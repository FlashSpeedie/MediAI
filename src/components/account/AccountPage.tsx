'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import {
  User, Heart, Activity, Pill, Users, Lock,
  AlertTriangle, Save, Eye, EyeOff, Check,
  LogOut, Trash2, Copy, CheckCheck, Camera,
  Shield, Bell, Sparkles, ChevronRight,
  Edit3, X
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { Prisma } from '@prisma/client';

type Tab = 'overview' | 'personal' | 'health' | 'lifestyle' | 'medical' | 'security' | 'family' | 'danger';

type UserWithRelations = Prisma.UserGetPayload<{
  include: {
    familyGroup: {
      include: {
        members: {
          select: {
            id: true; name: true; image: true; age: true; gender: true; onboardingComplete: true;
          }
        }
      }
    };
    healthSummaries: { orderBy: { updatedAt: 'desc' }; take: 1 };
    _count: { select: { symptomSessions: true } };
  }
}>;

interface Props { user: UserWithRelations | null; }

export default function AccountPage({ user }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('overview');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: user?.name ?? '',
    age: user?.age?.toString() ?? '',
    gender: user?.gender ?? '',
    bloodType: user?.bloodType ?? '',
    heightCm: user?.heightCm?.toString() ?? '',
    weightKg: user?.weightKg?.toString() ?? '',
    heartRateBpm: user?.heartRateBpm?.toString() ?? '',
    bloodPressure: user?.bloodPressure ?? '',
    dietType: user?.dietType ?? '',
    activityLevel: user?.activityLevel ?? '',
    smokingStatus: user?.smokingStatus ?? '',
    alcoholUse: user?.alcoholUse ?? '',
    chronicConditions: (user?.chronicConditions ?? []) as string[],
    currentMedications: (user?.currentMedications ?? []) as string[],
    knownAllergies: (user?.knownAllergies ?? []) as string[],
    accountType: user?.accountType ?? 'SOLO',
  });

  const [pwForm, setPwForm] = useState({ current: '', new: '', confirm: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [pwError, setPwError] = useState('');
  const [pwSaved, setPwSaved] = useState(false);

  const set = (key: string, value: string | string[]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const toggleMulti = (key: string, value: string) => {
    const curr = (form[key as keyof typeof form] as string[]) ?? [];
    if (value === 'None') { set(key, ['None']); return; }
    const filtered = curr.filter((v) => v !== 'None');
    set(key, filtered.includes(value) ? filtered.filter((v) => v !== value) : [...filtered, value]);
  };

  const bmi = form.heightCm && form.weightKg
    ? parseFloat(form.weightKg) / Math.pow(parseFloat(form.heightCm) / 100, 2)
    : null;
  const bmiCat = bmi
    ? bmi < 18.5 ? { label: 'Underweight', color: 'text-blue-500' }
    : bmi < 25 ? { label: 'Normal', color: 'text-teal' }
    : bmi < 30 ? { label: 'Overweight', color: 'text-amber' }
    : { label: 'Obese', color: 'text-coral' }
    : null;

  const save = async () => {
    setSaving(true); setError('');
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      router.refresh();
    } catch { setError('Failed to save. Please try again.'); }
    finally { setSaving(false); }
  };

  const savePassword = async () => {
    setPwError('');
    if (pwForm.new.length < 8) { setPwError('Minimum 8 characters'); return; }
    if (pwForm.new !== pwForm.confirm) { setPwError('Passwords do not match'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/account/password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: pwForm.current, newPassword: pwForm.new }),
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setPwSaved(true);
      setPwForm({ current: '', new: '', confirm: '' });
      setTimeout(() => setPwSaved(false), 3000);
    } catch (e) { setPwError((e as Error).message); }
    finally { setSaving(false); }
  };

  const deleteAccount = async () => {
    if (!confirm('This will permanently delete your account and all health data. Are you sure?')) return;
    const input = prompt('Type DELETE to confirm:');
    if (input !== 'DELETE') return;
    await fetch('/api/account', { method: 'DELETE' });
    signOut({ callbackUrl: '/' });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(user?.familyGroup?.code ?? '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sidebar nav items
  const sideItems: { id: Tab; icon: typeof User; label: string; badge?: string }[] = [
    { id: 'overview', icon: User, label: 'Overview' },
    { id: 'personal', icon: Edit3, label: 'Personal Info' },
    { id: 'health', icon: Heart, label: 'Health Metrics' },
    { id: 'lifestyle', icon: Activity, label: 'Lifestyle' },
    { id: 'medical', icon: Pill, label: 'Medical History' },
    { id: 'security', icon: Lock, label: 'Security' },
    { id: 'family', icon: Users, label: 'Family', badge: user?.familyGroup ? user.familyGroup.members.length.toString() : undefined },
    { id: 'danger', icon: AlertTriangle, label: 'Danger Zone' },
  ];

  const inputCls = "w-full px-4 py-2.5 border border-warm-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition bg-white placeholder:text-gray-300";
  const labelCls = "block text-sm font-medium text-gray-700 mb-1.5";
  const selectCls = "w-full px-4 py-2.5 border border-warm-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal transition bg-white";

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Page header */}
      <div className="bg-white border-b border-warm-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-navy">Account Settings</h1>
              <p className="text-sm text-gray-500 mt-0.5">Manage your profile, health data, and preferences</p>
            </div>
            {tab !== 'overview' && tab !== 'security' && tab !== 'family' && tab !== 'danger' && (
              <button
                onClick={save}
                disabled={saving}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all',
                  saved ? 'bg-green-500 text-white shadow-none'
                  : 'bg-teal text-white hover:bg-teal-dark shadow-glow-teal'
                )}
              >
                {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : saved ? <Check className="w-4 h-4" />
                : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : saving ? 'Saving…' : 'Save Changes'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Sidebar ── */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-3xl border border-warm-border shadow-card overflow-hidden sticky top-24">
              {/* Profile mini card */}
              <div className="p-5 bg-gradient-to-br from-navy to-navy-light text-white">
                <div className="flex items-center gap-3 mb-3">
                  {user?.image ? (
                    <Image src={user.image} alt="" width={48} height={48} className="rounded-2xl ring-2 ring-white/20" />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-lg font-bold">
                      {(user?.name ?? user?.email ?? 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{user?.name ?? 'User'}</p>
                    <p className="text-xs text-white/60 truncate">{user?.email}</p>
                  </div>
                </div>
                <div className="flex gap-3 text-center">
                  <div className="flex-1 bg-white/10 rounded-xl py-2">
                    <p className="text-lg font-bold">{user?._count?.symptomSessions ?? 0}</p>
                    <p className="text-xs text-white/60">Sessions</p>
                  </div>
                  <div className="flex-1 bg-white/10 rounded-xl py-2">
                    <p className="text-lg font-bold">{user?.familyGroup?.members?.length ?? 1}</p>
                    <p className="text-xs text-white/60">{user?.accountType === 'FAMILY' ? 'Members' : 'Solo'}</p>
                  </div>
                  {bmi && (
                    <div className="flex-1 bg-white/10 rounded-xl py-2">
                      <p className={cn('text-lg font-bold', bmiCat?.color ?? 'text-white')}>{bmi.toFixed(1)}</p>
                      <p className="text-xs text-white/60">BMI</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Nav */}
              <nav className="p-2">
                {sideItems.map(({ id, icon: Icon, label, badge }) => (
                  <button
                    key={id}
                    onClick={() => setTab(id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all text-left mb-0.5',
                      tab === id
                        ? 'bg-teal-light text-teal-dark font-semibold'
                        : id === 'danger'
                        ? 'text-coral hover:bg-coral-light'
                        : 'text-gray-600 hover:bg-warm-gray hover:text-navy'
                    )}
                  >
                    <Icon className={cn('w-4 h-4 flex-shrink-0',
                      tab === id ? 'text-teal' : id === 'danger' ? 'text-coral' : 'text-gray-400'
                    )} />
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <span className="text-xs bg-teal text-white px-1.5 py-0.5 rounded-full">{badge}</span>
                    )}
                    {tab === id && <ChevronRight className="w-3.5 h-3.5 text-teal" />}
                  </button>
                ))}
              </nav>

              {/* Sign out quick button */}
              <div className="p-2 border-t border-warm-border">
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* ── Main Panel ── */}
          <main className="flex-1 min-w-0">
            {error && (
              <div className="mb-4 bg-coral-light border border-coral/30 text-coral text-sm rounded-2xl px-4 py-3 flex items-center gap-2">
                <X className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* ─── OVERVIEW ─── */}
            {tab === 'overview' && (
              <div className="space-y-5 animate-fade-up">
                {/* Health summary card */}
                {user?.healthSummaries?.[0] && (
                  <div className="bg-gradient-to-br from-navy to-navy-light rounded-3xl p-6 text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-teal-300" />
                      <h3 className="font-display font-semibold">AI Health Summary</h3>
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">{user.healthSummaries[0].summary}</p>
                    <p className="text-xs text-white/40 mt-3">Based on {user.healthSummaries[0].sessionCount} sessions</p>
                  </div>
                )}

                {/* Quick stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Age', value: user?.age ? `${user.age}y` : '—', icon: '🎂' },
                    { label: 'Blood Type', value: user?.bloodType ?? '—', icon: '🩸' },
                    { label: 'BMI', value: bmi ? bmi.toFixed(1) : '—', icon: '⚖️', sub: bmiCat?.label },
                    { label: 'Heart Rate', value: user?.heartRateBpm ? `${user.heartRateBpm}` : '—', unit: 'bpm', icon: '❤️' },
                  ].map(({ label, value, icon, unit, sub }) => (
                    <div key={label} className="bg-white rounded-2xl border border-warm-border p-4 shadow-card">
                      <span className="text-xl">{icon}</span>
                      <p className="text-xl font-display font-bold text-navy mt-2">{value}<span className="text-sm font-normal text-gray-400 ml-0.5">{unit}</span></p>
                      <p className="text-xs text-gray-400 mt-0.5">{sub ?? label}</p>
                    </div>
                  ))}
                </div>

                {/* Profile completeness */}
                {(() => {
                  const fields = [user?.age, user?.gender, user?.heightCm, user?.weightKg, user?.bloodType, user?.dietType, user?.activityLevel];
                  const filled = fields.filter(Boolean).length;
                  const pct = Math.round((filled / fields.length) * 100);
                  return (
                    <div className="bg-white rounded-3xl border border-warm-border p-6 shadow-card">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-display font-semibold text-navy">Profile Completeness</h3>
                        <span className="text-sm font-bold text-teal">{pct}%</span>
                      </div>
                      <div className="h-2 bg-warm-gray rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-teal to-teal-dark rounded-full transition-all duration-1000"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        {pct < 100 ? 'Complete your profile for better AI recommendations' : '✅ Profile complete — AI has full context'}
                      </p>
                      {pct < 100 && (
                        <button
                          onClick={() => setTab('personal')}
                          className="mt-3 text-sm font-medium text-teal hover:underline"
                        >
                          Complete profile →
                        </button>
                      )}
                    </div>
                  );
                })()}

                {/* Info cards grid */}
                {[
                  {
                    title: 'Personal Info',
                    tab: 'personal' as Tab,
                    items: [
                      { label: 'Name', value: user?.name ?? '—' },
                      { label: 'Gender', value: user?.gender ?? '—' },
                      { label: 'Diet', value: user?.dietType ?? '—' },
                    ],
                  },
                  {
                    title: 'Medical',
                    tab: 'medical' as Tab,
                    items: [
                      { label: 'Conditions', value: user?.chronicConditions?.filter((c: string) => c !== 'None').join(', ') || 'None' },
                      { label: 'Allergies', value: user?.knownAllergies?.filter((a: string) => a !== 'None').join(', ') || 'None' },
                      { label: 'Medications', value: user?.currentMedications?.filter((m: string) => m !== 'None').join(', ') || 'None' },
                    ],
                  },
                ].map(({ title, tab: t, items }) => (
                  <div key={title} className="bg-white rounded-3xl border border-warm-border p-6 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-display font-semibold text-navy">{title}</h3>
                      <button onClick={() => setTab(t)} className="text-xs text-teal font-medium hover:underline flex items-center gap-1">
                        Edit <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2.5">
                      {items.map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-2 border-b border-warm-gray last:border-0">
                          <span className="text-sm text-gray-400">{label}</span>
                          <span className="text-sm font-medium text-gray-800 max-w-[60%] text-right truncate">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── PERSONAL ─── */}
            {tab === 'personal' && (
              <div className="bg-white rounded-3xl border border-warm-border shadow-card p-6 animate-fade-up">
                <h2 className="font-display text-xl font-bold text-navy mb-6">Personal Information</h2>
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Full Name</label>
                    <input type="text" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="Your name" className={inputCls} />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={labelCls}>Age <span className="text-gray-400 font-normal text-xs">(years)</span></label>
                      <input type="number" value={form.age} onChange={(e) => set('age', e.target.value)} placeholder="e.g. 25" min="1" max="120" className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Biological Sex</label>
                      <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className={selectCls}>
                        <option value="">Select</option>
                        {['Male', 'Female', 'Other', 'Prefer not to say'].map((o) => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Blood Type</label>
                    <select value={form.bloodType} onChange={(e) => set('bloodType', e.target.value)} className={selectCls}>
                      <option value="">Unknown</option>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Account Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {[{ v: 'SOLO', label: 'Solo', desc: 'Personal health tracking', icon: '👤' },
                        { v: 'FAMILY', label: 'Family', desc: 'Track your whole family', icon: '👨‍👩‍👧' }].map(({ v, label, desc, icon }) => (
                        <button key={v} onClick={() => set('accountType', v)}
                          className={cn('p-4 rounded-2xl border-2 text-left transition-all',
                            form.accountType === v ? 'border-teal bg-teal-light' : 'border-warm-border hover:border-gray-300'
                          )}>
                          <span className="text-xl">{icon}</span>
                          <p className={cn('font-semibold text-sm mt-1', form.accountType === v ? 'text-teal-dark' : 'text-gray-700')}>{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ─── HEALTH METRICS ─── */}
            {tab === 'health' && (
              <div className="bg-white rounded-3xl border border-warm-border shadow-card p-6 animate-fade-up">
                <h2 className="font-display text-xl font-bold text-navy mb-6">Health Metrics</h2>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { key: 'heightCm', label: 'Height', unit: 'cm', placeholder: '175' },
                      { key: 'weightKg', label: 'Weight', unit: 'kg', placeholder: '70' },
                      { key: 'heartRateBpm', label: 'Resting Heart Rate', unit: 'bpm', placeholder: '72' },
                    ].map(({ key, label, unit, placeholder }) => (
                      <div key={key}>
                        <label className={labelCls}>{label} <span className="text-gray-400 font-normal text-xs">({unit})</span></label>
                        <input type="number" value={form[key as keyof typeof form] as string}
                          onChange={(e) => set(key, e.target.value)}
                          placeholder={placeholder} className={inputCls} />
                      </div>
                    ))}
                    <div>
                      <label className={labelCls}>Blood Pressure <span className="text-gray-400 font-normal text-xs">(mmHg)</span></label>
                      <input type="text" value={form.bloodPressure} onChange={(e) => set('bloodPressure', e.target.value)} placeholder="120/80" className={inputCls} />
                    </div>
                  </div>

                  {/* Live BMI card */}
                  {bmi && bmiCat && (
                    <div className="bg-gradient-to-br from-teal-light to-white rounded-2xl border border-teal/20 p-5">
                      <p className="text-xs font-semibold text-teal uppercase tracking-wide mb-2">Calculated BMI</p>
                      <div className="flex items-end gap-3">
                        <span className={cn('text-5xl font-display font-bold', bmiCat.color)}>{bmi.toFixed(1)}</span>
                        <div className="pb-1">
                          <span className={cn('text-lg font-semibold', bmiCat.color)}>{bmiCat.label}</span>
                          <div className="h-1.5 w-40 bg-gray-200 rounded-full mt-1 overflow-hidden">
                            <div className={cn('h-full rounded-full transition-all', 
                              bmi < 18.5 ? 'bg-blue-400' : bmi < 25 ? 'bg-teal' : bmi < 30 ? 'bg-amber' : 'bg-coral'
                            )} style={{ width: `${Math.min((bmi / 40) * 100, 100)}%` }} />
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Normal: 18.5 – 24.9</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ─── LIFESTYLE ─── */}
            {tab === 'lifestyle' && (
              <div className="bg-white rounded-3xl border border-warm-border shadow-card p-6 animate-fade-up">
                <h2 className="font-display text-xl font-bold text-navy mb-6">Lifestyle & Habits</h2>
                <div className="space-y-5">
                  {[
                    { key: 'dietType', label: '🥗 Diet Type', opts: ['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Gluten-free', 'Halal', 'Kosher', 'Other'] },
                    { key: 'activityLevel', label: '🏃 Activity Level', opts: ['Sedentary (little or no exercise)', 'Light (1-3 days/week)', 'Moderate (3-5 days/week)', 'Active (6-7 days/week)', 'Very Active (athlete)'] },
                    { key: 'smokingStatus', label: '🚬 Smoking Status', opts: ['Never smoked', 'Former smoker', 'Current smoker'] },
                    { key: 'alcoholUse', label: '🍷 Alcohol Use', opts: ['None', 'Occasional', 'Moderate', 'Heavy'] },
                  ].map(({ key, label, opts }) => (
                    <div key={key}>
                      <label className={labelCls}>{label}</label>
                      <select value={form[key as keyof typeof form] as string} onChange={(e) => set(key, e.target.value)} className={selectCls}>
                        <option value="">Select an option</option>
                        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ─── MEDICAL HISTORY ─── */}
            {tab === 'medical' && (
              <div className="bg-white rounded-3xl border border-warm-border shadow-card p-6 animate-fade-up space-y-7">
                <h2 className="font-display text-xl font-bold text-navy">Medical History</h2>
                {[
                  {
                    key: 'chronicConditions', label: 'Chronic Conditions', emoji: '🏥',
                    desc: 'Select all conditions that apply to you',
                    opts: ['None', 'Diabetes (Type 1)', 'Diabetes (Type 2)', 'Hypertension', 'Heart Disease', 'Asthma', 'COPD', 'Kidney Disease', 'Liver Disease', 'Thyroid Disorder', 'Cancer', 'Autoimmune Disease', 'Mental Health Condition', 'Other'],
                  },
                  {
                    key: 'currentMedications', label: 'Current Medications', emoji: '💊',
                    desc: 'Select medication categories you currently take',
                    opts: ['None', 'Blood thinners (Warfarin/Aspirin)', 'Blood pressure medication', 'Diabetes medication', 'Antidepressants/Antianxiety', 'Thyroid medication', 'Steroids', 'Immunosuppressants', 'Other'],
                  },
                  {
                    key: 'knownAllergies', label: 'Drug Allergies', emoji: '⚠️',
                    desc: 'Critical — used to avoid dangerous medicine recommendations',
                    opts: ['None', 'Penicillin', 'Sulfa drugs', 'NSAIDs (Ibuprofen/Aspirin)', 'Acetaminophen', 'Codeine/Opioids', 'Latex', 'Other'],
                  },
                ].map(({ key, label, emoji, desc, opts }) => (
                  <div key={key}>
                    <label className={labelCls}>{emoji} {label}</label>
                    <p className="text-xs text-gray-400 mb-3">{desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {opts.map((opt) => {
                        const sel = (form[key as keyof typeof form] as string[]).includes(opt);
                        return (
                          <button key={opt} type="button" onClick={() => toggleMulti(key, opt)}
                            className={cn('px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all',
                              sel ? 'bg-teal text-white border-teal shadow-glow-teal'
                              : 'bg-white text-gray-600 border-warm-border hover:border-teal/40 hover:text-teal'
                            )}>
                            {sel && '✓ '}{opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ─── SECURITY ─── */}
            {tab === 'security' && (
              <div className="bg-white rounded-3xl border border-warm-border shadow-card p-6 animate-fade-up">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-2xl bg-navy/5 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-navy" />
                  </div>
                  <div>
                    <h2 className="font-display text-xl font-bold text-navy">Security</h2>
                    <p className="text-sm text-gray-400">Protect your account</p>
                  </div>
                </div>

                <div className="space-y-5">
                    {[
                      { key: 'current', label: 'Current Password' },
                      { key: 'new', label: 'New Password' },
                      { key: 'confirm', label: 'Confirm New Password' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className={labelCls}>{label}</label>
                        <div className="relative">
                          <input
                            type={showPw[key as keyof typeof showPw] ? 'text' : 'password'}
                            value={pwForm[key as keyof typeof pwForm]}
                            onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                            placeholder="••••••••"
                            className={cn(inputCls, 'pr-10')}
                          />
                          <button type="button"
                            onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key as keyof typeof p] }))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition">
                            {showPw[key as keyof typeof showPw] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    ))}

                    {pwError && <div className="bg-coral-light border border-coral/30 text-coral text-sm rounded-xl px-4 py-3">{pwError}</div>}
                    {pwSaved && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3">✅ Password updated successfully!</div>}

                    <button onClick={savePassword} disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-navy text-white rounded-xl text-sm font-semibold hover:bg-navy-light transition disabled:opacity-60">
                      <Lock className="w-4 h-4" />
                      Update Password
                    </button>
                  </div>
              </div>
            )}

            {/* ─── FAMILY ─── */}
            {tab === 'family' && (
              <div className="bg-white rounded-3xl border border-warm-border shadow-card p-6 animate-fade-up space-y-5">
                <h2 className="font-display text-xl font-bold text-navy">Family Group</h2>
                {user?.familyGroup ? (
                  <>
                    <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-5 text-white">
                      <p className="text-xs text-purple-200 uppercase tracking-widest mb-1">Family Name</p>
                      <p className="text-2xl font-display font-bold">{user.familyGroup.name}</p>
                    </div>

                    <div className="bg-warm-gray rounded-2xl p-5">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Family Invite Code</p>
                      <div className="flex items-center justify-between">
                        <p className="text-4xl font-display font-bold tracking-[0.3em] text-navy">{user.familyGroup.code}</p>
                        <button onClick={copyCode}
                          className={cn('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition',
                            copied ? 'bg-green-100 text-green-700' : 'bg-white border border-warm-border hover:bg-warm-gray'
                          )}>
                          {copied ? <><CheckCheck className="w-4 h-4" />Copied!</> : <><Copy className="w-4 h-4" />Copy Code</>}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">Share this code with family members to join your group</p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">Members ({user.familyGroup.members.length})</p>
                      <div className="space-y-2">
                        {user.familyGroup.members.map((m) => (
                          <div key={m.id} className="flex items-center gap-4 p-4 bg-warm-gray rounded-2xl">
                            {m.image
                              ? <Image src={m.image} alt="" width={44} height={44} className="rounded-2xl" />
                              : <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-400 to-navy flex items-center justify-center text-white font-bold">{(m.name ?? 'M').charAt(0)}</div>
                            }
                            <div className="flex-1">
                              <p className="font-semibold text-gray-800">{m.name ?? 'Member'}</p>
                              {m.age && <p className="text-xs text-gray-400">{m.gender} · {m.age} years old</p>}
                            </div>
                            {m.id === user.familyGroup?.adminId && (
                              <span className="text-xs bg-amber/20 text-amber-700 border border-amber/30 px-2.5 py-1 rounded-full font-medium">Admin</span>
                            )}
                            {!m.onboardingComplete && (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">Setup pending</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-3xl bg-warm-gray flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="font-semibold text-gray-700 mb-1">No family group yet</p>
                    <p className="text-sm text-gray-400 mb-5">Create a family group to share health tracking with your family</p>
                    <button onClick={() => setTab('personal')}
                      className="px-5 py-2.5 bg-teal text-white rounded-xl text-sm font-semibold hover:bg-teal-dark transition">
                      Switch to Family Account
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ─── DANGER ZONE ─── */}
            {tab === 'danger' && (
              <div className="space-y-4 animate-fade-up">
                <div className="bg-white rounded-3xl border-2 border-coral/20 shadow-card overflow-hidden">
                  <div className="px-6 py-4 bg-coral-light border-b border-coral/20 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-coral" />
                    <h2 className="font-display text-lg font-bold text-coral">Danger Zone</h2>
                  </div>
                  <div className="divide-y divide-warm-border">
                    <div className="flex items-center justify-between p-6">
                      <div>
                        <p className="font-semibold text-gray-900">Sign out everywhere</p>
                        <p className="text-sm text-gray-400 mt-0.5">Revokes all active sessions across all devices</p>
                      </div>
                      <button onClick={() => signOut({ callbackUrl: '/' })}
                        className="flex items-center gap-2 px-4 py-2.5 border border-warm-border rounded-xl text-sm font-medium text-gray-600 hover:border-red-300 hover:text-red-500 transition">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                    <div className="flex items-center justify-between p-6 bg-red-50/50">
                      <div>
                        <p className="font-semibold text-red-700">Delete Account</p>
                        <p className="text-sm text-red-400 mt-0.5">Permanently removes your account and ALL health data. This cannot be undone.</p>
                      </div>
                      <button onClick={deleteAccount}
                        className="flex items-center gap-2 px-4 py-2.5 bg-coral text-white rounded-xl text-sm font-semibold hover:bg-coral-dark transition">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

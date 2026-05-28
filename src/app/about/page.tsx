import Link from 'next/link';
import { Stethoscope, Shield, Zap, Brain, Heart, Users, ArrowRight, CheckCircle } from 'lucide-react';

export const metadata = { title: 'About MediAI — AI Medical Triage' };

export default function AboutPage() {
  const team = [
    { name: 'Dr. Emily Chen', role: 'Medical Advisor', desc: 'Board-certified ER physician with 12 years experience', emoji: '👩‍⚕️' },
    { name: 'AI Research Team', role: 'Technology', desc: 'Powered by Google Gemini Vision + Groq Llama 3.3', emoji: '🤖' },
    { name: 'Safety Board', role: 'Ethics & Safety', desc: 'Continuous review of AI medical outputs', emoji: '🛡️' },
  ];

  const values = [
    { icon: Shield, title: 'Safety First', desc: 'Every recommendation is validated against medical guidelines. We never suggest prescription medications.', color: 'text-teal' },
    { icon: Brain, title: 'Intelligent Triage', desc: 'Our structured questioning mirrors real clinical intake processes used in emergency rooms.', color: 'text-purple-500' },
    { icon: Heart, title: 'Compassionate Care', desc: 'We understand that health concerns cause anxiety. MediAI is designed to calm, not alarm.', color: 'text-coral' },
    { icon: Zap, title: 'Instant Guidance', desc: 'Get a triage assessment in minutes — not hours waiting in urgent care for minor concerns.', color: 'text-amber' },
  ];

  return (
    <div className="min-h-screen bg-warm-white">

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-light to-teal-dark text-white py-24 px-4">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-teal blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full bg-coral blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm mb-8">
            <Stethoscope className="w-4 h-4 text-teal-300" />
            About MediAI
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-bold mb-6 text-balance">
            Healthcare guidance,<br />
            <span className="text-teal-300">at your fingertips</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto text-balance">
            MediAI bridges the gap between wondering "should I see a doctor?" and knowing exactly what to do — using AI-powered triage that's fast, safe, and honest about its limits.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="font-display text-4xl font-bold text-navy mb-5">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Millions of people visit emergency rooms every year for conditions that could be safely managed at home — or wait too long at home for conditions that need urgent care. The problem isn't access to information. It's knowing what to do with your specific symptoms, at this moment, given your health history.
            </p>
            <p className="text-gray-600 leading-relaxed mb-6">
              MediAI was built to give everyone — regardless of access to healthcare — a reliable first step: a structured, personalized triage conversation that tells you clearly what to do next.
            </p>
            <div className="space-y-2">
              {['Free to use', 'FDA-sourced medicine data', 'No diagnosis — only guidance', 'Privacy-first design'].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                  <CheckCircle className="w-4 h-4 text-teal flex-shrink-0" />
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-to-br from-teal-light to-white rounded-3xl border border-teal/20 p-8">
            <div className="grid grid-cols-2 gap-4">
              {[
                { num: '911', label: 'Emergency routing when needed', color: 'text-coral' },
                { num: 'FDA', label: 'Official drug database integration', color: 'text-navy' },
                { num: '24/7', label: 'Always available triage', color: 'text-teal' },
                { num: '100%', label: 'Free for personal use', color: 'text-purple-500' },
              ].map(({ num, label, color }) => (
                <div key={num} className="bg-white rounded-2xl p-4 shadow-card">
                  <p className={`font-display text-3xl font-bold ${color}`}>{num}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-white border-y border-warm-border py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-navy mb-3">Built on Four Pillars</h2>
            <p className="text-gray-500">Every decision in MediAI is guided by these principles</p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {values.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex gap-4 p-6 bg-warm-white rounded-3xl border border-warm-border hover:shadow-elevated transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-warm-gray flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-navy text-lg mb-1">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-amber/10 border border-amber/30 rounded-3xl p-8">
          <Shield className="w-8 h-8 text-amber mx-auto mb-3" />
          <h3 className="font-display text-xl font-bold text-navy mb-3">Important Disclaimer</h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            MediAI is an AI triage assistant — not a licensed physician and not a substitute for professional medical care. MediAI cannot diagnose conditions. Always consult a qualified healthcare professional for medical decisions. In emergencies, call 911 immediately.
          </p>
        </div>
        <div className="mt-10">
          <Link href="/chat" className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-teal to-teal-dark text-white rounded-2xl font-semibold hover:opacity-90 transition shadow-glow-teal">
            Start a Triage Session <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}

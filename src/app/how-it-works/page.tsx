import Link from 'next/link';
import {
  MessageSquare, Camera, Mic, Brain, Pill,
  AlertTriangle, ArrowRight, CheckCircle, ChevronRight
} from 'lucide-react';

export const metadata = { title: 'How It Works - MediAI' };

const steps = [
  {
    num: '01', icon: MessageSquare, color: 'bg-teal text-white',
    title: 'Sign up & set your health profile',
    desc: 'Create your account and complete a one-time health profile - age, weight, conditions, medications, allergies. This gives MediAI the context to give you personalized guidance instead of generic advice.',
    detail: 'Your profile is encrypted and never shared. It\'s only used to personalize AI responses.',
  },
  {
    num: '02', icon: Brain, color: 'bg-navy text-white',
    title: 'Describe your symptoms',
    desc: 'Start a new session and tell MediAI what\'s bothering you. Use text, your voice, or even your camera. The AI will ask you one structured question at a time - just like a real intake nurse.',
    detail: 'Powered by Groq\'s Llama 3.3 70B - one of the fastest and most accurate large language models available.',
  },
  {
    num: '03', icon: Camera, color: 'bg-purple-600 text-white',
    title: 'Use your camera (optional)',
    desc: 'Point your camera at a medicine bottle and MediAI will read the label, cross-check it with FDA data, and tell you if it\'s appropriate for your symptoms. Or show a visible symptom for visual analysis.',
    detail: 'Image analysis uses Google Gemini Vision - the same AI that powers Google Lens.',
  },
  {
    num: '04', icon: Pill, color: 'bg-amber text-white',
    title: 'Get your assessment',
    desc: 'After gathering enough information, MediAI provides a clear urgency assessment - LOW, MEDIUM, HIGH, or CRITICAL - with specific next steps and FDA-sourced OTC medicine recommendations if appropriate.',
    detail: 'Medicine data is pulled live from the official FDA OpenFDA API and NIH RxNorm database.',
  },
  {
    num: '05', icon: AlertTriangle, color: 'bg-coral text-white',
    title: 'Know exactly what to do',
    desc: 'Whether it\'s rest and drink fluids, go to urgent care, or call 911 right now - you\'ll know. Your session is saved to your history so you and your doctor can reference it later.',
    detail: 'Emergency detection is instant - if you describe chest pain or stroke symptoms, 911 guidance appears immediately without waiting for the conversation to complete.',
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-warm-white">

      {/* Hero */}
      <section className="bg-white border-b border-warm-border py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-sm font-medium text-teal bg-teal-light px-4 py-1.5 rounded-full mb-6">How it works</span>
          <h1 className="font-display text-5xl font-bold text-navy mb-5 text-balance">
            From symptoms to answers in minutes
          </h1>
          <p className="text-xl text-gray-500 text-balance">
            MediAI guides you through a structured triage process - the same kind used in real emergency rooms - to give you clear, personalized next steps.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-4xl mx-auto px-4 py-20">
        <div className="space-y-6">
          {steps.map(({ num, icon: Icon, color, title, desc, detail }, i) => (
            <div key={num} className="flex gap-6 group">
              <div className="flex flex-col items-center">
                <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0 shadow-elevated`}>
                  <Icon className="w-5 h-5" />
                </div>
                {i < steps.length - 1 && (
                  <div className="w-px flex-1 bg-warm-border mt-3 mb-0" />
                )}
              </div>
              <div className="flex-1 pb-8">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-bold text-gray-300 font-mono">{num}</span>
                  <h3 className="font-display text-xl font-bold text-navy">{title}</h3>
                </div>
                <p className="text-gray-600 leading-relaxed mb-3">{desc}</p>
                <div className="flex items-start gap-2 bg-warm-gray rounded-xl px-4 py-3">
                  <CheckCircle className="w-3.5 h-3.5 text-teal mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-gray-500">{detail}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white border-y border-warm-border py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-3xl font-bold text-navy mb-10 text-center">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Is MediAI a replacement for seeing a doctor?',
                a: 'No. MediAI is a triage tool - it helps you understand urgency and next steps, but it cannot diagnose conditions. Always see a doctor for ongoing or serious health concerns.',
              },
              {
                q: 'Is my health information private?',
                a: 'Yes. Your health profile and chat sessions are stored securely in your personal account. We never sell or share your data. Your information is only used to personalize AI responses.',
              },
              {
                q: 'What if it\'s an emergency?',
                a: 'If you describe emergency symptoms (chest pain, difficulty breathing, stroke signs), MediAI will immediately tell you to call 911 - it won\'t make you wait through a triage conversation.',
              },
              {
                q: 'How accurate is the medicine recommendation?',
                a: 'Medicine data is sourced directly from FDA.gov and the NIH RxNorm database - the same sources used by pharmacists. However, always read the full label and consult a pharmacist for specific questions.',
              },
              {
                q: 'Can I use this for my family?',
                a: 'Yes! Create a Family account to set up a family group. Share the 6-digit code with family members so each person has their own health profile - useful for parents managing children\'s health.',
              },
            ].map(({ q, a }) => (
              <details key={q} className="group bg-warm-white rounded-2xl border border-warm-border overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer font-semibold text-navy text-sm list-none">
                  {q}
                  <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform flex-shrink-0" />
                </summary>
                <div className="px-6 pb-4 text-sm text-gray-500 leading-relaxed border-t border-warm-border pt-3">
                  {a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 py-16 text-center">
        <h2 className="font-display text-3xl font-bold text-navy mb-3">Ready to try it?</h2>
        <p className="text-gray-500 mb-8">It takes less than 5 minutes and it's completely free.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-teal to-teal-dark text-white rounded-2xl font-semibold hover:opacity-90 transition shadow-glow-teal">
            Create Free Account <ArrowRight className="w-4 h-4" />
          </Link>
          <Link href="/chat" className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border-2 border-warm-border text-navy rounded-2xl font-semibold hover:bg-warm-gray transition">
            Try Without Account
          </Link>
        </div>
      </section>
    </div>
  );
}


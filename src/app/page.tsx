import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  Stethoscope, MessageSquare, Camera, Mic, History,
  Shield, ArrowRight, Star, CheckCircle, Zap,
  Brain, Heart, Users
} from 'lucide-react';

export default async function HomePage() {
  const session = await auth();
  
  // Redirect logged-in users to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  const features = [
    { icon: Brain, title: 'Structured Triage', desc: 'One question at a time. Like a real intake process — not a chatbot that overwhelms you.', color: 'text-teal' },
    { icon: Camera, title: 'Medicine Bottle Scanner', desc: 'Point your camera at any medicine. AI reads the label and tells you if it\'s right for your symptoms.', color: 'text-purple-500' },
    { icon: Mic, title: 'Voice Input', desc: 'Too unwell to type? Just speak. MediAI listens and responds.', color: 'text-amber' },
    { icon: Shield, title: 'FDA Drug Data', desc: 'Every medicine recommendation is sourced directly from official FDA and NIH databases.', color: 'text-coral' },
    { icon: History, title: 'Session History', desc: 'Every triage saved. Share with your doctor or look back at past symptoms and what you did.', color: 'text-blue-500' },
    { icon: Users, title: 'Family Accounts', desc: 'One account for your whole family. Each person gets their own health profile and history.', color: 'text-green-500' },
  ];

  const testimonials = [
    { text: 'I was about to go to the ER at 2am for what turned out to be a tension headache. MediAI walked me through the questions and I realized I could safely wait and see my doctor in the morning.', name: 'Parent of 3', location: 'Texas' },
    { text: 'As someone with multiple chronic conditions, having an AI that actually knows my history when I describe new symptoms is genuinely useful.', name: 'Chronic illness patient', location: 'California' },
    { text: 'The medicine scanner is unreal. I had an old bottle with no idea what it treated — scanned it and got a full breakdown in seconds.', name: 'College student', location: 'New York' },
  ];

  return (
    <div className="min-h-screen bg-warm-white">

      {/* Hero */}
      <section className="relative overflow-hidden pt-16 pb-24 px-4">
        {/* Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-teal/8 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-coral/6 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 bg-teal-light border border-teal/20 text-teal-dark rounded-full px-4 py-1.5 text-sm font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse" />
              Powered by Gemini + Groq AI
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-navy mb-6 text-balance leading-[1.1]">
              Know what to do
              <br />
              <span className="text-teal">when you feel unwell</span>
            </h1>
            <p className="text-xl text-gray-500 mb-10 text-balance leading-relaxed max-w-2xl mx-auto">
              MediAI asks the right questions about your symptoms and tells you clearly — rest at home, see a doctor, go to urgent care, or call 911. Personalized to your health profile.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-teal to-teal-dark text-white rounded-2xl font-semibold text-lg hover:opacity-90 transition shadow-glow-teal">
                Start for free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-warm-border text-navy rounded-2xl font-semibold text-lg hover:bg-warm-gray transition">
                See how it works
              </Link>
            </div>
            <p className="text-xs text-gray-400 mt-4">
              ⚠️ Not for emergencies. Call 911 for life-threatening situations.
            </p>
          </div>

          {/* Urgency level preview */}
          <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
            {[
              { level: 'LOW', label: 'Home care', color: 'bg-green-50 border-green-200 text-green-700', dot: 'bg-green-400' },
              { level: 'MEDIUM', label: 'See a doctor', color: 'bg-amber/10 border-amber/30 text-amber-700', dot: 'bg-amber' },
              { level: 'HIGH', label: 'Urgent care', color: 'bg-orange-50 border-orange-200 text-orange-700', dot: 'bg-orange-400' },
              { level: 'CRITICAL', label: 'Call 911', color: 'bg-coral-light border-coral/30 text-coral', dot: 'bg-coral' },
            ].map(({ level, label, color, dot }) => (
              <div key={level} className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium ${color}`}>
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                <span className="font-bold">{level}</span>
                <span className="opacity-70">— {label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white border-y border-warm-border py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-navy mb-3">Everything you need</h2>
            <p className="text-gray-500">Built with the features that actually matter when you\'re unwell</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group bg-warm-white rounded-3xl border border-warm-border p-6 hover:shadow-elevated hover:-translate-y-0.5 transition-all">
                <div className="w-11 h-11 rounded-2xl bg-warm-gray group-hover:bg-teal-light flex items-center justify-center mb-4 transition-colors">
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-display font-bold text-navy text-lg mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-display text-4xl font-bold text-navy mb-3">Real stories</h2>
          <p className="text-gray-500">How MediAI has helped people make better health decisions</p>
        </div>
        <div className="grid md:grid-cols-3 gap-5">
          {testimonials.map(({ text, name, location }) => (
            <div key={name} className="bg-white rounded-3xl border border-warm-border p-6 shadow-card">
              <div className="flex gap-0.5 mb-4">
                {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-amber text-amber" />)}
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-5 italic">&ldquo;{text}&rdquo;</p>
              <div>
                <p className="font-semibold text-navy text-sm">{name}</p>
                <p className="text-xs text-gray-400">{location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-br from-navy to-navy-light text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-display text-4xl font-bold mb-4">Your health deserves clarity</h2>
          <p className="text-white/70 text-lg mb-10">Create your free account and start your first triage session in under 2 minutes.</p>
          <Link href="/register" className="inline-flex items-center gap-2 px-8 py-4 bg-teal text-white rounded-2xl font-semibold text-lg hover:bg-teal-dark transition shadow-glow-teal">
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/40 text-xs mt-4">No credit card. No subscription. Free forever for personal use.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-warm-white border-t border-warm-border py-10 px-4">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-teal to-teal-dark flex items-center justify-center">
              <Stethoscope className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-display font-bold text-navy">MediAI</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/about" className="hover:text-navy transition">About</Link>
            <Link href="/how-it-works" className="hover:text-navy transition">How it Works</Link>
            <Link href="/privacy" className="hover:text-navy transition">Privacy</Link>
            <Link href="/terms" className="hover:text-navy transition">Terms</Link>
          </div>
          <p className="text-xs text-gray-300">Not a medical device. For informational purposes only.</p>
        </div>
      </footer>
    </div>
  );
}

export const metadata = { title: 'Terms of Service — MediAI' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-warm-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-navy mb-3">Terms of Service</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: March 2026</p>
        <div className="space-y-8">
          {[
            { title: '1. Not Medical Advice', body: 'MediAI is an informational tool only. Nothing on this platform constitutes medical advice, diagnosis, or treatment. Always seek the advice of a qualified healthcare provider with questions about a medical condition.' },
            { title: '2. Emergency Situations', body: 'If you believe you are experiencing a medical emergency, call 911 or your local emergency number immediately. Do not use MediAI in place of emergency services.' },
            { title: '3. Accuracy Limitations', body: 'AI-generated responses may be inaccurate, incomplete, or outdated. MediAI makes no warranties about the accuracy of any triage assessment or medicine recommendation. You use this service at your own risk.' },
            { title: '4. Age Restriction', body: 'MediAI is intended for use by individuals 13 years of age and older. Users under 18 should have parental supervision.' },
            { title: '5. Account Responsibility', body: 'You are responsible for maintaining the confidentiality of your account credentials and for all activity under your account.' },
            { title: '6. Acceptable Use', body: 'You agree not to use MediAI to attempt to obtain prescriptions, controlled substances, or to circumvent professional medical care for serious conditions.' },
            { title: '7. Changes to Terms', body: 'We reserve the right to update these terms at any time. Continued use of the service constitutes acceptance of updated terms.' },
          ].map(({ title, body }) => (
            <section key={title}>
              <h2 className="font-display text-xl font-bold text-navy mb-2">{title}</h2>
              <p className="text-gray-600 leading-relaxed">{body}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

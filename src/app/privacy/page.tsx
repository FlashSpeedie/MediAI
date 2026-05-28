export const metadata = { title: 'Privacy Policy — MediAI' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-warm-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-4xl font-bold text-navy mb-3">Privacy Policy</h1>
        <p className="text-gray-400 text-sm mb-10">Last updated: March 2026</p>
        <div className="prose prose-gray max-w-none space-y-8">
          {[
            { title: 'What We Collect', body: 'We collect your email address, name, and health profile information that you voluntarily provide during onboarding. We also store your triage conversation history to generate health summaries. We do not collect payment information, location data beyond what you provide, or any data without your explicit input.' },
            { title: 'How We Use Your Data', body: 'Your health profile is used exclusively to personalize AI triage responses. Your conversation history is used to generate a health summary that helps the AI understand your past medical context. We do not sell, share, or use your data for advertising.' },
            { title: 'AI Processing', body: 'Your messages are sent to third-party AI services (Groq and Google Gemini) for processing. These services process your data according to their own privacy policies. We do not send personally identifying information (name, email) to AI services — only health-related context.' },
            { title: 'Data Storage', body: 'Your data is stored in a secure PostgreSQL database hosted on Supabase. All connections are encrypted with TLS. Database access is restricted to authenticated requests only.' },
            { title: 'Your Rights', body: 'You can delete your account and all associated data at any time from Account Settings → Danger Zone → Delete Account. You can also edit or remove any part of your health profile at any time.' },
            { title: 'Contact', body: 'For privacy-related questions, reach out through the app\'s feedback system.' },
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

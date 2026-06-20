import React from 'react';
import Card from '../components/Card';

export const Privacy: React.FC = () => {
  return (
    <div className="px-4 md:px-margin-desktop py-6 max-w-4xl mx-auto w-full space-y-gutter pb-12 text-primary font-body-lg select-none">
      <header className="border-b-4 border-primary pb-4 mb-8">
        <h2 className="font-display-lg text-2xl md:text-4xl uppercase tracking-tight">Privacy Policy</h2>
        <p className="font-body-sm text-sm text-on-surface-variant mt-2">Last updated: June 2026</p>
      </header>

      <Card className="shadow-[8px_8px_0px_0px_var(--shadow-color)] p-8 space-y-6">
        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">1. Information We Collect</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            Helix collects information you provide directly, including account registration data (name, email), 
            skill mastery scores, revision logs, mock interview results, and failure reports. We also collect 
            usage data such as feature interactions and session duration to improve our platform.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">2. How We Use Your Data</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            Your data is used exclusively to power the Helix preparation intelligence engine: calculating 
            cognitive decay rates, generating readiness scores, providing personalized recommendations, 
            and delivering AI-powered risk analysis. We do not sell your personal data to third parties.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">3. Data Retention</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            We retain your account data for as long as your account is active. Revision history, skill 
            scores, and failure reports are retained to maintain accurate decay modeling. You may request 
            deletion of your data at any time by contacting our support team.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">4. Data Security</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            We implement industry-standard encryption protocols (TLS 1.3) for data in transit and 
            AES-256 encryption for data at rest. Access to your data is restricted to authenticated 
            sessions using JWT tokens with automatic expiry.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">5. Third-Party Services</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            Helix uses Google Gemini API for AI-powered risk explanations and insights. No personally 
            identifiable information is shared with the AI service. Anonymized skill scores and 
            diagnostic data may be processed through the API solely for generating explanations.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">6. Your Rights</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            You have the right to access, correct, or delete your personal data at any time. You may 
            export your data via the Settings page. To exercise any of these rights, contact 
            privacy@helixprep.com.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">7. Changes to This Policy</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            We may update this Privacy Policy from time to time. Material changes will be communicated 
            via email or through an in-app notification. Continued use of Helix after changes 
            constitutes acceptance of the updated policy.
          </p>
        </section>
      </Card>
    </div>
  );
};

export default Privacy;

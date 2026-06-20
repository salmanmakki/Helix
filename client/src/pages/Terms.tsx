import React from 'react';
import Card from '../components/Card';

export const Terms: React.FC = () => {
  return (
    <div className="px-4 md:px-margin-desktop py-6 max-w-4xl mx-auto w-full space-y-gutter pb-12 text-primary font-body-lg select-none">
      <header className="border-b-4 border-primary pb-4 mb-8">
        <h2 className="font-display-lg text-2xl md:text-4xl uppercase tracking-tight">Terms of Service</h2>
        <p className="font-body-sm text-sm text-on-surface-variant mt-2">Last updated: June 2026</p>
      </header>

      <Card className="shadow-[8px_8px_0px_0px_var(--shadow-color)] p-8 space-y-6">
        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">1. Acceptance of Terms</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            By accessing or using Helix, you agree to be bound by these Terms of Service. If you do 
            not agree, you may not use the platform. These terms apply to all users, including 
            students, administrators, and any other parties accessing the service.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">2. Account Responsibilities</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            You are responsible for maintaining the confidentiality of your login credentials and 
            for all activities that occur under your account. You must notify us immediately of 
            any unauthorized use. You must be at least 13 years of age to use this service.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">3. Acceptable Use</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            You agree to use Helix only for lawful purposes and in accordance with these terms. 
            You may not use the platform to upload malicious code, attempt to access other users' 
            data, interfere with service operations, or circumvent any security measures.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">4. Intellectual Property</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            The Helix platform, including its design, algorithms, decay engines, readiness 
            calculations, and AI integration, is proprietary intellectual property. Users retain 
            ownership of their personal data and skill records. You may not copy, modify, or 
            reverse-engineer any part of the service.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">5. Service Availability</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            We strive to maintain high availability but do not guarantee uninterrupted access. 
            Helix may experience scheduled maintenance, emergency updates, or unforeseen downtime. 
            We are not liable for any loss resulting from service interruptions.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">6. Limitation of Liability</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            Helix provides preparation intelligence tools for interview practice and skill tracking. 
            We do not guarantee interview outcomes or job placement. The platform is provided 
            &ldquo;as is&rdquo; without warranties of merchantability or fitness for a particular purpose.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">7. Termination</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            We reserve the right to suspend or terminate accounts that violate these terms, 
            engage in fraudulent activity, or pose a security risk. You may terminate your 
            account at any time through the Settings page.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">8. Governing Law</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            These terms are governed by the laws of the jurisdiction in which Helix operates. 
            Any disputes shall be resolved through binding arbitration in accordance with 
            applicable commercial dispute resolution procedures.
          </p>
        </section>
      </Card>
    </div>
  );
};

export default Terms;

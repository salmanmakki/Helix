import React from 'react';
import Card from '../components/Card';

export const Security: React.FC = () => {
  return (
    <div className="px-4 md:px-margin-desktop py-6 max-w-4xl mx-auto w-full space-y-gutter pb-12 text-primary font-body-lg select-none">
      <header className="border-b-4 border-primary pb-4 mb-8">
        <h2 className="font-display-lg text-2xl md:text-4xl uppercase tracking-tight">Security</h2>
        <p className="font-body-sm text-sm text-on-surface-variant mt-2">Our commitment to protecting your data</p>
      </header>

      <Card className="shadow-[8px_8px_0px_0px_var(--shadow-color)] p-8 space-y-6">
        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">Encryption</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            All data transmitted between your browser and Helix servers is encrypted using TLS 1.3 
            protocol. Data stored on our servers is encrypted at rest using AES-256. Database 
            credentials and API keys are stored in environment variables and never exposed to 
            the client.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">Authentication</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            User authentication is handled via JWT (JSON Web Tokens) with automatic expiry. 
            Passwords are hashed using bcrypt before storage. Sessions are validated on every 
            API request through protected middleware routes.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">Infrastructure</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            Helix operates on a secure cloud infrastructure with network firewalls, intrusion 
            detection systems, and regular security audits. Database access is restricted to 
            authorized services only, and all connections require mutual TLS verification.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">Data Isolation</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            User data is strictly isolated at the application layer. Every database query 
            includes user ID scoping to prevent cross-user data access. API routes are 
            protected by authentication middleware that validates user identity on every request.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">Vulnerability Management</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            We perform regular dependency audits using automated tooling to identify and patch 
            known vulnerabilities. Our team follows responsible disclosure practices. To report 
            a security issue, contact security@helixprep.com.
          </p>
        </section>

        <section>
          <h3 className="font-label-caps text-sm uppercase tracking-wider font-bold mb-3">Compliance</h3>
          <p className="text-sm leading-relaxed text-on-surface">
            Helix follows industry-standard security practices aligned with OWASP guidelines. 
            We are committed to maintaining the confidentiality, integrity, and availability of 
            your data. Regular penetration testing and security reviews are conducted to ensure 
            ongoing protection.
          </p>
        </section>
      </Card>
    </div>
  );
};

export default Security;

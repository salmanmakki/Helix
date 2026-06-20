import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-background min-h-screen text-primary select-none font-body-lg">
      {/* TopNavBar */}
      <nav className="w-full top-0 sticky bg-background border-b-2 border-primary z-50 shadow-[4px_4px_0px_0px_var(--shadow-color)] flex justify-between items-center px-4 md:px-margin-desktop py-4 max-w-container-max mx-auto">
        <div className="font-display-lg text-3xl md:text-display-lg font-black tracking-tighter text-primary">HELIX</div>
        <div className="hidden md:flex gap-8 items-center font-bold">
          <a className="text-primary border-b-2 border-primary transition-all" href="#features">Features</a>
          <a className="text-on-surface-variant hover:text-primary transition-all" href="#problem">Challenges</a>
          <a className="text-on-surface-variant hover:text-primary transition-all" href="#methodology">Methodology</a>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => navigate('/login')} className="font-label-caps text-label-caps uppercase hover:underline">Login</button>
          <Button onClick={() => navigate('/register')} className="px-6 py-2">Get Started</Button>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="px-4 md:px-margin-desktop py-12 md:py-20 max-w-container-max mx-auto grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-block bg-secondary-container text-on-secondary-container px-3 py-1 border-2 border-primary font-label-caps text-label-caps">
              PREDICT. PREPARE. PROGRESS.
            </div>
            <h1 className="font-display-lg text-4xl md:text-display-lg leading-tight">
              Predict Your Next Interview Failure <span className="bg-secondary-container text-on-secondary-container">Before It Happens.</span>
            </h1>
            <p className="text-xl font-body-lg text-on-surface-variant max-w-xl">
              Helix uses failure intelligence to identify blind spots in your technical knowledge, simulating skill decay and pinpointing high-risk topics before you step into the room.
            </p>
            <div className="flex flex-wrap gap-6">
              <Button onClick={() => navigate('/register')} className="px-8 py-4 text-lg">Run Readiness Scan</Button>
              <button onClick={() => navigate('/login')} className="bg-white border-2 border-primary shadow-[4px_4px_0px_0px_var(--shadow-color)] px-8 py-4 font-headline-md text-headline-md hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all uppercase tracking-tight">
                View Demo
              </button>
            </div>
          </div>

          {/* Hero Dashboard Preview */}
          <Card className="p-6 bg-surface">
            <div className="flex justify-between items-center mb-8 border-b-2 border-primary pb-4">
              <span className="font-label-caps text-label-caps">INTELLIGENCE DASHBOARD / V.2.4</span>
              <span className="material-symbols-outlined">more_horiz</span>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="border-2 border-primary bg-white p-6 flex flex-col items-center justify-center space-y-2 shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                <span className="font-label-caps text-[10px] text-on-surface-variant">READINESS INDEX</span>
                <div className="text-5xl font-black text-primary">74<span className="text-xl text-on-surface-variant">/100</span></div>
                <div className="w-full bg-surface-container-highest h-4 border-2 border-primary">
                  <div className="bg-secondary-container h-full w-[74%] border-r-2 border-primary"></div>
                </div>
              </div>
              <div className="border-2 border-primary bg-white p-6 space-y-4 shadow-[2px_2px_0px_0px_var(--shadow-color)]">
                <span className="font-label-caps text-[10px] text-on-surface-variant block">HIGH RISK TOPICS</span>
                <div className="space-y-2">
                  <div className="flex justify-between items-center bg-error-container p-2 border border-primary">
                    <span className="font-data-mono text-xs">DBMS</span>
                    <span className="font-data-mono text-xs font-bold text-error">CRITICAL</span>
                  </div>
                  <div className="flex justify-between items-center bg-secondary-fixed text-on-secondary-container p-2 border border-primary">
                    <span className="font-data-mono text-xs">OS</span>
                    <span className="font-data-mono text-xs font-bold text-secondary">HIGH</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-6 border-2 border-primary bg-primary-container p-4 text-white shadow-[2px_2px_0px_0px_var(--shadow-color)]">
              <div className="flex gap-4 items-center">
                <div className="p-2 bg-secondary-container text-on-secondary-container border border-primary shrink-0">
                  <span className="material-symbols-outlined">bolt</span>
                </div>
                <div>
                  <p className="font-label-caps text-[10px] text-secondary-container">PREDICTION ALERT</p>
                  <p className="font-body-sm text-[12px] text-on-primary-container">Knowledge of B-Tree indexing has decayed by 42% in the last 14 days.</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Problem Section */}
        <section id="problem" className="bg-surface-container-low py-16 md:py-24 px-4 md:px-margin-desktop border-y-2 border-primary">
          <div className="max-w-container-max mx-auto">
            <h2 className="font-display-lg text-3xl md:text-display-lg mb-16 text-center">
              Why Top Talent Still <span className="bg-secondary-fixed text-on-secondary-container px-2 border-2 border-primary">Fails.</span>
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="p-8 space-y-4 hover:-rotate-1 cursor-default">
                <div className="text-primary-fixed bg-primary w-12 h-12 flex items-center justify-center border-2 border-primary">
                  <span className="material-symbols-outlined text-on-primary">psychology_alt</span>
                </div>
                <h3 className="font-headline-lg text-2xl">Forgotten Knowledge</h3>
                <p className="text-on-surface-variant">
                  Standard prep tools don't account for Ebbinghaus' Forgetting Curve. You think you know it, until the interview starts.
                </p>
              </Card>
              <Card className="p-8 space-y-4 hover:rotate-1 cursor-default">
                <div className="text-primary-fixed bg-primary w-12 h-12 flex items-center justify-center border-2 border-primary">
                  <span className="material-symbols-outlined text-on-primary">sync_problem</span>
                </div>
                <h3 className="font-headline-lg text-2xl">Repeated Mistakes</h3>
                <p className="text-on-surface-variant">
                  Without failure intelligence, you're doomed to cycle through the same logical errors in every coding session.
                </p>
              </Card>
              <Card className="p-8 space-y-4 hover:-rotate-1 cursor-default">
                <div className="text-primary-fixed bg-primary w-12 h-12 flex items-center justify-center border-2 border-primary">
                  <span className="material-symbols-outlined text-on-primary">visibility_off</span>
                </div>
                <h3 className="font-headline-lg text-2xl">Blind Preparation</h3>
                <p className="text-on-surface-variant">
                  Most candidates study what they're already good at. Helix forces you to face the data-backed risks in your profile.
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Methodology Section */}
        <section id="methodology" className="py-16 md:py-24 px-4 md:px-margin-desktop max-w-container-max mx-auto overflow-hidden">
          <h2 className="font-display-lg text-3xl md:text-display-lg mb-20 text-center">The Helix Methodology</h2>
          <div className="relative">
            <div className="hidden lg:block absolute top-1/2 left-0 w-full h-1 bg-primary -translate-y-1/2 z-0"></div>
            <div className="grid lg:grid-cols-3 gap-12 relative z-10">
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-secondary-container text-on-secondary-container border-4 border-primary flex items-center justify-center font-black text-4xl shadow-[4px_4px_0px_0px_var(--shadow-color)]">1</div>
                <Card className="p-8 w-full">
                  <h4 className="font-headline-lg text-2xl mb-2">PREDICT</h4>
                  <p className="text-on-surface-variant">Our scanner analyzes your history to predict specific failure points in upcoming sessions.</p>
                </Card>
              </div>
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-secondary-container text-on-secondary-container border-4 border-primary flex items-center justify-center font-black text-4xl shadow-[4px_4px_0px_0px_var(--shadow-color)]">2</div>
                <Card className="p-8 w-full">
                  <h4 className="font-headline-lg text-2xl mb-2">PREPARE</h4>
                  <p className="text-on-surface-variant">Dynamic revision loops prioritize high-decay topics to solidify your foundational logic.</p>
                </Card>
              </div>
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 bg-secondary-container text-on-secondary-container border-4 border-primary flex items-center justify-center font-black text-4xl shadow-[4px_4px_0px_0px_var(--shadow-color)]">3</div>
                <Card className="p-8 w-full">
                  <h4 className="font-headline-lg text-2xl mb-2">PROGRESS</h4>
                  <p className="text-on-surface-variant">Track your readiness index as it trends toward 100% certainty before the actual interview.</p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Features Showcase Grid */}
        <section id="features" className="bg-primary py-16 md:py-24 px-4 md:px-margin-desktop border-y-2 border-primary">
          <div className="max-w-container-max mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
              <div className="max-w-2xl">
                <h2 className="font-display-lg text-3xl md:text-display-lg text-on-primary mb-6">
                  High-Performance <span className="text-secondary-fixed">Tooling.</span>
                </h2>
                <p className="text-on-primary text-xl">
                  The complete intelligence suite for those who refuse to leave their career to chance.
                </p>
              </div>
              <Button onClick={() => navigate('/register')} className="px-8 py-3">Explore All Features</Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: 'history', title: 'Skill Decay Engine', text: 'Visualizes how your technical knowledge erodes over time based on active recall gaps.' },
                { icon: 'analytics', title: 'Readiness Index', text: 'A singular, data-backed score that predicts your probability of clear-cut success.' },
                { icon: 'radar', title: 'Risk Scanner', text: 'Scans your practice logs to identify logical fallacies and conceptual misunderstandings.' },
                { icon: 'troubleshoot', title: 'Failure Intelligence', text: 'Post-mortem analysis of every failed mock interview to extract actionable patterns.' },
                { icon: 'leaderboard', title: 'Preparation Analytics', text: 'Deep dive into time-to-solution, code quality, and efficiency metrics across subjects.' },
                { icon: 'auto_fix_high', title: 'Recommendation Engine', text: 'AI-driven path correction that adjusts your study schedule based on performance peaks.' }
              ].map((feature, i) => (
                <div key={i} className="bg-primary-container border-2 border-outline p-8 space-y-4 hover:border-secondary-fixed transition-colors">
                  <span className="material-symbols-outlined text-secondary-fixed text-4xl">{feature.icon}</span>
                  <h4 className="font-headline-md text-xl text-white">{feature.title}</h4>
                  <p className="text-on-primary-container text-sm">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics Section */}
        <section className="py-16 md:py-24 px-4 md:px-margin-desktop max-w-container-max mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
            {[
              { value: '12K+', label: 'Students Tracked' },
              { value: '1.4M', label: 'Skills Analyzed' },
              { value: '850K', label: 'Failure Reports' },
              { value: '98%', label: 'Accuracy Rate' }
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-2">
                <div className="font-display-lg text-4xl md:text-display-lg font-black tabular-nums">{stat.value}</div>
                <div className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="px-4 md:px-margin-desktop pb-16 md:pb-24 max-w-container-max mx-auto">
          <Card className="bg-secondary-container text-on-secondary-container p-12 md:p-20 flex flex-col items-center text-center space-y-8">
            <h2 className="font-display-lg text-4xl md:text-display-lg">Stop Guessing. <br />Start Predicting.</h2>
            <p className="font-headline-md text-xl max-w-2xl">Join the elite 1% of candidates who use data to guarantee their next career breakthrough.</p>
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <button 
                onClick={() => navigate('/register')} 
                className="bg-primary text-on-primary px-10 py-4 font-label-caps text-label-caps border-2 border-primary shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_rgba(255,255,255,1)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase"
              >
                Get Started For Free
              </button>
              <button 
                onClick={() => navigate('/login')} 
                className="bg-white text-on-surface px-10 py-4 font-label-caps text-label-caps border-2 border-primary shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase"
              >
                Schedule Strategy Session
              </button>
            </div>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-tertiary border-t-2 border-primary w-full">
        <div className="flex flex-col md:flex-row justify-between items-center px-4 md:px-margin-desktop py-12 max-w-container-max mx-auto gap-8">
          <div className="space-y-4 text-center md:text-left text-white">
            <div className="font-headline-md text-2xl font-black">HELIX</div>
            <div className="font-data-mono text-xs uppercase text-white/70">© 2026 HELIX PREPARATION INTELLIGENCE. ALL RIGHTS RESERVED.</div>
          </div>
          <div className="flex flex-wrap justify-center gap-8 font-data-mono text-xs uppercase">
            <Link className="text-white/70 hover:text-secondary-fixed transition-colors" to="/privacy">Privacy Policy</Link>
            <Link className="text-white/70 hover:text-secondary-fixed transition-colors" to="/terms">Terms of Service</Link>
            <Link className="text-white/70 hover:text-secondary-fixed transition-colors" to="/security">Security</Link>
            <a className="text-white/70 hover:text-secondary-fixed transition-colors" href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

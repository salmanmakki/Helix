import React, { useState } from 'react';
import Card from '../components/Card';
import Button from '../components/Button';

export const Settings: React.FC = () => {
  const [emailDigest, setEmailDigest] = useState(true);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [autoDecay, setAutoDecay] = useState(true);

  const handleSaveSettings = () => {
    alert('Settings successfully synced to local configurations.');
  };

  return (
    <div className="px-4 md:px-margin-desktop py-6 max-w-2xl mx-auto w-full space-y-gutter pb-12 text-primary font-body-lg select-none">
      <header className="border-b-4 border-primary pb-4 mb-8">
        <h2 className="font-display-lg text-2xl md:text-4xl uppercase tracking-tight">System Settings</h2>
        <p className="font-body-sm text-sm text-on-surface-variant mt-2">Adjust cognitive alert parameters and active recall synchronization variables.</p>
      </header>

      <Card className="shadow-[8px_8px_0px_0px_var(--shadow-color)] p-6 space-y-6">
        <h3 className="font-label-caps text-label-caps uppercase tracking-wider border-b-2 border-primary pb-2 font-bold">Alert Rules</h3>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-3 border-2 border-primary bg-surface-container-low cursor-pointer hover:bg-white transition-all select-none">
            <div>
              <p className="font-bold text-sm uppercase">Daily Summary Digest</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">Receive daily decay analysis reports and remediation checklists via email.</p>
            </div>
            <input 
              type="checkbox" 
              checked={emailDigest}
              onChange={() => setEmailDigest(!emailDigest)}
              className="w-6 h-6 border-2 border-primary text-primary focus:ring-0 rounded-none cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 border-2 border-primary bg-surface-container-low cursor-pointer hover:bg-white transition-all select-none">
            <div>
              <p className="font-bold text-sm uppercase">Critical Threat warnings</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">Trigger immediate desktop notifications when skill retention drops below 50%.</p>
            </div>
            <input 
              type="checkbox" 
              checked={criticalAlerts}
              onChange={() => setCriticalAlerts(!criticalAlerts)}
              className="w-6 h-6 border-2 border-primary text-primary focus:ring-0 rounded-none cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 border-2 border-primary bg-surface-container-low cursor-pointer hover:bg-white transition-all select-none">
            <div>
              <p className="font-bold text-sm uppercase">Auto Ebbinghaus Calculations</p>
              <p className="text-[11px] text-on-surface-variant mt-0.5">Allow the daily backend decay cron job to adjust effective scores dynamically.</p>
            </div>
            <input 
              type="checkbox" 
              checked={autoDecay}
              onChange={() => setAutoDecay(!autoDecay)}
              className="w-6 h-6 border-2 border-primary text-primary focus:ring-0 rounded-none cursor-pointer"
            />
          </label>
        </div>

        <div className="pt-4 flex gap-4">
          <Button onClick={handleSaveSettings} className="w-full py-3">
            Save System Configurations
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default Settings;

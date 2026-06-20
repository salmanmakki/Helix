import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/Card';
import type { RiskScanResult } from '../types';

export const RiskScanner: React.FC = () => {
  const { data: riskScan, isLoading, isRefetching, refetch } = useQuery<RiskScanResult>({
    queryKey: ['risk-scan'],
    queryFn: async () => {
      const res = await api.get('/risk');
      return res.data;
    }
  });

  const handleScanTrigger = () => {
    refetch();
  };

  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [explaining, setExplaining] = useState(false);
  const [alertDismissed, setAlertDismissed] = useState(false);

  useEffect(() => {
    if (riskScan) {
      setAlertDismissed(false);
    }
  }, [riskScan]);

  const highRiskDetected = riskScan
    ? riskScan.threatLevel === 'critical' ||
      riskScan.criticalRisks?.some(r => r.status === 'critical') ||
      riskScan.allModules?.some(m => m.status === 'CRITICAL') ||
      (riskScan.probabilityOfFailure ?? 0) > 60
    : false;

  const generateExplanation = async () => {
    setExplaining(true);
    setAiExplanation(null);
    try {
      const res = await api.post('/ai/explain-risk');
      setAiExplanation(res.data.explanation);
    } catch {
      setAiExplanation('AI explanation is not available. Ensure GEMINI_API_KEY is configured.');
    } finally {
      setExplaining(false);
    }
  };

  const isScanning = isLoading || isRefetching;
  const noData = !riskScan;

  return (
    <div className="px-4 md:px-margin-desktop py-6 max-w-container-max mx-auto w-full space-y-gutter pb-12 text-primary font-body-lg select-none">
      <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="font-label-caps text-secondary font-bold mb-2 flex items-center gap-2 text-xs tracking-wider">
            <span className={`material-symbols-outlined text-[16px] ${isScanning ? 'animate-spin' : ''}`}>radar</span>
            {isScanning ? 'SCANNING REAL-TIME DATASETS' : 'RISK ASSESSMENT READY'}
          </div>
          <h1 className="font-display-lg text-2xl md:text-display-lg text-primary">
            Your Biggest <span className="text-risk-high underline decoration-primary underline-offset-4">Interview Risks</span>
          </h1>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border-2 border-primary p-4 shadow-[4px_4px_0px_0px_var(--shadow-color)] flex flex-col items-center justify-center min-w-[140px]">
            <span className="font-label-caps text-[9px] text-on-surface-variant tracking-wider uppercase font-bold">THREAT LEVEL</span>
            <span className="font-data-mono text-lg font-bold text-risk-high animate-risk-pulse uppercase mt-1">
              {riskScan?.threatLevel ?? 'N/A'}
            </span>
          </div>
        </div>
      </header>

      {!alertDismissed && highRiskDetected && !isScanning && riskScan && (
        <div className="relative bg-error-container border-2 border-error p-4 shadow-[8px_8px_0px_0px_var(--shadow-color)] flex items-start gap-4 mb-8">
          <span className="material-symbols-outlined text-error text-3xl shrink-0 mt-0.5">notification_important</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm uppercase tracking-wider text-error">
              {riskScan.threatLevel === 'critical'
                ? 'CRITICAL RISK ALERT'
                : 'HIGH RISK / DECAY DETECTED'}
            </p>
            <p className="font-body-sm text-sm mt-1">
              {riskScan.criticalRisks?.some(r => r.status === 'critical')
                ? `${riskScan.criticalRisks.filter(r => r.status === 'critical').length} skill(s) at critical risk level. `
                : ''}
              {riskScan.allModules?.some(m => m.status === 'CRITICAL')
                ? `${riskScan.allModules.filter(m => m.status === 'CRITICAL').length} module(s) showing active decay. `
                : ''}
              {riskScan.probabilityOfFailure > 60
                ? `Probability of failure is at ${riskScan.probabilityOfFailure}%. `
                : ''}
              Immediate attention recommended.
            </p>
          </div>
          <button
            onClick={() => setAlertDismissed(true)}
            className="shrink-0 text-error hover:text-on-error-container transition-colors"
            aria-label="Dismiss alert"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
      )}

      {isScanning ? (
        <div className="border-4 border-dashed border-primary p-12 text-center bg-white shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <span className="material-symbols-outlined text-5xl mb-4 animate-spin-reverse inline-block">sync</span>
          <p className="font-label-caps text-label-caps font-bold">RUNNING SYSTEM DIAGNOSTICS & DECAY MAPS...</p>
        </div>
      ) : noData ? (
        <div className="border-4 border-dashed border-primary p-16 text-center bg-white shadow-[8px_8px_0px_0px_var(--shadow-color)]">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30 mb-4 block">radar</span>
          <p className="font-headline-md text-xl font-bold mb-2">No Risk Data Yet</p>
          <p className="font-body-sm text-sm text-on-surface-variant max-w-md mx-auto">
            Log interview failures and revisions to generate your personalized risk analysis.
          </p>
          <button
            onClick={handleScanTrigger}
            className="mt-8 bg-primary text-on-primary font-bold px-8 py-3 border-2 border-primary shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-widest font-label-caps text-sm"
          >
            RUN INITIAL SCAN
          </button>
        </div>
      ) : (
        <>
          {riskScan.criticalRisks && riskScan.criticalRisks.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-12">
              {riskScan.criticalRisks.map((item, index) => {
                const riskPercentage = Math.round(100 - item.score);
                const strokeDashOffset = 251.2 - (251.2 * riskPercentage) / 100;
                const isCritical = item.status === 'critical';
                
                return (
                  <Card 
                    key={index} 
                    className="p-6 relative overflow-hidden group shadow-[8px_8px_0px_0px_var(--shadow-color)]"
                  >
                    <div className={`absolute top-0 right-0 ${isCritical ? 'bg-risk-high' : 'bg-secondary-container'} text-on-secondary-container px-4 py-1 font-label-caps text-[10px] border-l-2 border-b-2 border-primary z-10 font-bold uppercase`}>
                      {isCritical ? 'CRITICAL RISK' : 'HIGH PRIORITY'}
                    </div>

                    <div className="flex items-start justify-between mb-8 mt-2">
                      <div>
                        <h2 className="font-headline-lg text-2xl font-bold uppercase mb-1">{item.name}</h2>
                      </div>

                      <div className="relative w-24 h-24 shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle className="text-surface-container-high" cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeWidth="8"></circle>
                          <circle className={isCritical ? 'text-risk-high' : 'text-primary'} cx="48" cy="48" fill="transparent" r="40" stroke="currentColor" strokeDasharray="251.2" strokeDashoffset={strokeDashOffset} strokeWidth="8"></circle>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="font-data-mono text-lg font-bold">{riskPercentage}%</span>
                        </div>
                      </div>
                    </div>

                    {item.diagnostics && item.diagnostics.length > 0 && (
                      <div className="bg-surface-container-low border-2 border-primary p-4 mb-6">
                        <div className="font-label-caps text-[10px] text-on-surface-variant font-bold tracking-wider mb-2">FAILURE DIAGNOSTICS</div>
                        <ul className="space-y-1">
                          {item.diagnostics.map((diag, dIdx) => (
                            <li key={dIdx} className="flex items-center gap-2 font-data-mono text-xs uppercase">
                              <span className={`material-symbols-outlined text-[16px] ${isCritical ? 'text-risk-high' : 'text-primary'}`}>
                                {isCritical ? 'error' : 'warning'}
                              </span>
                              {diag}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
            <div className="bg-secondary-container border-2 border-primary shadow-[8px_8px_0px_0px_var(--shadow-color)] p-6 flex flex-col justify-between min-h-[140px]">
              <span className="material-symbols-outlined text-[40px] text-on-secondary-container">psychology_alt</span>
              <div>
                <div className="font-label-caps text-[10px] text-on-secondary-container font-bold">COGNITIVE LOAD</div>
                <div className="font-headline-md text-lg font-black uppercase">{riskScan.cognitiveLoad ?? 'N/A'}</div>
              </div>
            </div>
            <div className="bg-primary text-on-primary border-2 border-primary shadow-[8px_8px_0px_0px_var(--shadow-color)] p-6 flex flex-col justify-between md:col-span-2 min-h-[140px]">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-label-caps text-xs text-on-primary font-bold">PROBABILITY OF FAILURE (POF)</div>
                  <div className="font-display-lg text-3xl font-black text-on-primary mt-1">{riskScan.probabilityOfFailure ?? 'N/A'}</div>
                </div>
                <span className="material-symbols-outlined text-secondary-container text-[40px] font-bold">trending_up</span>
              </div>
              {riskScan.pofDescription && (
                <p className="font-data-mono text-[11px] mt-4 opacity-75 leading-relaxed uppercase">
                  {riskScan.pofDescription}
                </p>
              )}
            </div>
          </div>

          {riskScan.allModules && riskScan.allModules.length > 0 && (
            <div className="mt-12 border-2 border-primary bg-white p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)]">
              <div className="font-label-caps text-sm text-primary mb-6 border-b-2 border-primary pb-2 flex justify-between items-center font-bold uppercase tracking-wider">
                MINOR CONCERNS & DECAY TRACKER
                <span className="material-symbols-outlined cursor-pointer hover:text-secondary">filter_list</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="font-label-caps text-[10px] text-on-surface-variant border-b-2 border-primary/20">
                      <th className="py-2 px-4 uppercase font-bold">MODULE</th>
                      <th className="py-2 px-4 uppercase font-bold">RISK SCORE</th>
                      <th className="py-2 px-4 uppercase font-bold">LAST REVISION</th>
                      <th className="py-2 px-4 uppercase font-bold">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="font-data-mono text-xs">
                    {riskScan.allModules.map((item, idx) => (
                      <tr key={idx} className="border-b border-primary/10 hover:bg-surface-container-low transition-colors">
                        <td className="py-4 px-4 font-bold text-sm text-primary">{item.module}</td>
                        <td className="py-4 px-4">{item.riskScore}%</td>
                        <td className="py-4 px-4 uppercase">{item.lastRevision}</td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 border font-bold ${
                            item.status === 'CRITICAL' ? 'bg-error-container text-on-error-container border-error' :
                            item.status === 'CAUTION' ? 'bg-secondary-container text-on-secondary-container border-secondary' :
                            'bg-green-100 text-green-800 border-green-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {riskScan.recommendations && riskScan.recommendations.length > 0 && (
            <div className="mt-12 border-2 border-primary bg-white p-6 shadow-[8px_8px_0px_0px_var(--shadow-color)]">
              <div className="font-label-caps text-sm text-primary mb-6 border-b-2 border-primary pb-2 flex items-center gap-2 font-bold uppercase tracking-wider">
                <span className="material-symbols-outlined text-primary">assignment</span>
                RECOMMENDED ACTIONS
              </div>
              <ul className="space-y-3">
                {riskScan.recommendations.flatMap((rec) =>
                  rec.split('. ').filter(Boolean).map((point, i) => {
                    const trimmed = point.replace(/\.+$/, '').trim();
                    return (
                      <li key={`${rec}-${i}`} className="flex items-start gap-3 font-body-sm text-sm">
                        <span className="material-symbols-outlined text-sm text-primary shrink-0 mt-0.5">chevron_right</span>
                        <span>{trimmed}.</span>
                      </li>
                    );
                  })
                )}
              </ul>
            </div>
          )}

          {aiExplanation && (
            <div className="mt-12 bg-white border-2 border-primary shadow-[8px_8px_0px_0px_var(--shadow-color)] p-8">
              <div className="flex items-center gap-3 mb-6 border-b-2 border-primary pb-4">
                <span className="material-symbols-outlined text-primary text-2xl">auto_awesome</span>
                <h3 className="font-headline-md text-xl font-black uppercase">AI Risk Analysis</h3>
              </div>
              <div className="max-h-72 overflow-y-auto font-body-sm text-sm space-y-3 pr-2">
                {(() => {
                  const lines = aiExplanation.split('\n').filter((l: string) => l.trim());
                  const sections: { heading: string; points: string[] }[] = [];
                  let currentHeading = '';
                  let currentPoints: string[] = [];
                  lines.forEach((line: string) => {
                    const headingMatch = line.match(/^\*\*(.+?)\*\*/);
                    if (headingMatch) {
                      if (currentHeading) sections.push({ heading: currentHeading, points: currentPoints });
                      currentHeading = headingMatch[1];
                      currentPoints = [];
                      const rest = line.replace(/^\*\*.+?\*\*/, '').trim();
                      if (rest) currentPoints.push(rest);
                    } else {
                      const cleaned = line.replace(/^[-*]\s*/, '').trim();
                      if (cleaned) currentPoints.push(cleaned);
                    }
                  });
                  if (currentHeading) sections.push({ heading: currentHeading, points: currentPoints });
                  return sections.map((s, i) => (
                    <div key={i}>
                      <p className="font-bold text-sm text-primary uppercase tracking-wider mb-1.5">{s.heading}</p>
                      <ul className="space-y-1 ml-1">
                        {s.points.map((p, j) => (
                          <li key={j} className="flex items-start gap-2">
                            <span className="text-primary/40 mt-1 shrink-0">•</span>
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          <div className="mt-12 flex justify-center gap-4 flex-wrap">
            <button
              onClick={generateExplanation}
              disabled={explaining}
              className="bg-secondary-container text-on-secondary-container font-bold px-8 py-4 border-2 border-primary shadow-[4px_4px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all uppercase tracking-widest font-label-caps text-sm"
            >
              {explaining ? 'GENERATING...' : 'GENERATE AI EXPLANATION'}
            </button>
            <button 
              onClick={handleScanTrigger}
              className="bg-primary text-on-primary font-bold px-12 py-4 border-2 border-primary shadow-[8px_8px_0px_0px_var(--shadow-color)] hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none hover:shadow-[6px_6px_0px_0px_var(--shadow-color)] transition-all uppercase tracking-widest font-label-caps text-sm"
            >
              INITIALIZE FULL SYSTEM RECOVERY
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RiskScanner;

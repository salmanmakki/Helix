import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import Card from '../components/Card';
import MetricCard from '../components/MetricCard';
import type { ActionPlan, Revision } from '../types';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDifficulty, setNewTaskDifficulty] = useState<'EASY' | 'MED' | 'HARD'>('MED');

  const { data: readiness } = useQuery({
    queryKey: ['readiness'],
    queryFn: async () => {
      const res = await api.get('/readiness');
      return res.data;
    }
  });

  const { data: risk } = useQuery({
    queryKey: ['risk'],
    queryFn: async () => {
      const res = await api.get('/risk');
      return res.data;
    }
  });

  const { data: skills } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await api.get('/skills');
      return res.data;
    }
  });

  const { data: analytics } = useQuery({
    queryKey: ['dashboardAnalytics'],
    queryFn: async () => {
      const res = await api.get('/analytics/dashboard');
      return res.data;
    }
  });

  const { data: latestSnapshot } = useQuery({
    queryKey: ['latestSnapshot'],
    queryFn: async () => {
      const res = await api.get('/analytics/snapshots/latest');
      return res.data;
    }
  });

  const { data: revisions } = useQuery({
    queryKey: ['revisions'],
    queryFn: async () => {
      const res = await api.get('/revisions');
      return res.data;
    }
  });

  const { data: failures } = useQuery({
    queryKey: ['failures'],
    queryFn: async () => {
      const res = await api.get('/failures');
      return res.data;
    }
  });

  const { data: plan } = useQuery<ActionPlan>({
    queryKey: ['actionPlan'],
    queryFn: async () => {
      const res = await api.get('/action-plans');
      return res.data;
    }
  });

  const { data: aiInsights, isLoading: aiLoading } = useQuery({
    queryKey: ['dashboardAiInsights'],
    queryFn: async () => {
      const res = await api.get('/ai/dashboard-insights');
      return res.data;
    },
    retry: false
  });

  const toggleMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await api.patch(`/action-plans/tasks/${taskId}/toggle`);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['actionPlan'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['suggestedTasks'] });
      if (data?.revision) {
        queryClient.setQueryData<Revision[]>(['revisions'], (old) => [data.revision, ...(old ?? [])]);
      }
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await api.delete(`/action-plans/tasks/${taskId}`);
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actionPlan'] })
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ taskId, order }: { taskId: string; order: number }) => {
      const res = await api.put(`/action-plans/tasks/${taskId}`, { order });
      return res.data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['actionPlan'] })
  });

  const { data: suggestedTasks } = useQuery({
    queryKey: ['suggestedTasks'],
    queryFn: async () => {
      const res = await api.get('/ai/suggested-tasks');
      return res.data;
    },
    retry: false
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/readiness/recalculate');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['risk'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      queryClient.invalidateQueries({ queryKey: ['latestSnapshot'] });
      queryClient.invalidateQueries({ queryKey: ['suggestedTasks'] });
    }
  });

  const addTaskMutation = useMutation({
    mutationFn: async (taskData: { text: string; duration?: string; difficulty?: string }) => {
      const res = await api.post('/action-plans/tasks', taskData);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['actionPlan'] });
      setNewTaskText('');
      setShowAddTask(false);
      setNewTaskDifficulty('MED');
    },
    onError: (err: any) => {
      console.error('Add task failed:', err.response?.data || err.message);
      alert('Failed to add task: ' + (err.response?.data?.message || err.message));
    }
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    addTaskMutation.mutate({ text: newTaskText.trim(), difficulty: newTaskDifficulty });
  };

  const tasks = (plan?.tasks ?? []).slice().sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const hasReadiness = readiness && readiness.overallScore !== undefined && readiness.overallScore !== null;
  const readinessScore = hasReadiness ? readiness.overallScore : null;
  const threatLevel = readiness?.threatLevel ?? 'low';

  const skillHealth = analytics?.efficiencyRate || (skills && skills.length > 0
    ? `${(skills.reduce((acc: number, curr: any) => acc + curr.effectiveScore, 0) / skills.length).toFixed(1)}%`
    : 'N/A');

  const riskScore = latestSnapshot?.riskScore !== undefined
    ? `${Number(latestSnapshot.riskScore).toFixed(1)}%`
    : (risk?.allModules && risk.allModules.length > 0
      ? `${(risk.allModules.reduce((acc: number, curr: any) => acc + curr.riskScore, 0) / risk.allModules.length).toFixed(1)}%`
      : 'N/A');

  const streakValue = latestSnapshot?.streak !== undefined
    ? `${latestSnapshot.streak} ${latestSnapshot.streak === 1 ? 'DAY' : 'DAYS'}`
    : 'N/A';
  const confidenceValue = latestSnapshot?.confidenceScore !== undefined
    ? `${latestSnapshot.confidenceScore}% · ${latestSnapshot.confidenceLevel}`
    : 'N/A';

  const criticalItems = risk?.criticalRisks ?? [];

  const recentActivities = [
    ...((Array.isArray(revisions) ? revisions : []).slice(0, 3).map((revision: any) => ({
      kind: 'revision',
      timestamp: revision.date || revision.createdAt,
      title: revision.skill?.name || revision.revisionType || 'Revision logged',
      description: `Score ${revision.recallScore ?? revision.score ?? 0}% · ${revision.duration} mins · ${revision.difficulty}`,
      tone: 'positive'
    }))),
    ...((Array.isArray(failures) ? failures : []).slice(0, 3).map((failure: any) => ({
      kind: 'failure',
      timestamp: failure.date || failure.createdAt,
      title: `${failure.company} · ${failure.topic}`,
      description: `${failure.role} · ${failure.primaryReason}`,
      tone: 'warning'
    })))
  ]
    .filter((item) => item.timestamp)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 4);

  const formatTimestamp = (timestamp: string | Date) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div className="px-4 md:px-margin-desktop py-6 max-w-container-max mx-auto w-full space-y-gutter select-none pb-12 font-body-lg text-primary">
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <Card className="lg:col-span-2 p-8 relative flex flex-col md:flex-row gap-8 items-center bg-white">
          <div className="absolute -right-10 -top-10 opacity-5 pointer-events-none text-primary">
            <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
          </div>
          
          <div className="flex-1 space-y-4 z-10">
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 border-2 border-primary font-label-caps text-label-caps inline-block">
              QUARTERLY OVERVIEW
            </span>
            <h2 className="font-display-lg text-2xl md:text-5xl font-black">Readiness Index</h2>
            <div className="flex items-baseline gap-4">
              {hasReadiness ? (
                <span className="font-black text-4xl md:text-6xl font-display-lg">{readinessScore}<span className="text-xl md:text-3xl opacity-50">/100</span></span>
              ) : (
                <span className="font-black text-4xl md:text-6xl font-display-lg text-on-surface-variant">N/A</span>
              )}
            </div>
            <p className="font-body-lg text-on-surface-variant max-w-md">
              {hasReadiness
                ? `Your current readiness score is ${readinessScore}/100. Keep logging revisions to track improvement.`
                : 'Start logging interviews and revisions to generate your readiness index.'}
            </p>
          </div>

          <div className="w-full md:w-64 bg-surface-container border-2 border-primary p-6 space-y-4 shadow-[4px_4px_0px_0px_var(--shadow-color)]">
            <p className="font-label-caps text-[10px] text-on-surface-variant tracking-wider">CURRENT STATUS</p>
            <div className="space-y-1">
              {hasReadiness ? (
                <>
                  <h3 className="font-headline-lg text-lg uppercase font-black text-secondary">
                    {threatLevel === 'critical' ? 'CRITICAL RISK' : threatLevel === 'medium' ? 'MODERATE RISK' : 'LOW RISK'}
                  </h3>
                  <div className="w-full bg-black/10 h-3 border border-primary">
                    <div className="bg-secondary-container h-full" style={{ width: `${readinessScore}%` }}></div>
                  </div>
                </>
              ) : (
                <p className="font-body-sm text-on-surface-variant text-xs">No readiness data yet. Complete a scan to begin.</p>
              )}
            </div>
            <button 
              onClick={() => navigate('/risk-scanner')}
              className="w-full bg-primary text-on-primary py-3 border-2 border-primary font-label-caps text-label-caps hover:translate-x-[2px] hover:translate-y-[2px] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none shadow-[4px_4px_0px_0px_rgba(112,93,0,1)] transition-all uppercase"
            >
              VIEW FULL AUDIT
            </button>
            <button
              onClick={() => recalculateMutation.mutate()}
              disabled={recalculateMutation.isPending}
              className="w-full border-2 border-primary py-2 font-label-caps text-[10px] hover:bg-surface-container transition-colors uppercase mt-2"
            >
              {recalculateMutation.isPending ? 'RECALCULATING...' : 'RECALCULATE READINESS'}
            </button>
          </div>
        </Card>

        <div className="bg-white border-2 border-primary p-6 shadow-[8px_8px_0px_0px_rgba(186,26,26,1)] flex flex-col justify-between">
          <h3 className="font-label-caps text-label-caps mb-6 flex justify-between items-center text-error font-bold">
            CRITICAL FAILURES
            <span className="material-symbols-outlined text-error">warning</span>
          </h3>

          <div className="flex-1 space-y-4">
            {criticalItems.length > 0 ? (
              criticalItems.map((item: any, idx: number) => {
                const riskPct = item.score ? Math.round(100 - item.score) : 0;
                const isCritical = riskPct > 75;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between font-data-mono text-xs">
                      <span>{item.name}</span>
                      <span className={`${isCritical ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                        {riskPct}% RISK
                      </span>
                    </div>
                    <div className={`h-2 border border-primary overflow-hidden ${isCritical ? 'bg-error-container' : 'bg-surface-container'}`}>
                      <div
                        className={`h-full ${isCritical ? 'bg-error' : 'bg-primary'}`}
                        style={{ width: `${riskPct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="border-2 border-dashed border-primary p-4 text-sm text-on-surface-variant bg-surface-container-low">
                No critical failures in the latest scan.
              </div>
            )}
          </div>

          <button 
            onClick={() => navigate('/skills')}
            className="mt-6 border-2 border-primary py-2 font-label-caps text-label-caps hover:bg-primary hover:text-on-primary transition-colors text-center w-full uppercase"
          >
            GENERATE REMEDIATION
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
        <MetricCard title="SKILL HEALTH" value={skillHealth} trend={`${skills?.length ?? 0} skills tracked`} trendDirection="neutral" />
        <MetricCard title="RISK SCORE" value={riskScore} trend={`${risk?.recentFailuresCount ?? 0} recent failures`} trendDirection="neutral" />
        <MetricCard title="STREAK" value={streakValue} trend={latestSnapshot?.timestamp ? `Snapshot ${formatTimestamp(latestSnapshot.timestamp)}` : 'No snapshot yet'} trendDirection="neutral" />
        <MetricCard title="CONFIDENCE" value={confidenceValue} trend={readiness?.threatLevel ? `${readiness.threatLevel} threat level` : 'No readiness data'} trendDirection="neutral" />
      </section>

      {aiInsights && !aiLoading && (
        <section>
          <div className="border-b-4 border-primary pb-4 mb-8">
            <h2 className="font-display-lg text-2xl md:text-4xl uppercase tracking-tight">AI Intelligence</h2>
            <p className="font-body-sm text-sm text-on-surface-variant mt-2">Personalized insights generated from your preparation data.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-gutter">
            <Card className="p-5 flex flex-col gap-3 shadow-[4px_4px_0px_0px_var(--shadow-color)]">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined">psychology</span>
                <span className="font-label-caps text-[10px] font-bold uppercase">Forgotten Skills</span>
              </div>
              {aiInsights.forgottenSkills?.length > 0 ? (
                <div className="space-y-3">
                  {aiInsights.forgottenSkills.slice(0, 3).map((s: any, i: number) => (
                    <div key={i} className="text-xs border-b border-outline-variant pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold uppercase">{s.skillName}</span>
                        <span className={`font-data-mono ${s.urgency === 'high' ? 'text-error' : 'text-secondary'}`}>
                          -{s.decayPercent}%
                        </span>
                      </div>
                      {s.observation && <p className="text-on-surface-variant text-[10px] mb-0.5">{s.observation}</p>}
                      {s.impact && <p className="text-on-surface-variant/70 text-[9px] italic">{s.impact}</p>}
                      {s.recommendation && <p className="text-primary mt-0.5 font-bold text-[9px]">{s.recommendation}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">No forgotten skills detected.</p>
              )}
            </Card>

            <Card className="p-5 flex flex-col gap-3 shadow-[4px_4px_0px_0px_var(--shadow-color)]">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined">warning</span>
                <span className="font-label-caps text-[10px] font-bold uppercase">High Risk Topics</span>
              </div>
              {aiInsights.highRiskTopics?.length > 0 ? (
                <div className="space-y-3">
                  {aiInsights.highRiskTopics.slice(0, 3).map((t: any, i: number) => (
                    <div key={i} className="text-xs border-b border-outline-variant pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold uppercase">{t.topic}</span>
                        <span className="font-data-mono text-error">{t.failureCount}x failed</span>
                      </div>
                      {t.observation && <p className="text-on-surface-variant text-[10px] mb-0.5">{t.observation}</p>}
                      {t.impact && <p className="text-on-surface-variant/70 text-[9px] italic">{t.impact}</p>}
                      {t.recommendation && <p className="text-primary mt-0.5 font-bold text-[9px]">{t.recommendation}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">No high risk topics found.</p>
              )}
            </Card>

            <Card className="p-5 flex flex-col gap-3 shadow-[4px_4px_0px_0px_var(--shadow-color)]">
              <div className="flex items-center gap-2 text-secondary">
                <span className="material-symbols-outlined">schedule</span>
                <span className="font-label-caps text-[10px] font-bold uppercase">Revision Reminders</span>
              </div>
              {aiInsights.revisionReminders?.length > 0 ? (
                <div className="space-y-3">
                  {aiInsights.revisionReminders.slice(0, 3).map((r: any, i: number) => (
                    <div key={i} className="text-xs border-b border-outline-variant pb-2">
                      <span className="font-bold uppercase">{r.skillName}</span>
                      {r.observation && <p className="text-on-surface-variant text-[10px] mt-0.5 mb-0.5">{r.observation}</p>}
                      {r.impact && <p className="text-on-surface-variant/70 text-[9px] italic mb-0.5">{r.impact}</p>}
                      {r.recommendation && <p className="text-primary mt-0.5 font-bold text-[9px]">{r.recommendation}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">No revision reminders.</p>
              )}
            </Card>

            <Card className="p-5 flex flex-col gap-3 shadow-[4px_4px_0px_0px_var(--shadow-color)]">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined">corporate_fare</span>
                <span className="font-label-caps text-[10px] font-bold uppercase">Company Warnings</span>
              </div>
              {aiInsights.companySpecificWarnings?.length > 0 ? (
                <div className="space-y-3">
                  {aiInsights.companySpecificWarnings.slice(0, 3).map((w: any, i: number) => (
                    <div key={i} className="text-xs border-b border-outline-variant pb-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold uppercase">{w.company}</span>
                        <span className={`font-data-mono ${w.severity === 'high' ? 'text-error' : 'text-secondary'}`}>
                          {w.failureCount}x failed
                        </span>
                      </div>
                      {w.observation && <p className="text-on-surface-variant text-[10px] mb-0.5">{w.observation}</p>}
                      {w.impact && <p className="text-on-surface-variant/70 text-[9px] italic mb-0.5">{w.impact}</p>}
                      {w.recommendation && <p className="text-primary mt-0.5 font-bold text-[9px]">{w.recommendation}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-on-surface-variant">No company warnings.</p>
              )}
            </Card>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
        <div className="lg:col-span-2 bg-white border-2 border-primary shadow-[8px_8px_0px_0px_var(--shadow-color)] flex flex-col overflow-hidden max-h-[600px]">
          <div className="border-b-2 border-primary p-6 flex justify-between items-center bg-secondary-fixed text-on-secondary-container">
            <h3 className="font-headline-md text-base md:text-xl uppercase font-black">PRIORITY ACTION PLAN</h3>
            <span className="font-data-mono text-xs bg-white text-primary px-2 border-2 border-primary font-bold">
              {tasks.filter(t => !t.completed).length} TASKS PENDING
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div 
                    key={task._id}
                    className={`group flex items-center gap-4 p-4 border-2 border-primary transition-all ${
                      task.completed ? 'opacity-50 bg-surface-container-highest' : 'bg-surface-container-low hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-4 w-full">
                      <input 
                        type="checkbox"
                        checked={task.completed}
                        onChange={() => toggleMutation.mutate(task._id)}
                        className="w-6 h-6 border-2 border-primary text-primary focus:ring-0 rounded-none cursor-pointer mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0 flex-1">
                            <p className={`font-headline-md text-lg font-bold leading-none break-words ${task.completed ? 'line-through' : ''}`}>
                              {task.text}
                            </p>
                            <p className="font-label-caps text-[10px] text-on-surface-variant mt-1.5 uppercase">
                              ESTIMATED: {task.duration} • DIFFICULTY: {task.difficulty}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="font-data-mono text-xs px-2 py-1 border-2 border-primary bg-white font-bold">
                              {task.difficulty === 'HARD' ? 'HIGH' : task.difficulty === 'MED' ? 'MED' : 'LOW'}
                            </span>
                            <button
                              type="button"
                              aria-label="Move task up"
                              onClick={() => reorderMutation.mutate({ taskId: task._id, order: Math.max(0, (task.order || 0) - 1) })}
                              className="w-8 h-8 flex items-center justify-center bg-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                            >
                              <span className="text-sm font-bold leading-none">▲</span>
                            </button>
                            <button
                              type="button"
                              aria-label="Move task down"
                              onClick={() => reorderMutation.mutate({ taskId: task._id, order: (task.order || 0) + 1 })}
                              className="w-8 h-8 flex items-center justify-center bg-transparent text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
                            >
                              <span className="text-sm font-bold leading-none">▼</span>
                            </button>
                            <button
                              type="button"
                              aria-label="Delete task"
                              onClick={() => deleteMutation.mutate(task._id)}
                              className="w-9 h-9 flex items-center justify-center bg-transparent text-on-surface-variant hover:text-error hover:bg-error-container transition-colors"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform mt-1">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="border-2 border-dashed border-primary bg-surface-container-low p-4 text-sm text-on-surface-variant">
                  No action items yet. Use the suggested tasks panel or add a real task from your own revision plan.
                </div>
              )}
            </div>
          </div>

          <div className="px-6 pb-6 pt-2">
            {showAddTask ? (
              <form onSubmit={handleAddTask} className="space-y-3">
                <div className="flex gap-2 flex-col md:flex-row">
                  <input
                    type="text"
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Enter task description..."
                    className="flex-1 border-2 border-primary bg-background p-3 font-body-sm focus:outline-none"
                    autoFocus
                    required
                  />
                  <select
                    value={newTaskDifficulty}
                    onChange={(e) => setNewTaskDifficulty(e.target.value as 'EASY' | 'MED' | 'HARD')}
                    className="border-2 border-primary bg-white p-3 font-label-caps text-label-caps uppercase focus:outline-none"
                  >
                    <option value="EASY">EASY</option>
                    <option value="MED">MED</option>
                    <option value="HARD">HARD</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={addTaskMutation.isPending}
                    className="px-4 bg-primary text-on-primary border-2 border-primary font-label-caps text-label-caps hover:opacity-90 transition-opacity uppercase"
                  >
                    {addTaskMutation.isPending ? '...' : 'ADD'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowAddTask(false); setNewTaskText(''); setNewTaskDifficulty('MED'); }}
                    className="px-4 border-2 border-primary font-label-caps text-label-caps hover:bg-surface-container transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            ) : (
              <button 
                onClick={() => setShowAddTask(true)}
                className="w-full py-4 border-2 border-primary border-dashed text-on-surface-variant hover:text-primary font-label-caps text-label-caps hover:bg-surface-container transition-colors uppercase"
              >
                + ADD CUSTOM TASK
              </button>
            )}
          </div>
        </div>

        {/* AI Suggested Tasks based on decay analysis */}
        <div className="bg-white border-2 border-primary shadow-[8px_8px_0px_0px_var(--shadow-color)] p-6">
          <h4 className="font-headline-md text-lg font-black mb-4 flex items-center gap-2">
            SUGGESTED TASKS
            <span className="material-symbols-outlined text-sm text-secondary">auto_awesome</span>
          </h4>
          <div className="space-y-3">
            {suggestedTasks && suggestedTasks.length > 0 ? (
              suggestedTasks.map((task: any, idx: number) => (
                <div key={idx} className="border-2 border-primary p-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm uppercase">{task.topic}</p>
                      <p className="text-[10px] text-on-surface-variant mt-0.5">{task.reason}</p>
                      <p className="text-[10px] text-on-surface-variant/70 mt-0.5">{task.suggestedAction}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-data-mono text-[9px] px-2 py-0.5 border border-primary bg-white font-bold whitespace-nowrap">
                        {task.estimatedSessions} SESSION{task.estimatedSessions > 1 ? 'S' : ''}
                      </span>
                      <span className={`font-data-mono text-[9px] px-2 py-0.5 border font-bold whitespace-nowrap ${
                        task.difficulty === 'HARD' ? 'bg-error-container border-error text-error' :
                        task.difficulty === 'MED' ? 'bg-secondary-container text-on-secondary-container border-secondary' :
                        'bg-green-100 border-green-700 text-green-800'
                      }`}>
                        {task.difficulty}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => addTaskMutation.mutate({ text: `${task.suggestedAction}`, duration: task.duration || '30 mins', difficulty: task.difficulty || 'MED' })}
                    className="mt-2 w-full border-2 border-primary py-1.5 font-label-caps text-[10px] font-bold uppercase hover:bg-primary hover:text-on-primary transition-colors"
                  >
                    ADD TO ACTION PLAN
                  </button>
                </div>
              ))
            ) : (
              <p className="text-on-surface-variant text-sm">No skills with significant decay found. Keep up the good work!</p>
            )}
          </div>
        </div>

        <div className="bg-white border-2 border-primary shadow-[8px_8px_0px_0px_var(--shadow-color)] flex flex-col p-6">
          <h3 className="font-label-caps text-label-caps mb-8 border-b-2 border-primary pb-4 font-bold uppercase tracking-wider">
            ACTIVITY INTELLIGENCE
          </h3>
          <div className="flex-1 relative">
            <div className="absolute left-3 top-0 bottom-0 w-1 bg-primary"></div>
            
            <div className="space-y-8 relative">
              {recentActivities.length > 0 ? (
                recentActivities.map((item, index) => (
                  <div key={`${item.kind}-${index}`} className="flex gap-6 items-start">
                    <div className={`w-6 h-6 border-2 border-primary z-10 shrink-0 shadow-[1px_1px_0px_0px_var(--shadow-color)] ${item.tone === 'positive' ? 'bg-secondary-container' : 'bg-error'}`}></div>
                    <div className="space-y-1">
                      <p className="font-label-caps text-[9px] text-on-surface-variant uppercase">{formatTimestamp(item.timestamp)}</p>
                      <p className="font-body-lg font-bold leading-tight">{item.title}</p>
                      <p className="text-[12px] text-on-surface-variant">{item.description}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="border-2 border-dashed border-primary p-4 text-sm text-on-surface-variant bg-surface-container-low">
                  No activity recorded yet.
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => navigate('/revisions')}
            className="mt-8 text-on-surface-variant font-label-caps text-[10px] hover:underline uppercase text-center w-full"
          >
            View Complete Intelligence Feed
          </button>
        </div>
      </div>

      <footer className="mt-12 border-t-2 border-primary bg-tertiary px-4 md:px-margin-desktop py-8 text-white">
        <div className="max-w-container-max mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <h4 className="font-headline-md text-xl font-black">HELIX</h4>
            <p className="font-data-mono text-[10px] text-white/70 uppercase">
              © 2026 HELIX PREPARATION INTELLIGENCE. ALL RIGHTS RESERVED.
            </p>
          </div>
          <div className="flex gap-8 font-data-mono text-xs">
            <Link className="text-white hover:text-secondary-fixed transition-colors" to="/privacy">PRIVACY POLICY</Link>
            <Link className="text-white hover:text-secondary-fixed transition-colors" to="/terms">TERMS OF SERVICE</Link>
            <Link className="text-white hover:text-secondary-fixed transition-colors" to="/security">SECURITY</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;

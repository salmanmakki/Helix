import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import Card from '../components/Card';
import Button from '../components/Button';
import type { FailureReport, CommunityFailureReport } from '../types';

export const FailureIntelligence: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  
  // Filters
  const [filterCompany, setFilterCompany] = useState('All Entities');
  const [filterRole, setFilterRole] = useState('All Roles');
  const [filterTopic, setFilterTopic] = useState('All Topics');

  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());

  const toggleLesson = (id: string) => {
    setExpandedLessons(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const [showAiAnalyze, setShowAiAnalyze] = useState(false);
  const [aiNotes, setAiNotes] = useState('');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);

  const [communityAnalysis, setCommunityAnalysis] = useState<string | null>(() => localStorage.getItem('helix_community_analysis'));
  const [communityAnalysisLoading, setCommunityAnalysisLoading] = useState(false);
  const [myAnalysis, setMyAnalysis] = useState<string | null>(() => localStorage.getItem('helix_my_analysis'));
  const [myAnalysisLoading, setMyAnalysisLoading] = useState(false);

  // Form states for new failure
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [topic, setTopic] = useState('');
  const [roundFailed, setRoundFailed] = useState('');
  const [primaryReason, setPrimaryReason] = useState('');
  const [secondaryReason, setSecondaryReason] = useState('');
  const [lessonLearned, setLessonLearned] = useState('');

  // Form states for anonymous community share
  const [anonCompany, setAnonCompany] = useState('');
  const [anonRole, setAnonRole] = useState('');
  const [anonTopic, setAnonTopic] = useState('');
  const [anonRoundFailed, setAnonRoundFailed] = useState('');
  const [anonPrimaryReason, setAnonPrimaryReason] = useState('');
  const [anonSecondaryReason, setAnonSecondaryReason] = useState('');
  const [anonExperience, setAnonExperience] = useState('');
  const [anonLessonLearned, setAnonLessonLearned] = useState('');

  // Query: Fetch failure reports
  const { data: failures } = useQuery<FailureReport[]>({
    queryKey: ['failures', filterCompany, filterRole, filterTopic],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filterCompany !== 'All Entities') params.company = filterCompany;
      if (filterRole !== 'All Roles') params.role = filterRole;
      if (filterTopic !== 'All Topics') params.topic = filterTopic;

      const res = await api.get('/failures', { params });
      return res.data;
    }
  });

  // Query: Fetch anonymous community failure reports
  const { data: communityFailures } = useQuery<CommunityFailureReport[]>({
    queryKey: ['community-failures', filterCompany, filterRole, filterTopic],
    queryFn: async () => {
      const params: Record<string, string> = {};
      if (filterCompany !== 'All Entities') params.company = filterCompany;
      if (filterRole !== 'All Roles') params.role = filterRole;
      if (filterTopic !== 'All Topics') params.topic = filterTopic;

      const res = await api.get('/community-failures', { params });
      return res.data;
    }
  });

  // Mutation: Submit anonymous failure report
  const shareAnonymouslyMutation = useMutation({
    mutationFn: async (payload: Partial<CommunityFailureReport>) => {
      const res = await api.post('/community-failures', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community-failures'] });
      setAnonCompany('');
      setAnonRole('');
      setAnonTopic('');
      setAnonRoundFailed('');
      setAnonPrimaryReason('');
      setAnonSecondaryReason('');
      setAnonExperience('');
      setAnonLessonLearned('');
      setShareSuccess(true);
      setTimeout(() => {
        setShareSuccess(false);
        setShowShareModal(false);
      }, 2500);
    }
  });

  // Mutation: Log failure report
  const addFailureMutation = useMutation({
    mutationFn: async (newFailure: Partial<FailureReport>) => {
      const res = await api.post('/failures', newFailure);
      return res.data;
    },
    onSuccess: () => {
      // Invalidate query cache
      queryClient.invalidateQueries({ queryKey: ['failures'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['readiness'] });
      queryClient.invalidateQueries({ queryKey: ['risk'] });

      // Reset form
      setCompany('');
      setRole('');
      setTopic('');
      setRoundFailed('');
      setPrimaryReason('');
      setSecondaryReason('');
      setLessonLearned('');
      setShowAddModal(false);
    }
  });

  const handleAiAnalyze = async () => {
    if (!aiNotes.trim() || aiNotes.length < 20) return;
    setAiAnalyzing(true);
    try {
      const res = await api.post('/ai/analyze-failure', { notes: aiNotes.trim() });
      const extraction = res.data.rawExtraction || res.data.report;
      if (extraction.company) setCompany(extraction.company);
      if (extraction.role) setRole(extraction.role);
      if (extraction.topic) setTopic(extraction.topic);
      if (extraction.roundFailed) setRoundFailed(extraction.roundFailed);
      if (extraction.primaryReason) setPrimaryReason(extraction.primaryReason);
      if (extraction.secondaryReason) setSecondaryReason(extraction.secondaryReason);
      if (extraction.lessonLearned) setLessonLearned(extraction.lessonLearned);
      setShowAiAnalyze(false);
      setAiNotes('');
    } catch {
      alert('AI analysis failed. Please fill in the fields manually.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleLogFailure = (e: React.FormEvent) => {
    e.preventDefault();
    if (!company || !role || !topic || !roundFailed || !primaryReason || !lessonLearned) return;

    addFailureMutation.mutate({
      company,
      role,
      topic,
      roundFailed,
      primaryReason,
      secondaryReason,
      lessonLearned
    });
  };

  const resetAnonForm = () => {
    setAnonCompany('');
    setAnonRole('');
    setAnonTopic('');
    setAnonRoundFailed('');
    setAnonPrimaryReason('');
    setAnonSecondaryReason('');
    setAnonExperience('');
    setAnonLessonLearned('');
    setShareSuccess(false);
  };

  const handleShareAnonymously = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !anonCompany ||
      !anonRole ||
      !anonTopic ||
      !anonRoundFailed ||
      !anonPrimaryReason ||
      !anonExperience ||
      !anonLessonLearned
    ) {
      return;
    }

    shareAnonymouslyMutation.mutate({
      company: anonCompany,
      role: anonRole,
      topic: anonTopic,
      roundFailed: anonRoundFailed,
      primaryReason: anonPrimaryReason,
      secondaryReason: anonSecondaryReason,
      interviewExperience: anonExperience,
      lessonLearned: anonLessonLearned
    });
  };

  const persistCommunityAnalysis = (value: string | null) => {
    setCommunityAnalysis(value);
    if (value && value !== 'Analysis failed. Please try again later.') {
      localStorage.setItem('helix_community_analysis', value);
    }
  };

  const persistMyAnalysis = (value: string | null) => {
    setMyAnalysis(value);
    if (value && value !== 'Analysis failed. Please try again later.') {
      localStorage.setItem('helix_my_analysis', value);
    }
  };

  const handleCommunityAnalysis = async () => {
    setCommunityAnalysisLoading(true);
    try {
      const res = await api.get('/ai/analyze-community-failures');
      persistCommunityAnalysis(res.data.analysis);
    } catch {
      setCommunityAnalysis('Analysis failed. Please try again later.');
    } finally {
      setCommunityAnalysisLoading(false);
    }
  };

  const handleMyAnalysis = async () => {
    setMyAnalysisLoading(true);
    try {
      const res = await api.get('/ai/analyze-my-failures');
      persistMyAnalysis(res.data.analysis);
    } catch {
      setMyAnalysis('Analysis failed. Please try again later.');
    } finally {
      setMyAnalysisLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilterCompany('All Entities');
    setFilterRole('All Roles');
    setFilterTopic('All Topics');
  };

  const COMMUNITY_PER_PAGE = 5;
  const [communityPage, setCommunityPage] = useState(1);
  const communityTotalPages = communityFailures ? Math.max(1, Math.ceil(communityFailures.length / COMMUNITY_PER_PAGE)) : 1;
  const communityPageItems = communityFailures?.slice(
    (communityPage - 1) * COMMUNITY_PER_PAGE,
    communityPage * COMMUNITY_PER_PAGE
  ) ?? [];

  const displayFailures = failures ?? [];
  const displayCommunityFailures = communityFailures ?? [];

  const renderInsight = (text: string) => {
    const parts = text.split(/\*\*(Observation|Evidence|Impact|Recommendation):\*\*/g);
    if (parts.length < 2) {
      return <div className="text-sm whitespace-pre-wrap">{text}</div>;
    }
    const insights: { label: string; content: string }[] = [];
    for (let i = 1; i < parts.length; i += 2) {
      const label = parts[i];
      const content = parts[i + 1]?.trim();
      if (content) insights.push({ label, content });
    }
    if (insights.length === 0) {
      return <div className="text-sm whitespace-pre-wrap">{text}</div>;
    }
    return (
      <div className="space-y-3">
        {insights.map((item, idx) => (
          <div key={idx} className="border-l-2 border-primary pl-3">
            <div className="font-label-caps text-[9px] uppercase tracking-wider text-on-surface-variant mb-0.5">
              {item.label}
            </div>
            <div className="text-sm leading-relaxed">{item.content}</div>
          </div>
        ))}
      </div>
    );
  };

  const formatRelativeDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="px-4 md:px-margin-desktop py-6 max-w-container-max mx-auto w-full space-y-10 pb-12 text-primary font-body-lg select-none">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b-2 border-primary pb-6">
        <div>
          <h2 className="font-display-lg text-3xl md:text-4xl uppercase font-black">Failure Intelligence</h2>
          <p className="font-body-lg text-on-surface-variant max-w-2xl mt-2 leading-relaxed text-sm">
            Shared post-mortem data from the entire community — rejection patterns and lessons learned from every user.
          </p>
        </div>
        <div className="flex gap-2 md:gap-4 w-full md:w-auto">
          <Button onClick={() => setShowShareModal(true)} variant="secondary" className="flex-1 md:flex-none px-3 md:px-6 py-3 text-[10px] md:text-label-caps">
            <span className="material-symbols-outlined">visibility_off</span> <span className="hidden sm:inline">Share Anonymously</span><span className="sm:hidden">Share</span>
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="flex-1 md:flex-none px-3 md:px-6 py-3 text-[10px] md:text-label-caps">
            <span className="material-symbols-outlined">add</span> <span className="hidden sm:inline">Document Failure</span><span className="sm:hidden">Add</span>
          </Button>
        </div>
      </header>

      {/* Summary Bento Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
        <Card className="relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-6xl text-primary font-bold">priority_high</span>
          </div>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4 border-b-2 border-primary pb-2 font-bold uppercase tracking-wider">
            Documented Failures
          </h3>
          <div className="flex flex-col justify-center h-24">
            <span className="font-display-lg text-3xl uppercase font-black">{displayFailures.length}</span>
            <span className="font-data-mono text-on-surface-variant mt-2 text-xs">TOTAL FAILURES LOGGED</span>
          </div>
        </Card>

        <Card className="relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-6xl text-primary font-bold">forum</span>
          </div>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4 border-b-2 border-primary pb-2 font-bold uppercase tracking-wider">
            Community Intel
          </h3>
          <div className="flex flex-col justify-center h-24">
            <span className="font-display-lg text-3xl uppercase font-black">{displayCommunityFailures.length}</span>
            <span className="font-data-mono text-on-surface-variant mt-2 text-xs">ANONYMOUS REPORTS</span>
          </div>
        </Card>

        <Card className="relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined text-6xl text-primary font-bold">analytics</span>
          </div>
          <h3 className="font-label-caps text-label-caps text-on-surface-variant mb-4 border-b-2 border-primary pb-2 font-bold uppercase tracking-wider">
            Unique Topics
          </h3>
          <div className="flex flex-col justify-center h-24">
            <span className="font-display-lg text-3xl uppercase font-black">
              {new Set([...displayFailures.map(f => f.topic), ...displayCommunityFailures.map(f => f.topic)].filter(Boolean)).size}
            </span>
            <span className="font-data-mono text-on-surface-variant mt-2 text-xs">TOPICS ACROSS FAILURES</span>
          </div>
        </Card>
      </div>

      {/* Filters Strip */}
      <div className="bg-white border-2 border-primary p-4 shadow-[4px_4px_0px_0px_var(--shadow-color)]">
        <div className="flex items-center justify-between mb-3 md:mb-0 md:justify-normal gap-3">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">filter_list</span>
            <span className="font-label-caps text-label-caps uppercase font-bold tracking-wider">Filter By:</span>
          </div>
          <button 
            onClick={handleResetFilters}
            className="md:hidden bg-primary text-on-primary px-3 py-1.5 font-label-caps text-[10px] border border-primary shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase font-bold"
          >
            Reset
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
          <div>
            <label className="block font-label-caps text-[9px] uppercase mb-1 font-bold">Company</label>
            <select 
              value={filterCompany}
              onChange={(e) => setFilterCompany(e.target.value)}
              className="w-full bg-white border-2 border-primary p-2 font-data-mono text-xs focus:shadow-[1px_1px_0px_0px_var(--shadow-color)] outline-none transition-all"
            >
              <option>All Entities</option>
              <option>Veridian AI</option>
              <option>Global Ledger</option>
              <option>Quantum Drift</option>
              <option>Sky Grid</option>
            </select>
          </div>
          <div>
            <label className="block font-label-caps text-[9px] uppercase mb-1 font-bold">Role</label>
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full bg-white border-2 border-primary p-2 font-data-mono text-xs focus:shadow-[1px_1px_0px_0px_var(--shadow-color)] outline-none transition-all"
            >
              <option>All Roles</option>
              <option>Staff Engineer</option>
              <option>Senior SWE</option>
              <option>Architect</option>
              <option>Solutions Architect</option>
              <option>Senior Applied ML</option>
              <option>Principal SRE</option>
            </select>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block font-label-caps text-[9px] uppercase mb-1 font-bold">Topic</label>
            <select 
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className="w-full bg-white border-2 border-primary p-2 font-data-mono text-xs focus:shadow-[1px_1px_0px_0px_var(--shadow-color)] outline-none transition-all"
            >
              <option>All Topics</option>
              <option>Distributed Systems</option>
              <option>Algorithms</option>
              <option>Leadership</option>
              <option>Low Level Design</option>
              <option>Infrastructure Scaling</option>
            </select>
          </div>
        </div>
        <button 
          onClick={handleResetFilters}
          className="hidden md:inline-block mt-3 bg-primary text-on-primary px-4 py-2 font-label-caps text-xs border border-primary shadow-[2px_2px_0px_0px_var(--shadow-color)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all uppercase font-bold"
        >
          Reset
        </button>
      </div>

      {/* Community Anonymous Intel */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b-2 border-primary pb-4">
          <div>
            <h3 className="font-headline-md text-xl md:text-2xl uppercase font-black flex items-center gap-2">
              <span className="material-symbols-outlined">groups</span>
              Community Failure Intel
            </h3>
            <p className="font-body-sm text-on-surface-variant text-sm mt-1 max-w-2xl">
              Anonymous interview experiences shared by the community. No names or accounts are stored with submissions.
            </p>
          </div>
          <div className="font-data-mono text-xs uppercase font-bold bg-secondary-container text-on-secondary-container border-2 border-primary px-3 py-2 shadow-[2px_2px_0px_0px_var(--shadow-color)]">
            {displayCommunityFailures.length} anonymous report{displayCommunityFailures.length !== 1 ? 's' : ''}
          </div>
        </div>

        {displayCommunityFailures.length === 0 ? (
          <Card className="p-8 text-center border-2 border-dashed border-primary">
            <span className="material-symbols-outlined text-4xl opacity-30 mb-3 block">forum</span>
            <p className="font-body-lg text-sm text-on-surface-variant mb-4">
              No anonymous experiences yet. Be the first to share what happened and help others prepare.
            </p>
            <Button onClick={() => setShowShareModal(true)} className="px-6 py-2">
              Share Your Experience
            </Button>
          </Card>
        ) : (
          <div className="bg-white border-2 border-primary dark:border-white shadow-[6px_6px_0px_0px_var(--shadow-color)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-primary text-on-primary border-b-2 border-primary">
                    <th className="p-3 font-label-caps text-[10px] border-r border-primary/20 uppercase font-bold">Company</th>
                    <th className="p-3 font-label-caps text-[10px] border-r border-primary/20 uppercase font-bold">Role</th>
                    <th className="p-3 font-label-caps text-[10px] border-r border-primary/20 uppercase font-bold">Topic</th>
                    <th className="p-3 font-label-caps text-[10px] border-r border-primary/20 uppercase font-bold">Round Failed</th>
                    <th className="p-3 font-label-caps text-[10px] border-r border-primary/20 uppercase font-bold">Primary Reason</th>
                    <th className="p-3 font-label-caps text-[10px] border-r border-primary/20 uppercase font-bold">Lesson Learned</th>
                    <th className="p-3 font-label-caps text-[10px] uppercase font-bold">Date</th>
                  </tr>
                </thead>
                <tbody className="font-body-sm text-xs">
                  {communityPageItems.map((report) => (
                    <tr key={report._id} className="border-b-2 border-primary hover:bg-surface-container-low transition-colors group">
                      <td className="p-3 border-r-2 border-primary font-bold">
                        <div className="flex items-center gap-2">
                          <span className="uppercase">{report.company}</span>
                          <span className="bg-surface-container-high border border-primary px-1.5 py-0.5 font-label-caps text-[7px] uppercase font-bold flex items-center gap-0.5">
                            <span className="material-symbols-outlined text-[8px]">visibility_off</span>
                            Anon
                          </span>
                        </div>
                      </td>
                      <td className="p-3 border-r-2 border-primary font-data-mono text-[11px] uppercase">{report.role}</td>
                      <td className="p-3 border-r-2 border-primary">
                        <span className="bg-background border border-primary px-1.5 py-0.5 font-label-caps text-[8px] font-bold uppercase">
                          {report.topic}
                        </span>
                      </td>
                      <td className="p-3 border-r-2 border-primary">
                        <span className="bg-error-container text-on-error-container px-1.5 py-0.5 font-label-caps text-[8px] border border-primary font-bold uppercase whitespace-nowrap">
                          {report.roundFailed}
                        </span>
                      </td>
                      <td className="p-3 border-r-2 border-primary max-w-[160px] truncate" title={report.primaryReason}>
                        {report.primaryReason}
                      </td>
                      <td
                        className={`p-3 border-r-2 border-primary italic opacity-70 cursor-pointer ${expandedLessons.has(report._id) ? '' : 'truncate max-w-[180px]'}`}
                        onClick={() => toggleLesson(report._id)}
                        title={expandedLessons.has(report._id) ? 'Click to collapse' : 'Click to expand'}
                      >
                        <span className="flex items-center gap-1">
                          <span className="material-symbols-outlined text-[10px] shrink-0">
                            {expandedLessons.has(report._id) ? 'unfold_less' : 'unfold_more'}
                          </span>
                          "{report.lessonLearned}"
                        </span>
                      </td>
                      <td className="p-3 font-data-mono text-[10px] uppercase text-on-surface-variant whitespace-nowrap">
                        {formatRelativeDate(report.createdAt || report.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Table Footer */}
            <div className="bg-surface-container-high p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t-2 border-primary font-data-mono text-xs uppercase font-bold">
              <div>Showing {displayCommunityFailures.length} anonymous report{displayCommunityFailures.length !== 1 ? 's' : ''}</div>
              <div className="flex gap-4 items-center">
                <button
                  className="hover:underline disabled:opacity-30 disabled:no-underline"
                  disabled={communityPage <= 1}
                  onClick={() => setCommunityPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <div className="flex gap-2">
                  {Array.from({ length: communityTotalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCommunityPage(page)}
                      className={`px-2 border ${page === communityPage ? 'bg-primary text-on-primary border-primary' : 'border-transparent hover:underline'}`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  className="hover:underline disabled:opacity-30 disabled:no-underline"
                  disabled={communityPage >= communityTotalPages}
                  onClick={() => setCommunityPage(p => Math.min(communityTotalPages, p + 1))}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* My Documented Failures */}
      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b-2 border-primary pb-4">
          <div>
            <h3 className="font-headline-md text-xl md:text-2xl uppercase font-black flex items-center gap-2">
              <span className="material-symbols-outlined">assignment</span>
              My Documented Failures
            </h3>
            <p className="font-body-sm text-on-surface-variant text-sm mt-1">
              Failures you have personally logged for tracking and analysis.
            </p>
          </div>
          <div className="font-data-mono text-xs uppercase font-bold bg-primary text-on-primary px-3 py-2 shadow-[2px_2px_0px_0px_var(--shadow-color)]">
            {displayFailures.length} failure{displayFailures.length !== 1 ? 's' : ''}
          </div>
        </div>

        <div className="bg-white border-2 border-primary dark:border-white shadow-[8px_8px_0px_0px_var(--shadow-color)] overflow-hidden">
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead>
                  <tr className="bg-primary text-on-primary border-b-2 border-primary">
                    <th className="p-4 font-label-caps text-label-caps border-r border-primary/20 uppercase font-bold">Company</th>
                    <th className="p-4 font-label-caps text-label-caps border-r border-primary/20 uppercase font-bold">Role</th>
                    <th className="p-4 font-label-caps text-label-caps border-r border-primary/20 uppercase font-bold">Round Failed</th>
                    <th className="p-4 font-label-caps text-label-caps border-r border-primary/20 uppercase font-bold">Primary Reason</th>
                    <th className="p-4 font-label-caps text-label-caps border-r border-primary/20 uppercase font-bold">Secondary Reason</th>
                    <th className="p-4 font-label-caps text-label-caps uppercase font-bold">Lesson Learned</th>
                  </tr>
            </thead>
            <tbody className="font-body-sm text-sm">
              {displayFailures.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-4xl opacity-30 mb-2 block">search_off</span>
                    No documented failures yet. Be the first to log one or share anonymously.
                  </td>
                </tr>
              ) : (
                displayFailures.map((fail) => (
                <tr key={fail._id} className="border-b-2 border-primary hover:bg-surface-container-low transition-colors group">
                  <td className="p-4 border-r-2 border-primary font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-black flex items-center justify-center shrink-0 border border-primary">
                        <span className="material-symbols-outlined text-white text-sm">corporate_fare</span>
                      </div>
                      <span className="uppercase">{fail.company}</span>
                    </div>
                  </td>
                  <td className="p-4 border-r-2 border-primary font-data-mono text-xs uppercase">{fail.role}</td>
                  <td className="p-4 border-r-2 border-primary">
                    <span className="bg-error-container text-on-error-container px-2 py-1 font-label-caps text-[9px] border border-primary font-bold uppercase">
                      {fail.roundFailed}
                    </span>
                  </td>
                  <td className="p-4 border-r-2 border-primary text-xs">{fail.primaryReason}</td>
                  <td className="p-4 border-r-2 border-primary text-xs text-on-surface-variant">{fail.secondaryReason || 'None'}</td>
                  <td
                    className={`p-4 bg-secondary-fixed/5 italic border-r-border-width border-primary text-xs leading-relaxed cursor-pointer ${expandedLessons.has(fail._id) ? '' : 'truncate max-w-[200px]'}`}
                    onClick={() => toggleLesson(fail._id)}
                    title={expandedLessons.has(fail._id) ? 'Click to collapse' : 'Click to expand'}
                  >
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px] shrink-0">
                        {expandedLessons.has(fail._id) ? 'unfold_less' : 'unfold_more'}
                      </span>
                      "{fail.lessonLearned}"
                    </span>
                  </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Table Footer */}
        <div className="bg-surface-container-high p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-t-2 border-primary font-data-mono text-xs uppercase font-bold">
          <div>Showing {displayFailures.length} documented failure{displayFailures.length !== 1 ? 's' : ''}</div>
          <div className="flex gap-4">
            <button className="hover:underline">Previous</button>
            <div className="flex gap-2">
              <span className="bg-primary text-on-primary px-2 border border-primary">1</span>
              <span className="px-2">2</span>
              <span className="px-2">3</span>
            </div>
            <button className="hover:underline">Next</button>
          </div>
        </div>
      </div>
      </section>

      {/* Strategic Intelligence Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-gutter">
        <Card className="p-6 flex flex-col justify-between">
          <h3 className="font-headline-md text-xl uppercase mb-4 flex items-center gap-2 font-bold">
            <span className="material-symbols-outlined">person_search</span> My Failure Analysis
          </h3>
          {myAnalysis ? (
            <div className="flex-1 overflow-y-auto max-h-[300px]">
              {renderInsight(myAnalysis)}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-primary p-8">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2 block">analytics</span>
                <p className="text-sm text-on-surface-variant">Analyze your documented failures to see where you're lagging the most.</p>
              </div>
            </div>
          )}
          <Button
            className="w-full mt-4 py-3"
            onClick={handleMyAnalysis}
            disabled={myAnalysisLoading}
          >
            {myAnalysisLoading ? 'Analyzing...' : myAnalysis ? 'Re-analyze' : 'Analyze My Failures'}
          </Button>
        </Card>
        <Card className="p-6 flex flex-col justify-between">
          <h3 className="font-headline-md text-xl uppercase mb-4 flex items-center gap-2 font-bold">
            <span className="material-symbols-outlined">communities</span> Community Lag Analysis
          </h3>
          {communityAnalysis ? (
            <div className="flex-1 overflow-y-auto max-h-[300px]">
              {renderInsight(communityAnalysis)}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center border-2 border-dashed border-primary p-8">
              <div className="text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/30 mb-2 block">groups</span>
                <p className="text-sm text-on-surface-variant">Analyze anonymous community failure reports to discover where candidates struggle most.</p>
              </div>
            </div>
          )}
          <Button
            className="w-full mt-4 py-3"
            onClick={handleCommunityAnalysis}
            disabled={communityAnalysisLoading}
          >
            {communityAnalysisLoading ? 'Analyzing...' : communityAnalysis ? 'Re-analyze Community' : 'Analyze Community Failures'}
          </Button>
        </Card>
      </div>

      {/* Modal: Document Failure */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <div className="flex justify-between items-center mb-6 border-b-2 border-primary pb-3">
              <h3 className="font-headline-md text-xl font-bold uppercase">Document Failure</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="material-symbols-outlined text-primary hover:bg-surface-container p-1"
              >
                close
              </button>
            </div>

            <div className="mb-6">
              {!showAiAnalyze ? (
                <button
                  type="button"
                  onClick={() => setShowAiAnalyze(true)}
                  className="w-full bg-secondary-container text-on-secondary-container border-2 border-primary p-3 font-label-caps text-[11px] font-bold uppercase flex items-center justify-center gap-2 hover:bg-secondary-fixed transition-colors shadow-[2px_2px_0px_0px_var(--shadow-color)]"
                >
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  Auto-Fill with AI
                </button>
              ) : (
                <div className="space-y-3 border-2 border-primary bg-surface-container-low p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-label-caps text-[10px] font-bold uppercase">Paste Interview Notes</span>
                    <button
                      type="button"
                      onClick={() => { setShowAiAnalyze(false); setAiNotes(''); }}
                      className="text-[10px] font-label-caps uppercase underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <textarea
                    value={aiNotes}
                    onChange={(e) => setAiNotes(e.target.value)}
                    className="w-full border-2 border-primary bg-white p-3 font-body-sm text-sm focus:outline-none h-32"
                    placeholder="Paste your interview notes here. AI will extract company, role, topic, reason, and lesson..."
                  />
                  <button
                    type="button"
                    onClick={handleAiAnalyze}
                    disabled={aiAnalyzing || aiNotes.length < 20}
                    className="w-full bg-primary text-on-primary py-2 font-label-caps text-[11px] font-bold uppercase flex items-center justify-center gap-2 border-2 border-primary shadow-[2px_2px_0px_0px_var(--shadow-color)] disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    {aiAnalyzing ? 'Analyzing...' : 'Analyze & Fill'}
                  </button>
                </div>
              )}
            </div>

            <form onSubmit={handleLogFailure} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label-caps text-[10px] text-primary block">COMPANY</label>
                  <input 
                    type="text" 
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                    placeholder="e.g. SKY GRID"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-caps text-[10px] text-primary block">ROLE</label>
                  <input 
                    type="text" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                    placeholder="e.g. Principal SRE"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">FAILED TOPIC</label>
                <input 
                  type="text" 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                  placeholder="e.g. Distributed Systems"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">ROUND FAILED</label>
                <input 
                  type="text" 
                  value={roundFailed}
                  onChange={(e) => setRoundFailed(e.target.value)}
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                  placeholder="e.g. Round 3: Design"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-label-caps text-[10px] text-primary block">PRIMARY REASON</label>
                  <input 
                    type="text" 
                    value={primaryReason}
                    onChange={(e) => setPrimaryReason(e.target.value)}
                    className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                    placeholder="e.g. Load Balancing"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-label-caps text-[10px] text-primary block">SECONDARY REASON</label>
                  <input 
                    type="text" 
                    value={secondaryReason}
                    onChange={(e) => setSecondaryReason(e.target.value)}
                    className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                    placeholder="e.g. Caching Strategy"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">LESSON LEARNED</label>
                <textarea 
                  value={lessonLearned}
                  onChange={(e) => setLessonLearned(e.target.value)}
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none h-20"
                  placeholder="What is your post-mortem take-away?"
                  required
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={() => setShowAddModal(false)} 
                  className="flex-1 py-2"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 py-2"
                  disabled={addFailureMutation.isPending}
                >
                  {addFailureMutation.isPending ? 'Logging...' : 'Log Failure'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Modal: Share Anonymously */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6 bg-white max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b-2 border-primary pb-3">
              <h3 className="font-headline-md text-xl font-bold uppercase">Share Anonymously</h3>
              <button
                onClick={() => {
                  setShowShareModal(false);
                  resetAnonForm();
                }}
                className="material-symbols-outlined text-primary hover:bg-surface-container p-1"
              >
                close
              </button>
            </div>

            <div className="bg-secondary-container/30 border-2 border-dashed border-primary p-3 mb-5 flex gap-3">
              <span className="material-symbols-outlined text-on-secondary-container shrink-0">shield</span>
              <p className="text-xs leading-relaxed text-on-surface-variant">
                Your submission is fully anonymous. We do not store your name, email, or account with this report.
              </p>
            </div>

            {shareSuccess ? (
              <div className="py-12 text-center">
                <span className="material-symbols-outlined text-5xl text-primary mb-3 block">check_circle</span>
                <p className="font-headline-md uppercase font-bold">Thank you for sharing</p>
                <p className="text-sm text-on-surface-variant mt-2">Your experience will help others avoid the same pitfalls.</p>
              </div>
            ) : (
              <form onSubmit={handleShareAnonymously} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-primary block">COMPANY</label>
                    <input
                      type="text"
                      value={anonCompany}
                      onChange={(e) => setAnonCompany(e.target.value)}
                      className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                      placeholder="e.g. Google"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-primary block">ROLE</label>
                    <input
                      type="text"
                      value={anonRole}
                      onChange={(e) => setAnonRole(e.target.value)}
                      className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                      placeholder="e.g. Senior SWE"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-primary block">FAILED TOPIC</label>
                    <input
                      type="text"
                      value={anonTopic}
                      onChange={(e) => setAnonTopic(e.target.value)}
                      className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                      placeholder="e.g. System Design"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-primary block">ROUND FAILED</label>
                    <input
                      type="text"
                      value={anonRoundFailed}
                      onChange={(e) => setAnonRoundFailed(e.target.value)}
                      className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                      placeholder="e.g. Round 3: Onsite"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-primary block">PRIMARY REASON</label>
                    <input
                      type="text"
                      value={anonPrimaryReason}
                      onChange={(e) => setAnonPrimaryReason(e.target.value)}
                      className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                      placeholder="Why did you fail?"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-label-caps text-[10px] text-primary block">SECONDARY REASON</label>
                    <input
                      type="text"
                      value={anonSecondaryReason}
                      onChange={(e) => setAnonSecondaryReason(e.target.value)}
                      className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-label-caps text-[10px] text-primary block">INTERVIEW EXPERIENCE</label>
                  <textarea
                    value={anonExperience}
                    onChange={(e) => setAnonExperience(e.target.value)}
                    className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none h-28"
                    placeholder="Describe what happened during the interview — questions asked, where things went wrong, feedback received..."
                    required
                    minLength={20}
                  />
                  <p className="text-[10px] text-on-surface-variant">Minimum 20 characters</p>
                </div>

                <div className="space-y-1">
                  <label className="font-label-caps text-[10px] text-primary block">LESSON LEARNED</label>
                  <textarea
                    value={anonLessonLearned}
                    onChange={(e) => setAnonLessonLearned(e.target.value)}
                    className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none h-20"
                    placeholder="What would you do differently next time?"
                    required
                  />
                </div>

                {shareAnonymouslyMutation.isError && (
                  <p className="text-error text-xs font-bold">
                    Failed to submit. Please check your entries and try again.
                  </p>
                )}

                <div className="flex gap-4 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowShareModal(false);
                      resetAnonForm();
                    }}
                    className="flex-1 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 py-2"
                    disabled={shareAnonymouslyMutation.isPending}
                  >
                    {shareAnonymouslyMutation.isPending ? 'Submitting...' : 'Submit Anonymously'}
                  </Button>
                </div>
              </form>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

export default FailureIntelligence;

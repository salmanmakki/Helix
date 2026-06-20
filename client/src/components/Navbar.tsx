import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';
import type { Notification, Skill, FailureReport, CommunityFailureReport } from '../types';

interface SearchResults {
  skills: Skill[];
  failures: FailureReport[];
  communityFailures: CommunityFailureReport[];
}

interface NavbarProps {
  onToggleSidebar: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults } = useQuery<SearchResults>({
    queryKey: ['global-search', debouncedQuery],
    queryFn: async () => {
      const res = await api.get('/search', { params: { q: debouncedQuery } });
      return res.data;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const { data: notifications = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications');
      return res.data;
    }
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.put(`/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showSearchResults || showNotifications) {
      document.addEventListener('mousedown', handleClick);
    }
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showSearchResults, showNotifications]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSearchResults(false);
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleSelectResult = useCallback((type: string, _id?: string) => {
    setSearchQuery('');
    setDebouncedQuery('');
    setShowSearchResults(false);
    if (type === 'skill') navigate('/skills');
    else if (type === 'failure' || type === 'community') navigate('/failure-intelligence');
  }, [navigate]);

  const { mode, setMode, resolved } = useTheme();
  const unreadCount = notifications.filter((n) => !n.read).length;

  const hasResults = searchResults && (
    searchResults.skills.length > 0 ||
    searchResults.failures.length > 0 ||
    searchResults.communityFailures.length > 0
  );

  return (
    <header className="sticky top-0 bg-background/80 backdrop-blur-sm z-40 border-b-2 border-primary px-4 md:px-margin-desktop py-3 md:py-4 flex justify-between items-center select-none gap-2">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <button 
          onClick={onToggleSidebar}
          className="md:hidden w-10 h-10 flex items-center justify-center border-2 border-primary bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all shrink-0"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        <div className="relative flex-1 max-w-xs md:max-w-md lg:w-96" ref={searchRef}>
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            className="w-full bg-white border-2 border-primary py-2 pl-10 pr-4 font-data-mono text-data-mono focus:shadow-[4px_4px_0px_0px_var(--shadow-color)] focus:outline-none transition-all" 
            placeholder="SEARCH INTELLIGENCE..." 
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setShowSearchResults(true); }}
            onFocus={() => debouncedQuery.length >= 2 && setShowSearchResults(true)}
            onKeyDown={handleSearchKeyDown}
          />

          {showSearchResults && debouncedQuery.length >= 2 && (
            <div className="absolute left-0 top-full mt-1 w-full bg-white border-2 border-primary shadow-[6px_6px_0px_0px_var(--shadow-color)] z-50 max-h-96 overflow-y-auto">
              {!searchResults ? (
                <div className="p-4 text-center text-on-surface-variant font-data-mono text-xs">Searching...</div>
              ) : !hasResults ? (
                <div className="p-4 text-center text-on-surface-variant font-data-mono text-xs">No results found.</div>
              ) : (
                <div>
                  {searchResults.skills.length > 0 && (
                    <div>
                      <div className="sticky top-0 bg-secondary-fixed text-on-secondary-container border-b border-primary px-3 py-1.5 font-label-caps text-[9px] font-bold uppercase tracking-wider">
                        Skills ({searchResults.skills.length})
                      </div>
                      {searchResults.skills.map((s) => (
                        <button
                          key={s._id}
                          onClick={() => handleSelectResult('skill', s._id)}
                          className="w-full text-left px-3 py-2 border-b border-outline-variant hover:bg-surface-container-low transition-colors flex items-center justify-between gap-2"
                        >
                          <span className="font-data-mono text-xs font-bold uppercase truncate">{s.name}</span>
                          <span className={`font-label-caps text-[8px] px-1.5 py-0.5 border font-bold uppercase ${
                            s.riskLevel === 'high' ? 'bg-error-container text-on-error-container border-error' :
                            s.riskLevel === 'medium' ? 'bg-secondary-container text-on-secondary-container border-secondary' :
                            'bg-green-100 text-green-800 border-green-800'
                          }`}>
                            {s.riskLevel}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.failures.length > 0 && (
                    <div>
                      <div className="sticky top-0 bg-secondary-fixed text-on-secondary-container border-b border-primary px-3 py-1.5 font-label-caps text-[9px] font-bold uppercase tracking-wider">
                        My Failures ({searchResults.failures.length})
                      </div>
                      {searchResults.failures.map((f) => (
                        <button
                          key={f._id}
                          onClick={() => handleSelectResult('failure', f._id)}
                          className="w-full text-left px-3 py-2 border-b border-outline-variant hover:bg-surface-container-low transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-data-mono text-xs font-bold uppercase">{f.company}</span>
                            <span className="font-data-mono text-[9px] uppercase opacity-60">{f.role}</span>
                          </div>
                          <p className="font-data-mono text-[10px] text-on-surface-variant truncate mt-0.5">{f.topic} — {f.primaryReason}</p>
                        </button>
                      ))}
                    </div>
                  )}

                  {searchResults.communityFailures.length > 0 && (
                    <div>
                      <div className="sticky top-0 bg-secondary-fixed text-on-secondary-container border-b border-primary px-3 py-1.5 font-label-caps text-[9px] font-bold uppercase tracking-wider">
                        Community Intel ({searchResults.communityFailures.length})
                      </div>
                      {searchResults.communityFailures.map((c) => (
                        <button
                          key={c._id}
                          onClick={() => handleSelectResult('community', c._id)}
                          className="w-full text-left px-3 py-2 border-b border-outline-variant hover:bg-surface-container-low transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-data-mono text-xs font-bold uppercase">{c.company}</span>
                            <span className="font-data-mono text-[9px] uppercase opacity-60">{c.role}</span>
                          </div>
                          <p className="font-data-mono text-[10px] text-on-surface-variant truncate mt-0.5">{c.topic} — {c.primaryReason}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        <button
          onClick={() => {
            setMode(resolved === 'dark' ? 'light' : 'dark');
          }}
          className="w-10 h-10 flex items-center justify-center border-2 border-primary bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all relative"
          title={`Theme: ${resolved === 'dark' ? 'Dark' : 'Light'}${mode === 'system' ? ' (follows system)' : mode === 'dark' ? ' (locked dark)' : ' (locked light)'}`}
        >
          <span className="material-symbols-outlined">
            {resolved === 'dark' ? 'dark_mode' : 'light_mode'}
          </span>
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications((prev) => !prev)}
            className="w-10 h-10 flex items-center justify-center border-2 border-primary bg-white hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--shadow-color)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none shadow-[4px_4px_0px_0px_var(--shadow-color)] transition-all relative"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-error text-on-error text-[9px] font-bold font-data-mono w-5 h-5 flex items-center justify-center border border-primary shadow-[1px_1px_0px_0px_var(--shadow-color)]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 md:w-96 bg-white border-2 border-primary shadow-[6px_6px_0px_0px_var(--shadow-color)] z-50 max-h-96 overflow-y-auto">
              <div className="sticky top-0 bg-secondary-fixed text-on-secondary-container border-b-2 border-primary px-4 py-2 flex justify-between items-center">
                <span className="font-label-caps text-label-caps font-bold uppercase">Notifications</span>
                {unreadCount > 0 && (
                  <span className="font-data-mono text-[10px] bg-primary text-on-primary px-2 py-0.5">{unreadCount} unread</span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-on-surface-variant font-body-sm text-sm">No notifications yet.</div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n._id}
                    onClick={() => { if (!n.read) markReadMutation.mutate(n._id); }}
                    className={`px-4 py-3 border-b border-outline-variant cursor-pointer transition-colors hover:bg-surface-container ${
                      !n.read ? 'bg-surface-container-low' : ''
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      <span className={`material-symbols-outlined text-sm mt-0.5 ${
                        n.type === 'alert' ? 'text-error' : n.type === 'warning' ? 'text-secondary' : 'text-primary'
                      }`}>
                        {n.type === 'alert' ? 'error' : n.type === 'warning' ? 'warning' : 'info'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-label-caps text-[11px] font-bold uppercase">{n.title}</p>
                        <p className="font-body-sm text-xs text-on-surface-variant mt-0.5">{n.message}</p>
                        <p className="font-data-mono text-[9px] text-on-surface-variant/60 mt-1">
                          {new Date(n.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-error mt-2 shrink-0"></span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <button onClick={() => navigate('/profile')} className="hidden sm:flex items-center gap-3 pl-4 border-l-2 border-primary cursor-pointer hover:opacity-80 transition-opacity">
          <div className="text-right">
            <p className="font-label-caps text-label-caps leading-none">{user?.name || 'Guest User'}</p>
            <p className="text-[10px] font-data-mono text-on-surface-variant uppercase mt-1">
              {user?.role === 'admin' ? 'SYSTEM ADMINISTRATOR' : 'PREP CANDIDATE'}
            </p>
          </div>
          <div className="w-10 h-10 border-2 border-primary bg-secondary-fixed flex items-center justify-center text-on-secondary-container font-bold uppercase font-label-caps text-lg shadow-[2px_2px_0px_0px_var(--shadow-color)]">
            {user?.name ? user.name.charAt(0) : 'U'}
          </div>
        </button>
        <button onClick={() => navigate('/profile')} className="sm:hidden w-10 h-10 border-2 border-primary bg-secondary-fixed flex items-center justify-center text-on-secondary-container font-bold uppercase font-label-caps text-lg shadow-[2px_2px_0px_0px_var(--shadow-color)] cursor-pointer hover:opacity-80 transition-opacity">
          {user?.name ? user.name.charAt(0) : 'U'}
        </button>
      </div>
    </header>
  );
};

export default Navbar;

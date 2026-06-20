import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';
import Card from '../components/Card';
import Button from '../components/Button';

export const Profile: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [showEditModal, setShowEditModal] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [targetRole, setTargetRole] = useState('');

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { name?: string; email?: string; targetRole?: string }) => {
      const res = await api.put('/auth/profile', data);
      return res.data;
    },
    onSuccess: (data) => {
      const session = localStorage.getItem('auth_session');
      if (session) {
        const parsed = JSON.parse(session);
        parsed.name = data.name ?? parsed.name;
        parsed.email = data.email ?? parsed.email;
        localStorage.setItem('auth_session', JSON.stringify(parsed));
      }
      useAuthStore.setState({ user: { ...user!, ...data } });
      setShowEditModal(false);
    }
  });

  const openEditModal = () => {
    setName(user?.name ?? '');
    setEmail(user?.email ?? '');
    setTargetRole('');
    setShowEditModal(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: { name?: string; email?: string; targetRole?: string } = {};
    if (name.trim() && name !== user?.name) payload.name = name.trim();
    if (email.trim() && email !== user?.email) payload.email = email.trim();
    if (targetRole.trim()) payload.targetRole = targetRole.trim();
    if (Object.keys(payload).length === 0) { setShowEditModal(false); return; }
    updateProfileMutation.mutate(payload);
  };

  return (
    <div className="px-4 md:px-margin-desktop py-6 max-w-2xl mx-auto w-full space-y-gutter pb-12 text-primary font-body-lg select-none">
      <header className="border-b-4 border-primary pb-4 mb-8">
        <h2 className="font-display-lg text-2xl md:text-4xl uppercase tracking-tight">User Profile</h2>
        <p className="font-body-sm text-sm text-on-surface-variant mt-2">Manage your candidate identity credentials and platform role clearance.</p>
      </header>

      <Card className="shadow-[8px_8px_0px_0px_var(--shadow-color)]">
        <div className="flex flex-col items-center border-b-2 border-primary pb-6 mb-6">
          <div className="w-24 h-24 border-4 border-primary bg-secondary-fixed flex items-center justify-center text-on-secondary-container font-black uppercase font-label-caps text-4xl shadow-[4px_4px_0px_0px_var(--shadow-color)] mb-4">
            {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
          </div>
          <h3 className="font-headline-lg text-2xl font-bold uppercase">{user?.name ?? 'Unknown'}</h3>
          <span className="font-data-mono text-xs uppercase bg-secondary-container text-on-secondary-container px-2 py-0.5 border border-primary mt-2 font-bold">
            {user?.role === 'admin' ? 'SYSTEM ADMINISTRATOR' : 'PREPARATION CANDIDATE'}
          </span>
        </div>

        <div className="space-y-4 font-body-sm text-sm">
          <div className="flex justify-between border-b border-outline-variant pb-2">
            <span className="font-label-caps text-xs text-on-surface-variant uppercase font-bold">EMAIL ADDRESS</span>
            <span className="font-data-mono font-bold">{user?.email ?? 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant pb-2">
            <span className="font-label-caps text-xs text-on-surface-variant uppercase font-bold">CLEARANCE ROLE</span>
            <span className="font-data-mono font-bold capitalize">{user?.role ?? 'N/A'}</span>
          </div>
          <div className="flex justify-between border-b border-outline-variant pb-2">
            <span className="font-label-caps text-xs text-on-surface-variant uppercase font-bold">DIAGNOSTIC STATUS</span>
            <span className="font-data-mono text-green-600 font-bold uppercase">ACTIVE</span>
          </div>
        </div>

        <div className="mt-8 flex gap-4">
          <Button className="flex-1 py-3" variant="secondary">Change Password</Button>
          <Button className="flex-1 py-3" onClick={openEditModal}>Edit Details</Button>
        </div>
      </Card>

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md p-6 bg-white">
            <div className="flex justify-between items-center mb-6 border-b-2 border-primary pb-3">
              <h3 className="font-headline-md text-xl font-bold uppercase">Edit Details</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="material-symbols-outlined text-primary hover:bg-surface-container p-1"
              >
                close
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">NAME</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">EMAIL</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="font-label-caps text-[10px] text-primary block">TARGET ROLE</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full border-2 border-primary bg-background p-2 font-body-sm focus:outline-none"
                  placeholder="e.g. Software Engineer"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowEditModal(false)} className="flex-1 py-2">Cancel</Button>
                <Button type="submit" className="flex-1 py-2" disabled={updateProfileMutation.isPending}>
                  {updateProfileMutation.isPending ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Profile;

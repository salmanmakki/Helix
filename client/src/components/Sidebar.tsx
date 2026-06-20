import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    onClose();
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { to: '/skills', label: 'Skills', icon: 'psychology' },
    { to: '/revisions', label: 'Revisions', icon: 'history' },
    { to: '/risk-scanner', label: 'Risk Scanner', icon: 'radar' },
    { to: '/failure-intelligence', label: 'Failure Intel', icon: 'troubleshoot' },
    { to: '/analytics', label: 'Analytics', icon: 'analytics' },
  ];

  const bottomItems = [
    { to: '/profile', label: 'Profile', icon: 'person' },
    { to: '/settings', label: 'Settings', icon: 'settings' },
  ];

  const linkStyle = ({ isActive }: { isActive: boolean }) => {
    const base = "flex items-center gap-3 px-4 py-3 font-label-caps text-label-caps uppercase select-none transition-all ";
    if (isActive) {
      return base + "bg-secondary-container text-on-secondary-container border-2 border-primary shadow-[2px_2px_0px_0px_var(--shadow-color)] font-bold";
    }
    return base + "text-on-surface-variant hover:bg-surface-container-high hover:text-primary";
  };

  const sidebarContent = (
    <aside className="h-full w-64 border-r-2 border-primary bg-surface flex flex-col p-4 gap-2 select-none">
      <div className="mb-8 px-2 mt-2 flex items-center justify-between">
        <div>
          <h1 className="font-headline-md text-headline-md font-black uppercase text-primary tracking-tight">HELIX</h1>
          <p className="font-label-caps text-[10px] text-on-surface-variant opacity-70 tracking-widest uppercase">High-Performance Prep</p>
        </div>
        <button onClick={onClose} className="lg:hidden material-symbols-outlined text-primary hover:bg-surface-container p-1 rounded">
          close
        </button>
      </div>

      <nav className="flex-1 space-y-1">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={handleNavClick} className={linkStyle}>
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-4 border-t-2 border-primary space-y-1">
        {bottomItems.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={handleNavClick} className={linkStyle}>
            <span className="material-symbols-outlined">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
        
        <button 
          onClick={() => { handleLogout(); onClose(); }}
          className="w-full flex items-center gap-3 px-4 py-3 font-label-caps text-label-caps uppercase text-on-surface-variant hover:bg-error-container hover:text-error transition-all"
        >
          <span className="material-symbols-outlined text-error">logout</span>
          Logout
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:block h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70" onClick={onClose} />
          <div className="absolute left-0 top-0 h-full">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

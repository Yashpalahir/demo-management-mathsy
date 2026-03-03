'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Users, GraduationCap, UserCheck,
    BookOpen, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';

const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/students', label: 'Students', icon: GraduationCap },
    { href: '/teachers', label: 'Teachers', icon: Users },
    { href: '/assignments', label: 'Assignments', icon: UserCheck },
    { href: '/inquiry', label: 'New Inquiry', icon: BookOpen },
];

// ✅ NavContent moved OUTSIDE Sidebar to prevent unmount/remount on every render
// (previously defined inside caused all inputs to lose focus after every keystroke)
function NavContent({
    pathname,
    onLogout,
    onNavClick,
}: {
    pathname: string;
    onLogout: () => void;
    onNavClick: () => void;
}) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Logo */}
            <div style={{ padding: '24px 20px', borderBottom: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(99,102,241,0.4)',
                        flexShrink: 0,
                    }}>
                        <BookOpen size={20} color="white" />
                    </div>
                    <div>
                        <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>Mathsy</div>
                        <div style={{ fontSize: 11, color: '#6366f1', fontWeight: 600, letterSpacing: '0.06em' }}>ADMIN PANEL</div>
                    </div>
                </div>
            </div>

            {/* Nav links */}
            <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#475569', letterSpacing: '0.1em', padding: '0 8px', marginBottom: 10 }}>NAVIGATION</p>
                {navItems.map(({ href, label, icon: Icon }) => {
                    const isActive = pathname === href;
                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`sidebar-link ${isActive ? 'active' : ''}`}
                            style={{ marginBottom: 4 }}
                            onClick={onNavClick}
                        >
                            <Icon size={18} />
                            <span style={{ flex: 1 }}>{label}</span>
                            {isActive && <ChevronRight size={14} />}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div style={{ padding: '16px 12px', borderTop: '1px solid #1e293b' }}>
                <button
                    onClick={onLogout}
                    className="sidebar-link"
                    style={{ width: '100%', border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
}

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('mathsy_admin');
        router.push('/login');
    };

    return (
        <>
            {/* Desktop Sidebar */}
            <aside style={{
                width: 240, flexShrink: 0,
                background: '#1e293b',
                borderRight: '1px solid #334155',
                height: '100vh', position: 'sticky', top: 0,
                display: 'none',
            }} className="desktop-sidebar">
                <NavContent
                    pathname={pathname}
                    onLogout={handleLogout}
                    onNavClick={() => setMobileOpen(false)}
                />
            </aside>

            {/* Mobile top bar */}
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
                background: '#1e293b', borderBottom: '1px solid #334155',
                padding: '12px 16px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }} className="mobile-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BookOpen size={16} color="white" />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: 15 }}>Mathsy Admin</span>
                </div>
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}
                >
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile Drawer Backdrop */}
            {mobileOpen && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 39,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                }} onClick={() => setMobileOpen(false)} />
            )}

            {/* Mobile Sidebar Drawer */}
            <aside style={{
                position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 40,
                width: 240, background: '#1e293b',
                borderRight: '1px solid #334155',
                transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease',
            }} className="mobile-sidebar">
                <NavContent
                    pathname={pathname}
                    onLogout={handleLogout}
                    onNavClick={() => setMobileOpen(false)}
                />
            </aside>

            <style>{`
        @media (min-width: 768px) {
          .desktop-sidebar { display: block !important; }
          .mobile-topbar { display: none !important; }
          .mobile-sidebar { display: none !important; }
        }
      `}</style>
        </>
    );
}

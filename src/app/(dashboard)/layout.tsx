'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [checked, setChecked] = useState(false);

    useEffect(() => {
        const isAdmin = localStorage.getItem('mathsy_admin');
        if (!isAdmin) {
            router.replace('/login');
        } else {
            setChecked(true);
        }
    }, [router]);

    if (!checked) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#0f172a',
            }}>
                <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    border: '3px solid #334155', borderTopColor: '#6366f1',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#0f172a' }}>
            <Sidebar />
            <main style={{
                flex: 1,
                padding: '32px 28px',
                overflowY: 'auto',
                paddingTop: 'calc(32px)',
            }} className="main-content">
                {children}
            </main>
            <style>{`
        @media (max-width: 767px) {
          .main-content {
            padding-top: 80px !important;
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
        }
      `}</style>
        </div>
    );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Lock, Mail, Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPass, setShowPass] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Simple admin auth (replace with Supabase Auth in production)
        const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'admin@mathsy.com';
        const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'admin123';

        await new Promise((r) => setTimeout(r, 800));

        if (email === adminEmail && password === adminPassword) {
            localStorage.setItem('mathsy_admin', 'true');
            router.push('/dashboard');
        } else {
            setError('Invalid email or password. Please try again.');
        }
        setLoading(false);
    };

    return (
        <div
            style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
                padding: '20px',
                position: 'relative',
                overflow: 'hidden',
            }}
        >
            {/* Animated background blobs */}
            <div style={{
                position: 'absolute', top: '10%', left: '10%',
                width: 300, height: 300, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                filter: 'blur(40px)',
            }} />
            <div style={{
                position: 'absolute', bottom: '10%', right: '10%',
                width: 400, height: 400, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
                filter: 'blur(40px)',
            }} />

            <div className="glass animate-fadeIn" style={{
                width: '100%', maxWidth: 440,
                borderRadius: 24, padding: 40,
                position: 'relative', zIndex: 1,
            }}>
                {/* Logo */}
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 16,
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px',
                        boxShadow: '0 8px 32px rgba(99,102,241,0.4)',
                    }}>
                        <BookOpen size={28} color="white" />
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 6 }}>
                        <span className="gradient-text">Mathsy Admin</span>
                    </h1>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>
                        Teacher Assignment Management System
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                            Email Address
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                            <input
                                type="email"
                                className="input-field"
                                style={{ paddingLeft: 40 }}
                                placeholder="admin@mathsy.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                            <input
                                type={showPass ? 'text' : 'password'}
                                className="input-field"
                                style={{ paddingLeft: 40, paddingRight: 44 }}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPass(!showPass)}
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569' }}
                            >
                                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div style={{
                            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                            borderRadius: 8, padding: '10px 14px', marginBottom: 20,
                            color: '#ef4444', fontSize: 13,
                        }}>
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px 20px', fontSize: 15 }}>
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10" />
                                </svg>
                                Signing in...
                            </span>
                        ) : (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <Sparkles size={16} />
                                Sign In to Dashboard
                            </span>
                        )}
                    </button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 24, fontSize: 12, color: '#475569' }}>
                    Demo: admin@mathsy.com / admin123
                </p>
            </div>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

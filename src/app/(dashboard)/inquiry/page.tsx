'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SUBJECTS, DAYS, TIME_SLOTS, BOARDS, STANDARDS } from '@/lib/constants';
import { BookOpen, Send, CheckCircle, User, Phone, MapPin, BookMarked, Calendar, Clock } from 'lucide-react';

const labelStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6,
    fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8,
};

export default function InquiryPage() {
    const [name, setName] = useState('');
    const [standard, setStandard] = useState('');
    const [parentName, setParentName] = useState('');
    const [board, setBoard] = useState('');
    const [address, setAddress] = useState('');
    const [mobile, setMobile] = useState('');
    const [studentMobile, setStudentMobile] = useState('');
    const [subjects, setSubjects] = useState<string[]>([]);
    const [preferredDay, setPreferredDay] = useState('');
    const [preferredDate, setPreferredDate] = useState('');
    const [preferredSlot, setPreferredSlot] = useState('');

    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const resetForm = () => {
        setName('');
        setStandard('');
        setParentName('');
        setBoard('');
        setAddress('');
        setMobile('');
        setStudentMobile('');
        setSubjects([]);
        setPreferredDay('');
        setPreferredDate('');
        setPreferredSlot('');
    };

    const toggleSubject = (s: string) => {
        setSubjects(prev =>
            prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (subjects.length === 0) {
            setError('Please select at least one subject.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            const { error: err } = await supabase.from('students').insert([{
                name,
                standard,
                parent_name: parentName,
                board,
                address,
                mobile,
                student_mobile: studentMobile || null,
                subjects,
                preferred_day: preferredDay,
                preferred_date: preferredDate || null,
                preferred_slot: preferredSlot,
                status: 'unassigned',
                assigned_teacher_id: null,
            }]);
            if (err) throw err;
            setSubmitted(true);
            resetForm();
            setTimeout(() => setSubmitted(false), 4000);
        } catch (err: unknown) {
            setError((err as Error).message || 'Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ maxWidth: 760 }}>
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #06b6d4, #0891b2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BookOpen size={18} color="white" />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>New Student Inquiry</h1>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>Fill in the student details. They will appear in the Unassigned section after submission.</p>
            </div>

            {submitted && (
                <div style={{
                    background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: 12, padding: '16px 20px', marginBottom: 24,
                    display: 'flex', alignItems: 'center', gap: 12, color: '#10b981',
                }}>
                    <CheckCircle size={20} />
                    <div>
                        <div style={{ fontWeight: 700 }}>Inquiry submitted successfully!</div>
                        <div style={{ fontSize: 13, opacity: 0.8 }}>Student added to Unassigned section. Go to Students page to assign a teacher.</div>
                    </div>
                </div>
            )}

            {error && (
                <div style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 12, padding: '14px 20px', marginBottom: 24, color: '#ef4444', fontSize: 14,
                }}>{error}</div>
            )}

            <form onSubmit={handleSubmit}>
                {/* Student Information */}
                <div style={{
                    background: '#1e293b', borderRadius: 20, border: '1px solid #334155',
                    padding: 28, marginBottom: 20,
                }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#818cf8', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <User size={16} /> Student Information
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>

                        <div>
                            <label style={labelStyle}>
                                <User size={13} color="#6366f1" /> Student Name *
                            </label>
                            <input
                                className="input-field"
                                placeholder="Full name of student"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                <BookMarked size={13} color="#6366f1" /> Standard / Grade *
                            </label>
                            <select
                                className="input-field"
                                value={standard}
                                onChange={(e) => setStandard(e.target.value)}
                                required
                            >
                                <option value="">Select standard</option>
                                {STANDARDS.map((s) => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>
                                <User size={13} color="#6366f1" /> Parent / Guardian Name *
                            </label>
                            <input
                                className="input-field"
                                placeholder="Parent name"
                                value={parentName}
                                onChange={(e) => setParentName(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                <BookOpen size={13} color="#6366f1" /> Education Board *
                            </label>
                            <select
                                className="input-field"
                                value={board}
                                onChange={(e) => setBoard(e.target.value)}
                                required
                            >
                                <option value="">Select board</option>
                                {BOARDS.map((b) => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>
                                <Phone size={13} color="#6366f1" /> Parent Mobile *
                            </label>
                            <input
                                className="input-field"
                                placeholder="Parent's mobile number"
                                type="tel"
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                <Phone size={13} color="#6366f1" /> Student Mobile (Optional)
                            </label>
                            <input
                                className="input-field"
                                placeholder="Student's mobile number"
                                type="tel"
                                value={studentMobile}
                                onChange={(e) => setStudentMobile(e.target.value)}
                            />
                        </div>

                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>
                                <MapPin size={13} color="#6366f1" /> Address *
                            </label>
                            <input
                                className="input-field"
                                placeholder="Student's home address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                            />
                        </div>

                    </div>
                </div>

                {/* Subjects Selection */}
                <div style={{
                    background: '#1e293b', borderRadius: 20, border: '1px solid #334155',
                    padding: 28, marginBottom: 20,
                }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#818cf8', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BookMarked size={16} /> Select Subjects * (Choose one or more)
                    </h2>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                        {SUBJECTS.map((s) => (
                            <button
                                key={s}
                                type="button"
                                onClick={() => toggleSubject(s)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: 12,
                                    fontSize: 13,
                                    fontWeight: 600,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    background: subjects.includes(s) ? 'rgba(99,102,241,0.2)' : '#0f172a',
                                    color: subjects.includes(s) ? '#818cf8' : '#94a3b8',
                                    border: `1px solid ${subjects.includes(s) ? '#6366f1' : '#334155'}`,
                                }}
                            >
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Preferences */}
                <div style={{
                    background: '#1e293b', borderRadius: 20, border: '1px solid #334155',
                    padding: 28, marginBottom: 28,
                }}>
                    <h2 style={{ fontSize: 15, fontWeight: 700, color: '#818cf8', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Calendar size={16} /> Preferences
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>

                        <div>
                            <label style={labelStyle}>
                                <Calendar size={13} color="#6366f1" /> Preferred Day *
                            </label>
                            <select
                                className="input-field"
                                value={preferredDay}
                                onChange={(e) => setPreferredDay(e.target.value)}
                                required
                            >
                                <option value="">Select day</option>
                                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>

                        <div>
                            <label style={labelStyle}>
                                <Calendar size={13} color="#6366f1" /> Preferred Date (Optional)
                            </label>
                            <input
                                type="date"
                                className="input-field"
                                value={preferredDate}
                                onChange={(e) => setPreferredDate(e.target.value)}
                                style={{ colorScheme: 'dark' }}
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>
                                <Clock size={13} color="#6366f1" /> Preferred Time Slot (2 hr) *
                            </label>
                            <select
                                className="input-field"
                                value={preferredSlot}
                                onChange={(e) => setPreferredSlot(e.target.value)}
                                required
                            >
                                <option value="">Select time slot</option>
                                {TIME_SLOTS.map((sl) => <option key={sl} value={sl}>{sl}</option>)}
                            </select>
                        </div>

                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="btn-primary" disabled={submitting} style={{ padding: '13px 32px', fontSize: 15 }}>
                        {submitting ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="30" strokeDashoffset="10" />
                                </svg>
                                Submitting...
                            </span>
                        ) : (
                            <><Send size={16} /> Submit Inquiry</>
                        )}
                    </button>
                </div>
            </form>

            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

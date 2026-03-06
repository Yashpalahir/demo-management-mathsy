'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Student, type Teacher } from '@/lib/supabase';
import { generateWhatsAppLink, formatDate } from '@/lib/utils';
import { UserCheck, MessageCircle, Search, Filter, CheckCircle2, CheckCircle, XCircle, Download } from 'lucide-react';
import { exportToExcel } from '@/lib/excel';

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    const [bookedSlots, setBookedSlots] = useState<any[]>([]);
    const [demoOutcomeModal, setDemoOutcomeModal] = useState<Student | null>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => { fetchAssignments(); }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        const [sRes, bRes] = await Promise.all([
            supabase.from('students').select('*, teacher:teachers(*)').eq('status', 'assigned').order('created_at', { ascending: false }),
            supabase.from('timeslots').select('*').eq('is_booked', true),
        ]);
        setAssignments(sRes.data || []);
        setBookedSlots(bRes.data || []);
        setLoading(false);
    };

    const handleDemoOutcome = async (outcome: 'successful' | 'failed' | 'not_interested') => {
        if (!demoOutcomeModal) return;
        setSaving(true);
        try {
            let res;
            if (outcome === 'successful') {
                res = await supabase.from('students')
                    .update({ status: 'finalized', demo_status: 'successful' })
                    .eq('id', demoOutcomeModal.id);
            } else if (outcome === 'failed') {
                const existingBooking = bookedSlots.find(b => b.student_id === demoOutcomeModal.id);
                if (existingBooking) {
                    await supabase.from('timeslots').delete().eq('id', existingBooking.id);
                }
                res = await supabase.from('students')
                    .update({ status: 'unassigned', assigned_teacher_id: null, demo_status: 'failed' })
                    .eq('id', demoOutcomeModal.id);
            } else if (outcome === 'not_interested') {
                const existingBooking = bookedSlots.find(b => b.student_id === demoOutcomeModal.id);
                if (existingBooking) {
                    await supabase.from('timeslots').delete().eq('id', existingBooking.id);
                }
                res = await supabase.from('students')
                    .update({ status: 'not_interested', assigned_teacher_id: null, demo_status: 'failed' })
                    .eq('id', demoOutcomeModal.id);
            }

            if (res?.error) {
                alert(`Error: ${res.error.message}\nEnsure your database schema (students table) has 'demo_status' column and allowing 'finalized' status.`);
            } else {
                setDemoOutcomeModal(null);
                fetchAssignments();
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const filtered = assignments.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        ((s as any).teacher as Teacher)?.name?.toLowerCase().includes(search.toLowerCase())
    );

    const handleExport = () => {
        const data = filtered.map(s => ({
            'Student': s.name,
            'Standard': s.standard,
            'Subjects': s.subjects.join(', '),
            'Teacher': (s as any).teacher?.name || 'N/A',
            'Day': s.preferred_day,
            'Slot': s.preferred_slot,
            'Status': s.status,
            'Demo Status': s.demo_status || 'Pending'
        }));
        exportToExcel(data, `Assignments_Export_${new Date().toISOString().split('T')[0]}`);
    };

    return (
        <div className="animate-fadeIn">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <UserCheck size={18} color="white" />
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Assignments / Demos</h1>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>{assignments.length} demos currently scheduled</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                        <input className="input-field" style={{ paddingLeft: 36, width: 220 }} placeholder="Search assignments..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Download size={16} /> Export
                    </button>
                </div>
            </div>

            {/* Outcome Modal */}
            {demoOutcomeModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setDemoOutcomeModal(null)}>
                    <div className="glass" style={{ borderRadius: 20, width: '100%', maxWidth: 460, padding: 32 }}>
                        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Demo Outcome</h2>
                        <p style={{ color: '#94a3b8', fontSize: 14, marginBottom: 24 }}>What was the result of the demo for <b>{demoOutcomeModal.name}</b>?</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <button className="btn-success" onClick={() => handleDemoOutcome('successful')} style={{ justifyContent: 'center', padding: 14 }}>
                                <CheckCircle size={18} /> Demo Successful (Finalize)
                            </button>
                            <button className="btn-warning" onClick={() => handleDemoOutcome('failed')} style={{ justifyContent: 'center', padding: 14, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', borderColor: '#f59e0b' }}>
                                <UserCheck size={18} /> Demo Failed (Re-assign)
                            </button>
                            <button className="btn-danger" onClick={() => handleDemoOutcome('not_interested')} style={{ justifyContent: 'center', padding: 14 }}>
                                <XCircle size={18} /> Student Not Interested
                            </button>
                            <button className="btn-secondary" onClick={() => setDemoOutcomeModal(null)} style={{ justifyContent: 'center', padding: 12, marginTop: 12 }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Loading...</div>
            ) : filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: 60,
                    background: '#1e293b', borderRadius: 16, border: '1px dashed #334155',
                }}>
                    <UserCheck size={48} color="#334155" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#475569' }}>No assignments found.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
                    {filtered.map((s) => {
                        const teacher = (s as any).teacher as Teacher;
                        const waLink = teacher ? generateWhatsAppLink(teacher.mobile, teacher.name, s.name, s.standard, s.address, s.preferred_day, s.preferred_slot, s.mobile, s.preferred_date) : '';
                        return (
                            <div key={s.id} className="card-hover" style={{
                                background: '#1e293b', borderRadius: 16, border: '1px solid #334155',
                                padding: 20, position: 'relative', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column'
                            }}>
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                                    background: 'linear-gradient(90deg, #ef4444, #991b1b)',
                                }} />

                                {/* Assigned badge */}
                                <div style={{
                                    position: 'absolute', top: 16, right: 16,
                                    background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                                    border: '1px solid rgba(239,68,68,0.3)',
                                    borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    <CheckCircle2 size={11} /> Demo Status: {s.demo_status || 'Pending'}
                                </div>

                                {/* Student info */}
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontWeight: 700, fontSize: 17, color: '#f1f5f9', marginBottom: 4 }}>{s.name}</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>
                                        {s.standard} · {s.board} · {s.subjects.join(', ')}
                                    </div>
                                    <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                                        📞 {s.mobile} · Parent: {s.parent_name}
                                    </div>
                                </div>

                                {/* Divider */}
                                <div style={{ borderTop: '1px solid #334155', marginBottom: 16 }} />

                                {/* Teacher info */}
                                {teacher && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                                        <div style={{
                                            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 16, fontWeight: 700, color: 'white',
                                        }}>
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{teacher.name}</div>
                                            <div style={{ fontSize: 12, color: '#64748b' }}>{teacher.mobile}</div>
                                        </div>
                                    </div>
                                )}

                                {/* Slot info */}
                                <div style={{ display: 'flex', gap: 12, marginBottom: 20, flex: 1 }}>
                                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 12px', flex: 1 }}>
                                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>DAY</div>
                                        <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{s.preferred_day}</div>
                                    </div>
                                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 12px', flex: 2 }}>
                                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>TIME</div>
                                        <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{s.preferred_slot}</div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: 10 }}>
                                    <button
                                        className="btn-success"
                                        onClick={() => setDemoOutcomeModal(s)}
                                        style={{ flex: 1, justifyContent: 'center', fontSize: 13 }}
                                    >
                                        <CheckCircle size={14} /> Mark Result
                                    </button>
                                    {teacher && (
                                        <a
                                            href={waLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                background: 'rgba(37,211,102,0.1)', color: '#25d366',
                                                border: '1px solid rgba(37,211,102,0.2)',
                                                borderRadius: 10, width: 44, padding: 0
                                            }}
                                            title="WhatsApp Teacher"
                                        >
                                            <MessageCircle size={18} />
                                        </a>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

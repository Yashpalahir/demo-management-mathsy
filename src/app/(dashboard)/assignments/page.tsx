'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Student, type Teacher } from '@/lib/supabase';
import { generateWhatsAppLink, formatDate } from '@/lib/utils';
import { UserCheck, MessageCircle, Search, Filter, CheckCircle2 } from 'lucide-react';

export default function AssignmentsPage() {
    const [assignments, setAssignments] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchAssignments(); }, []);

    const fetchAssignments = async () => {
        setLoading(true);
        const { data } = await supabase
            .from('students')
            .select('*, teacher:teachers(*)')
            .eq('status', 'assigned')
            .order('created_at', { ascending: false });
        setAssignments(data || []);
        setLoading(false);
    };

    const filtered = assignments.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        ((s as any).teacher as Teacher)?.name?.toLowerCase().includes(search.toLowerCase())
    );

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
                        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Assignments</h1>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>{assignments.length} active teacher-student assignments</p>
                </div>
                <div style={{ position: 'relative' }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                    <input className="input-field" style={{ paddingLeft: 36, width: 220 }} placeholder="Search assignments..." value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
            </div>

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
                        const waLink = teacher ? generateWhatsAppLink(teacher.mobile, teacher.name, s.name, s.standard, s.address, s.preferred_day, s.preferred_slot, s.mobile) : '';
                        return (
                            <div key={s.id} className="card-hover" style={{
                                background: '#1e293b', borderRadius: 16, border: '1px solid #334155',
                                padding: 20, position: 'relative', overflow: 'hidden',
                            }}>
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                                    background: 'linear-gradient(90deg, #10b981, #06b6d4)',
                                }} />

                                {/* Assigned badge */}
                                <div style={{
                                    position: 'absolute', top: 16, right: 16,
                                    background: 'rgba(16,185,129,0.15)', color: '#10b981',
                                    border: '1px solid rgba(16,185,129,0.3)',
                                    borderRadius: 999, padding: '2px 10px', fontSize: 11, fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: 4,
                                }}>
                                    <CheckCircle2 size={11} /> Assigned
                                </div>

                                {/* Student info */}
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontWeight: 700, fontSize: 17, color: '#f1f5f9', marginBottom: 4 }}>{s.name}</div>
                                    <div style={{ fontSize: 12, color: '#64748b' }}>
                                        {s.standard} · {s.board} · {s.subject}
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
                                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 12px', flex: 1 }}>
                                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>DAY</div>
                                        <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{s.preferred_day}</div>
                                    </div>
                                    <div style={{ background: '#0f172a', borderRadius: 8, padding: '8px 12px', flex: 2 }}>
                                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 2 }}>TIME</div>
                                        <div style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{s.preferred_slot}</div>
                                    </div>
                                </div>

                                {/* WhatsApp button */}
                                {teacher && (
                                    <a
                                        href={waLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                            background: 'linear-gradient(135deg, #25d366, #128c7e)',
                                            color: 'white', borderRadius: 10, padding: '10px 16px',
                                            textDecoration: 'none', fontWeight: 700, fontSize: 14,
                                            transition: 'all 0.2s', boxShadow: '0 4px 15px rgba(37,211,102,0.2)',
                                        }}
                                    >
                                        <MessageCircle size={16} /> Send WhatsApp to Teacher
                                    </a>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

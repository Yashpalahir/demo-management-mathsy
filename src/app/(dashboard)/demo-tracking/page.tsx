'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Student, type Teacher } from '@/lib/supabase';
import { DAYS } from '@/lib/constants';
import { Calendar, Users, CheckCircle, XCircle, Clock, Filter, ChevronLeft, ChevronRight, BarChart2 } from 'lucide-react';

export default function DemoTrackingPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<string>('All');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        const [sRes, tRes] = await Promise.all([
            supabase.from('students')
                .select('*, teacher:teachers(*)')
                .in('status', ['assigned', 'finalized', 'not_interested'])
                .order('created_at', { ascending: false }),
            supabase.from('teachers').select('*').eq('status', 'active'),
        ]);
        setStudents(sRes.data || []);
        setTeachers(tRes.data || []);
        setLoading(false);
    };

    const getDemosForTeacherAndDay = (teacherId: string, day: string) => {
        return students.filter(s =>
            s.assigned_teacher_id === teacherId &&
            s.preferred_day === day
        );
    };

    const getSuccessCount = (teacherId: string) => {
        return students.filter(s =>
            s.assigned_teacher_id === teacherId &&
            s.status === 'finalized'
        ).length;
    };

    const getTotalDemoCount = (teacherId: string) => {
        return students.filter(s =>
            s.assigned_teacher_id === teacherId &&
            (s.status === 'assigned' || s.status === 'finalized' || s.status === 'not_interested')
        ).length;
    };

    const filteredDays = selectedDay === 'All' ? DAYS : [selectedDay];

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BarChart2 size={18} color="white" />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>Demo Tracking</h1>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>Track weekly demos, conversion rates, and teacher performance.</p>
            </div>

            {/* Filters & Quick Stats */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
                    {['All', ...DAYS].map(day => (
                        <button
                            key={day}
                            onClick={() => setSelectedDay(day)}
                            style={{
                                padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 600,
                                background: selectedDay === day ? 'rgba(245,158,11,0.15)' : '#1e293b',
                                color: selectedDay === day ? '#f59e0b' : '#94a3b8',
                                border: `1px solid ${selectedDay === day ? '#f59e0b' : '#334155'}`,
                                cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap'
                            }}
                        >
                            {day}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ background: '#1e293b', padding: '10px 16px', borderRadius: 12, border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <CheckCircle size={16} color="#10b981" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{students.filter(s => s.status === 'finalized').length} Converted</span>
                    </div>
                    <div style={{ background: '#1e293b', padding: '10px 16px', borderRadius: 12, border: '1px solid #334155', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Clock size={16} color="#ef4444" />
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9' }}>{students.filter(s => s.status === 'assigned').length} Initial Demos</span>
                    </div>
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Loading tracking data...</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    {teachers.map(teacher => {
                        const total = getTotalDemoCount(teacher.id);
                        const success = getSuccessCount(teacher.id);
                        const rate = total > 0 ? Math.round((success / total) * 100) : 0;

                        return (
                            <div key={teacher.id} style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
                                {/* Teacher Info Bar */}
                                <div style={{ padding: '16px 24px', background: 'rgba(15, 23, 42, 0.4)', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14
                                        }}>
                                            {teacher.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9' }}>{teacher.name}</div>
                                            <div style={{ fontSize: 11, color: '#64748b' }}>{teacher.subjects.join(', ')}</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: 24 }}>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>TOTAL TRIALS</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#f1f5f9' }}>{total}</div>
                                        </div>
                                        <div style={{ textAlign: 'center' }}>
                                            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>SUCCESS RATE</div>
                                            <div style={{ fontSize: 16, fontWeight: 700, color: '#10b981' }}>{rate}%</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Weekly Breakdown Container */}
                                <div style={{ padding: '20px 24px', overflowX: 'auto' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${filteredDays.length}, minmax(140px, 1fr))`, gap: 16 }}>
                                        {filteredDays.map(day => {
                                            const demos = getDemosForTeacherAndDay(teacher.id, day);
                                            return (
                                                <div key={`${teacher.id}-${day}`} style={{
                                                    background: '#0f172a', borderRadius: 12, border: '1px solid #1e293b',
                                                    minHeight: 120, display: 'flex', flexDirection: 'column'
                                                }}>
                                                    <div style={{ padding: '8px 12px', borderBottom: '1px solid #1e293b', fontSize: 12, fontWeight: 700, color: '#94a3b8' }}>
                                                        {day}
                                                    </div>
                                                    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                                                        {demos.length > 0 ? demos.map(demo => (
                                                            <div key={demo.id} style={{
                                                                padding: '6px 10px', borderRadius: 8, fontSize: 11,
                                                                background: demo.status === 'finalized' ? 'rgba(16,185,129,0.1)' : demo.status === 'assigned' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                                                                border: `1px solid ${demo.status === 'finalized' ? 'rgba(16,185,129,0.2)' : demo.status === 'assigned' ? 'rgba(239,68,68,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                                                color: demo.status === 'finalized' ? '#10b981' : demo.status === 'assigned' ? '#ef4444' : '#f59e0b',
                                                                position: 'relative'
                                                            }}>
                                                                <div style={{ fontWeight: 700, marginBottom: 2 }}>{demo.name}</div>
                                                                <div style={{ fontSize: 9, opacity: 0.8 }}>{demo.preferred_slot}</div>
                                                                <div style={{ position: 'absolute', top: 6, right: 6 }}>
                                                                    {demo.status === 'finalized' ? <CheckCircle size={10} /> : demo.status === 'assigned' ? <Clock size={10} /> : <XCircle size={10} />}
                                                                </div>
                                                            </div>
                                                        )) : (
                                                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#334155' }}>
                                                                No demos
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

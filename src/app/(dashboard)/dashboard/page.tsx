'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Teacher, type Student } from '@/lib/supabase';
import { isToday } from '@/lib/utils';
import {
    Users, GraduationCap, UserCheck, UserX,
    CalendarCheck, TrendingUp, BarChart3, Activity,
    PieChart as PieIcon, BarChart as BarIcon
} from 'lucide-react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';

type Stats = {
    total_students: number;
    assigned_students: number;
    unassigned_students: number;
    active_teachers: number;
    todays_demos: number;
};

export default function DashboardPage() {
    const [stats, setStats] = useState<Stats>({
        total_students: 0,
        assigned_students: 0,
        unassigned_students: 0,
        active_teachers: 0,
        todays_demos: 0,
    });
    const [recentStudents, setRecentStudents] = useState<Student[]>([]);
    const [subjectData, setSubjectData] = useState<{ name: string, value: number }[]>([]);
    const [statusData, setStatusData] = useState<{ name: string, value: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [studentsRes, teachersRes] = await Promise.all([
                supabase.from('students').select('*, teacher:teachers(name)'),
                supabase.from('teachers').select('*').eq('status', 'active'),
            ]);

            const students: Student[] = studentsRes.data || [];
            const activeTeachers: Teacher[] = teachersRes.data || [];

            const assigned = students.filter((s) => s.status === 'assigned');
            const unassigned = students.filter((s) => s.status === 'unassigned');
            const todayDemos = assigned.filter((s) => isToday(s.created_at));

            setStats({
                total_students: students.length,
                assigned_students: assigned.length,
                unassigned_students: unassigned.length,
                active_teachers: activeTeachers.length,
                todays_demos: todayDemos.length,
            });

            // Prepare Chart Data
            const subjects: { [key: string]: number } = {};
            students.forEach(s => {
                s.subjects.forEach(sub => {
                    subjects[sub] = (subjects[sub] || 0) + 1;
                });
            });
            setSubjectData(Object.keys(subjects).map(key => ({ name: key, value: subjects[key] })).sort((a, b) => b.value - a.value).slice(0, 5));

            setStatusData([
                { name: 'Assigned', value: assigned.length },
                { name: 'Unassigned', value: unassigned.length }
            ]);

            setRecentStudents(students.slice(0, 5));
        } catch (err) {
            console.error('Error fetching stats:', err);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6'];

    const statCards = [
        {
            title: 'Total Students',
            value: stats.total_students,
            icon: GraduationCap,
            color: '#6366f1',
            bg: 'rgba(99,102,241,0.1)',
        },
        {
            title: 'Assigned',
            value: stats.assigned_students,
            icon: UserCheck,
            color: '#10b981',
            bg: 'rgba(16,185,129,0.1)',
        },
        {
            title: 'Unassigned',
            value: stats.unassigned_students,
            icon: UserX,
            color: '#f59e0b',
            bg: 'rgba(245,158,11,0.1)',
        },
        {
            title: 'Active Teachers',
            value: stats.active_teachers,
            icon: Users,
            color: '#8b5cf6',
            bg: 'rgba(139,92,246,0.1)',
        },
        {
            title: "Today's Demos",
            value: stats.todays_demos,
            icon: CalendarCheck,
            color: '#06b6d4',
            bg: 'rgba(6,182,212,0.1)',
        },
    ];

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                <div style={{
                    width: 40, height: 40, borderRadius: '50%',
                    border: '3px solid #334155', borderTopColor: '#6366f1',
                    animation: 'spin 0.8s linear infinite',
                }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BarChart3 size={18} color="white" />
                    </div>
                    <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9' }}>Dashboard</h1>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>
                    Welcome back, Admin! Here&apos;s an overview of your assignments.
                </p>
            </div>

            {/* Stat Cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 20, marginBottom: 36,
            }}>
                {statCards.map(({ title, value, icon: Icon, color, bg }) => (
                    <div key={title} className="stat-card card-hover">
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                            <div style={{
                                width: 44, height: 44, borderRadius: 12,
                                background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Icon size={22} color={color} />
                            </div>
                            <Activity size={14} color="#475569" />
                        </div>
                        <div style={{ fontSize: 36, fontWeight: 800, color: '#f1f5f9', lineHeight: 1, marginBottom: 8 }}>
                            {value}
                        </div>
                        <div style={{ fontSize: 13, color: '#94a3b8', fontWeight: 500 }}>{title}</div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginBottom: 36 }}>
                {/* Pie Chart: Status */}
                <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <PieIcon size={18} color="#6366f1" />
                        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Assignment Status</h2>
                    </div>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                                    itemStyle={{ color: '#f1f5f9' }}
                                />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart: Subjects */}
                <div style={{ background: '#1e293b', borderRadius: 16, padding: 24, border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <BarIcon size={18} color="#10b981" />
                        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Top 5 Subjects</h2>
                    </div>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 8 }}
                                />
                                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Recent Students & Assignment Rate Container */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 28 }}>
                {/* Assignment Rate */}
                <div style={{
                    background: '#1e293b', borderRadius: 16, padding: 24,
                    border: '1px solid #334155',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <TrendingUp size={18} color="#6366f1" />
                        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Overall Rate</h2>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13, color: '#94a3b8' }}>
                            <span>Progress</span>
                            <span style={{ color: '#10b981', fontWeight: 700 }}>
                                {stats.total_students ? Math.round((stats.assigned_students / stats.total_students) * 100) : 0}%
                            </span>
                        </div>
                        <div style={{ height: 10, background: '#0f172a', borderRadius: 999, overflow: 'hidden' }}>
                            <div style={{
                                height: '100%',
                                width: `${stats.total_students ? (stats.assigned_students / stats.total_students) * 100 : 0}%`,
                                background: 'linear-gradient(90deg, #6366f1, #10b981)',
                                borderRadius: 999,
                                transition: 'width 1s ease',
                            }} />
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#64748b' }}>
                        <span>{stats.assigned_students} assigned</span>
                        <span>{stats.unassigned_students} pending</span>
                    </div>
                </div>

                {/* Quick Info */}
                <div style={{
                    background: '#1e293b', borderRadius: 16, padding: 24,
                    border: '1px solid #334155',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                        <Activity size={18} color="#10b981" />
                        <h2 style={{ fontSize: 16, fontWeight: 700 }}>Summary</h2>
                    </div>
                    {[
                        { label: 'Assigned Students', val: stats.assigned_students, color: '#10b981' },
                        { label: 'Unassigned Students', val: stats.unassigned_students, color: '#f59e0b' },
                        { label: 'Active Teachers', val: stats.active_teachers, color: '#6366f1' },
                        { label: "Today's Demos", val: stats.todays_demos, color: '#06b6d4' },
                    ].map(({ label, val, color }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                            <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color }}>{val}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Recent Students Table */}
            <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
                <div style={{
                    padding: '20px 24px', borderBottom: '1px solid #334155',
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <GraduationCap size={18} color="#6366f1" />
                    <h2 style={{ fontSize: 16, fontWeight: 700 }}>Recent Students</h2>
                </div>
                {recentStudents.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: '#475569' }}>
                        No students yet. Add your first inquiry!
                    </div>
                ) : (
                    <div className="table-container" style={{ border: 'none' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Standard</th>
                                    <th>Subjects</th>
                                    <th>Status</th>
                                    <th>Teacher</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentStudents.map((s) => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                                        <td style={{ color: '#94a3b8' }}>{s.standard}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                {s.subjects.slice(0, 2).map(sub => (
                                                    <span key={sub} style={{
                                                        background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                                                        padding: '2px 8px', borderRadius: 999, fontSize: 11,
                                                    }}>{sub}</span>
                                                ))}
                                                {s.subjects.length > 2 && <span style={{ fontSize: 11, color: '#64748b' }}>+{s.subjects.length - 2}</span>}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={s.status === 'assigned' ? 'badge-assigned' : 'badge-unassigned'}
                                                style={{ padding: '3px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                                                {s.status}
                                            </span>
                                        </td>
                                        <td style={{ color: '#94a3b8' }}>
                                            {(s as any).teacher?.name || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

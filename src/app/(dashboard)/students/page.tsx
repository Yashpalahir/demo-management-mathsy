'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Student, type Teacher, type TimeSlot } from '@/lib/supabase';
import { generateWhatsAppLink, formatDate } from '@/lib/utils';
import { SUBJECTS, DAYS, TIME_SLOTS, BOARDS, STANDARDS } from '@/lib/constants';
import { exportToExcel } from '@/lib/excel';
import { GraduationCap, UserCheck, UserX, Search, MessageCircle, UserPlus, X, Calendar, Phone, Clock, BookMarked, Pencil, Trash2, MapPin, Save, Download, Check, CheckCircle } from 'lucide-react';

export default function StudentsPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [bookedSlots, setBookedSlots] = useState<TimeSlot[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'assigned' | 'unassigned'>('all');

    // Assignment & Edit Modals
    const [assignModal, setAssignModal] = useState<Student | null>(null);
    const [matchedTeachers, setMatchedTeachers] = useState<Teacher[]>([]);
    const [assigning, setAssigning] = useState(false);

    const [editModal, setEditModal] = useState<Student | null>(null);
    const [saving, setSaving] = useState(false);

    const [demoOutcomeModal, setDemoOutcomeModal] = useState<Student | null>(null);

    useEffect(() => { fetchAll(); }, []);

    const fetchAll = async () => {
        setLoading(true);
        const [sRes, tRes, bRes] = await Promise.all([
            supabase.from('students').select('*, teacher:teachers(*)').order('created_at', { ascending: false }),
            supabase.from('teachers').select('*').eq('status', 'active'),
            supabase.from('timeslots').select('*').eq('is_booked', true),
        ]);
        setStudents(sRes.data || []);
        setTeachers(tRes.data || []);
        setBookedSlots(bRes.data || []);
        setLoading(false);
    };

    const openAssign = (student: Student) => {
        setAssignModal(student);
        const matches = teachers.filter((t) => {
            const subjectMatch = student.subjects.some(s => t.subjects.includes(s));
            const dayMatch = t.available_days.includes(student.preferred_day);
            // Updated for day-wise slots: Day|Slot format
            const slotMatch = t.available_slots.includes(`${student.preferred_day}|${student.preferred_slot}`);

            const isAlreadyBooked = bookedSlots.some(
                (slot) => slot.teacher_id === t.id &&
                    slot.day === student.preferred_day &&
                    slot.slot === student.preferred_slot
            );
            return subjectMatch && dayMatch && slotMatch && !isAlreadyBooked;
        });
        setMatchedTeachers(matches);
    };

    const assignTeacher = async (teacher: Teacher) => {
        if (!assignModal) return;
        setAssigning(true);
        try {
            await supabase.from('students')
                .update({ assigned_teacher_id: teacher.id, status: 'assigned', demo_status: 'pending' })
                .eq('id', assignModal.id);

            await supabase.from('timeslots').upsert({
                teacher_id: teacher.id,
                day: assignModal.preferred_day,
                slot: assignModal.preferred_slot,
                is_booked: true,
                student_id: assignModal.id,
            }, { onConflict: 'teacher_id,day,slot' });

            // Sync to Google Sheet
            try {
                await fetch('/api/sync-sheet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ student: assignModal, teacher }),
                });
            } catch (err) {
                console.error('Sheet Sync Error:', err);
            }

            setAssignModal(null);
            fetchAll();
        } finally {
            setAssigning(false);
        }
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
                alert(`Error: ${res.error.message}\nTip: Ensure your Supabase database schema allows 'finalized' and 'not_interested' status values and has 'demo_status' column.`);
            } else {
                setDemoOutcomeModal(null);
                fetchAll();
            }
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const unassignStudent = async (student: Student) => {
        if (!confirm('Remove teacher assignment for this student?')) return;
        const existingBooking = bookedSlots.find(b => b.student_id === student.id);
        if (existingBooking) {
            await supabase.from('timeslots').delete().eq('id', existingBooking.id);
        }
        await supabase.from('students').update({ assigned_teacher_id: null, status: 'unassigned', demo_status: null }).eq('id', student.id);
        fetchAll();
    };

    const deleteStudent = async (id: string) => {
        if (!confirm('Are you sure you want to delete this student permanently?')) return;
        await supabase.from('students').delete().eq('id', id);
        fetchAll();
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editModal) return;
        setSaving(true);
        try {
            const { error: err } = await supabase.from('students').update({
                name: editModal.name,
                standard: editModal.standard,
                parent_name: editModal.parent_name,
                board: editModal.board,
                address: editModal.address,
                mobile: editModal.mobile,
                student_mobile: editModal.student_mobile,
                subjects: editModal.subjects,
                preferred_day: editModal.preferred_day,
                preferred_date: editModal.preferred_date,
                preferred_slot: editModal.preferred_slot,
            }).eq('id', editModal.id);

            if (err) throw err;
            setEditModal(null);
            fetchAll();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setSaving(false);
        }
    };

    const filtered = students.filter((s) => {
        const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.subjects.some(sub => sub.toLowerCase().includes(search.toLowerCase())) ||
            s.standard.toLowerCase().includes(search.toLowerCase());
        const matchStatus = filterStatus === 'all' || s.status === filterStatus;
        return matchSearch && matchStatus;
    });

    const handleExport = () => {
        const data = filtered.map(s => ({
            'Student Name': s.name,
            'Standard': s.standard,
            'Subjects': s.subjects.join(', '),
            'Parent Name': s.parent_name,
            'Parent Mobile': s.mobile,
            'Student Mobile': s.student_mobile || 'N/A',
            'Board': s.board,
            'Address': s.address,
            'Preferred Day': s.preferred_day,
            'Preferred Date': s.preferred_date || 'N/A',
            'Preferred Slot': s.preferred_slot,
            'Status': s.status,
            'Demo Status': s.demo_status || 'N/A',
            'Teacher': (s as any).teacher?.name || 'Unassigned',
            'Created At': formatDate(s.created_at)
        }));
        exportToExcel(data, `Students_Export_${new Date().toISOString().split('T')[0]}`);
    };

    const toggleSubject = (s: string) => {
        if (!editModal) return;
        const newSubjects = editModal.subjects.includes(s)
            ? editModal.subjects.filter(x => x !== s)
            : [...editModal.subjects, s];
        setEditModal({ ...editModal, subjects: newSubjects });
    };

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <GraduationCap size={18} color="white" />
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Students</h1>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>{students.length} total students</p>
                </div>

                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
                        <input className="input-field" style={{ paddingLeft: 36, width: 200 }} placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>
                    <select className="input-field" style={{ width: 160 }} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                        <option value="all">All Status</option>
                        <option value="unassigned">Unassigned</option>
                        <option value="assigned">Demo Scheduled</option>
                        <option value="finalized">Finalized</option>
                        <option value="not_interested">Not Interested</option>
                    </select>
                    <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Download size={16} /> Export Excel
                    </button>
                </div>
            </div>

            {/* Status Tabs */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
                {[
                    { label: 'All', val: 'all', count: students.length, color: '#6366f1' },
                    { label: 'Unassigned', val: 'unassigned', count: students.filter(s => s.status === 'unassigned').length, color: '#94a3b8' },
                    { label: 'Demo', val: 'assigned', count: students.filter(s => s.status === 'assigned').length, color: '#ef4444' }, /* Red */
                    { label: 'Finalized', val: 'finalized', count: students.filter(s => s.status === 'finalized').length, color: '#10b981' }, /* Green */
                    { label: 'Not Interested', val: 'not_interested', count: students.filter(s => s.status === 'not_interested').length, color: '#f59e0b' }, /* Yellow */
                ].map(({ label, val, count, color }) => (
                    <button key={val} onClick={() => setFilterStatus(val as any)} style={{
                        background: filterStatus === val ? `rgba(${color === '#6366f1' ? '99,102,241' : color === '#94a3b8' ? '148,163,184' : color === '#ef4444' ? '239,68,68' : color === '#10b981' ? '16,185,129' : '245,158,11'},0.15)` : '#1e293b',
                        border: `1px solid ${filterStatus === val ? color : '#334155'}`,
                        borderRadius: 10, padding: '8px 16px', cursor: 'pointer',
                        color: filterStatus === val ? color : '#94a3b8',
                        fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8,
                        transition: 'all 0.2s',
                    }}>
                        {label} <span style={{
                            background: filterStatus === val ? color : '#334155',
                            color: filterStatus === val ? 'white' : '#94a3b8',
                            borderRadius: 999, padding: '1px 8px', fontSize: 11,
                        }}>{count}</span>
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Loading...</div>
            ) : filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: 60,
                    background: '#1e293b', borderRadius: 16, border: '1px dashed #334155',
                }}>
                    <GraduationCap size={48} color="#334155" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#475569' }}>No students found.</p>
                </div>
            ) : (
                <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
                    <div className="table-container" style={{ border: 'none' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Standard</th>
                                    <th>Subjects</th>
                                    <th>Schedule</th>
                                    <th>Status</th>
                                    <th>Teacher</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((s) => {
                                    const teacher = (s as any).teacher as Teacher | null;
                                    return (
                                        <tr key={s.id}>
                                            <td>
                                                <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{s.name}</div>
                                                <div style={{ fontSize: 11, color: '#64748b' }}>P: {s.mobile} {s.student_mobile ? `| S: ${s.student_mobile}` : ''}</div>
                                            </td>
                                            <td style={{ color: '#94a3b8' }}>{s.standard}</td>
                                            <td>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                                    {s.subjects.map(sub => (
                                                        <span key={sub} style={{
                                                            background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                                                            padding: '2px 8px', borderRadius: 999, fontSize: 11,
                                                        }}>{sub}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ color: '#94a3b8', fontSize: 12 }}>
                                                <div style={{ color: '#f1f5f9', fontWeight: 500 }}>{s.preferred_day}</div>
                                                <div style={{ color: '#64748b' }}>{s.preferred_slot}</div>
                                            </td>
                                            <td>
                                                <span className={
                                                    s.status === 'assigned' ? 'badge-assigned' :
                                                        s.status === 'unassigned' ? 'badge-unassigned' :
                                                            s.status === 'finalized' ? 'badge-active' : 'badge-warning'
                                                }
                                                    style={{ padding: '3px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700 }}>
                                                    {s.status === 'assigned' ? 'Demo' : s.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 13 }}>
                                                {teacher ? (
                                                    <div>
                                                        <div style={{ fontWeight: 600, color: '#f1f5f9' }}>{teacher.name}</div>
                                                        <div style={{ fontSize: 11, color: '#64748b' }}>{teacher.mobile}</div>
                                                    </div>
                                                ) : <span style={{ color: '#475569' }}>—</span>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                    <button className="btn-secondary" style={{ padding: '6px 10px' }} onClick={() => setEditModal(s)}>
                                                        <Pencil size={13} />
                                                    </button>

                                                    {s.status === 'unassigned' ? (
                                                        <button className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => openAssign(s)}>
                                                            <UserPlus size={13} /> Assign
                                                        </button>
                                                    ) : s.status === 'assigned' ? (
                                                        <>
                                                            <button
                                                                className="btn-success"
                                                                style={{ padding: '6px 12px', fontSize: 12 }}
                                                                onClick={() => setDemoOutcomeModal(s)}
                                                            >
                                                                <Check size={13} /> Result
                                                            </button>
                                                            {teacher && (
                                                                <a
                                                                    href={generateWhatsAppLink(teacher.mobile, teacher.name, s.name, s.standard, s.address, s.preferred_day, s.preferred_slot, s.mobile, s.preferred_date)}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    style={{
                                                                        background: 'rgba(37,211,102,0.15)', color: '#25d366',
                                                                        border: '1px solid rgba(37,211,102,0.3)',
                                                                        borderRadius: 8, padding: '6px 10px', fontSize: 12,
                                                                        display: 'flex', alignItems: 'center', gap: 5,
                                                                        textDecoration: 'none',
                                                                    }}
                                                                >
                                                                    <MessageCircle size={13} />
                                                                </a>
                                                            )}
                                                            <button className="btn-danger" style={{ padding: '6px 10px' }} onClick={() => unassignStudent(s)}>
                                                                <UserX size={13} />
                                                            </button>
                                                        </>
                                                    ) : null}

                                                    <button className="btn-danger" style={{ padding: '6px 10px', background: 'none', border: '1px solid #334155' }} onClick={() => deleteStudent(s.id)}>
                                                        <Trash2 size={13} color="#ef4444" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

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
                                <UserPlus size={18} /> Demo Failed (Re-assign)
                            </button>
                            <button className="btn-danger" onClick={() => handleDemoOutcome('not_interested')} style={{ justifyContent: 'center', padding: 14 }}>
                                <UserX size={18} /> Student Not Interested
                            </button>
                            <button className="btn-secondary" onClick={() => setDemoOutcomeModal(null)} style={{ justifyContent: 'center', padding: 12, marginTop: 12 }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setEditModal(null)}>
                    <div className="glass" style={{
                        borderRadius: 20, width: '100%', maxWidth: 680,
                        maxHeight: '90vh', overflowY: 'auto', padding: 32,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Edit Student</h2>
                            <button onClick={() => setEditModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdate}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Student Name</label>
                                    <input className="input-field" value={editModal.name} onChange={(e) => setEditModal({ ...editModal, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Standard / Grade</label>
                                    <select className="input-field" value={editModal.standard} onChange={(e) => setEditModal({ ...editModal, standard: e.target.value })} required>
                                        {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Parent Name</label>
                                    <input className="input-field" value={editModal.parent_name} onChange={(e) => setEditModal({ ...editModal, parent_name: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Education Board</label>
                                    <select className="input-field" value={editModal.board} onChange={(e) => setEditModal({ ...editModal, board: e.target.value })} required>
                                        {BOARDS.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Parent Mobile</label>
                                    <input className="input-field" value={editModal.mobile} onChange={(e) => setEditModal({ ...editModal, mobile: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Student Mobile</label>
                                    <input className="input-field" value={editModal.student_mobile || ''} onChange={(e) => setEditModal({ ...editModal, student_mobile: e.target.value })} />
                                </div>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Address</label>
                                    <input className="input-field" value={editModal.address} onChange={(e) => setEditModal({ ...editModal, address: e.target.value })} required />
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>Subjects</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {SUBJECTS.map((s) => (
                                        <button key={s} type="button" onClick={() => toggleSubject(s)} style={{
                                            padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                                            background: editModal.subjects.includes(s) ? 'rgba(99,102,241,0.15)' : '#0f172a',
                                            color: editModal.subjects.includes(s) ? '#818cf8' : '#64748b',
                                            border: `1px solid ${editModal.subjects.includes(s) ? '#6366f1' : '#334155'}`, cursor: 'pointer'
                                        }}>{s}</button>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Preferred Day</label>
                                    <select className="input-field" value={editModal.preferred_day} onChange={(e) => setEditModal({ ...editModal, preferred_day: e.target.value })} required>
                                        {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Preferred Date</label>
                                    <input type="date" className="input-field" value={editModal.preferred_date || ''} onChange={(e) => setEditModal({ ...editModal, preferred_date: e.target.value })} style={{ colorScheme: 'dark' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Time Slot</label>
                                    <select className="input-field" value={editModal.preferred_slot} onChange={(e) => setEditModal({ ...editModal, preferred_slot: e.target.value })} required>
                                        {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" className="btn-secondary" onClick={() => setEditModal(null)} style={{ flex: 1, justifyContent: 'center' }}>Cancel</button>
                                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 2, justifyContent: 'center' }}>
                                    {saving ? 'Saving...' : <><Save size={16} /> Save Changes</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Assign Modal */}
            {assignModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setAssignModal(null)}>
                    <div className="glass" style={{ borderRadius: 20, width: '100%', maxWidth: 560, padding: 32 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>Assign Teacher</h2>
                            <button onClick={() => setAssignModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 12 }}>{assignModal.name}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, color: '#94a3b8' }}>
                                <div style={{ gridColumn: 'span 2' }}><span style={{ color: '#6366f1' }}>Subjects:</span> {assignModal.subjects.join(', ')}</div>
                                <div><span style={{ color: '#6366f1' }}>Day:</span> {assignModal.preferred_day}</div>
                                <div><span style={{ color: '#6366f1' }}>Slot:</span> {assignModal.preferred_slot}</div>
                            </div>
                        </div>

                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8', marginBottom: 12 }}>{matchedTeachers.length > 0 ? 'Matching Teachers' : 'No matching teachers'}</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto' }}>
                            {matchedTeachers.map((t) => (
                                <div key={t.id} style={{ background: '#0f172a', borderRadius: 12, padding: 14, border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{t.name}</div>
                                        <div style={{ fontSize: 12, color: '#64748b' }}>{t.mobile}</div>
                                    </div>
                                    <button className="btn-success" disabled={assigning} onClick={() => assignTeacher(t)} style={{ padding: '8px 16px', fontSize: 13 }}>Assign</button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

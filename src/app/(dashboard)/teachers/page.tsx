'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Teacher } from '@/lib/supabase';
import { SUBJECTS, DAYS, TIME_SLOTS } from '@/lib/constants';
import { Users, Plus, Pencil, Trash2, Phone, X, Check, Save } from 'lucide-react';

type TeacherForm = Omit<Teacher, 'id' | 'created_at'>;

const emptyForm: TeacherForm = {
    name: '',
    mobile: '',
    subjects: [],
    available_days: [],
    available_slots: [],
    status: 'active',
};

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<Teacher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<TeacherForm>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');

    useEffect(() => { fetchTeachers(); }, []);

    const fetchTeachers = async () => {
        setLoading(true);
        const { data } = await supabase.from('teachers').select('*').order('created_at', { ascending: false });
        setTeachers(data || []);
        setLoading(false);
    };

    const openAdd = () => {
        setForm(emptyForm);
        setEditingId(null);
        setShowModal(true);
    };

    const openEdit = (t: Teacher) => {
        setForm({ name: t.name, mobile: t.mobile, subjects: t.subjects, available_days: t.available_days, available_slots: t.available_slots, status: t.status });
        setEditingId(t.id);
        setShowModal(true);
    };

    const toggleArray = (arr: string[], val: string): string[] =>
        arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await supabase.from('teachers').update(form).eq('id', editingId);
            } else {
                await supabase.from('teachers').insert([form]);
            }
            setShowModal(false);
            fetchTeachers();
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this teacher?')) return;
        await supabase.from('teachers').delete().eq('id', id);
        fetchTeachers();
    };

    const toggleStatus = async (t: Teacher) => {
        await supabase.from('teachers').update({ status: t.status === 'active' ? 'inactive' : 'active' }).eq('id', t.id);
        fetchTeachers();
    };

    const toggleDaySlot = (day: string, slot: string) => {
        const val = `${day}|${slot}`;
        setForm(prev => ({
            ...prev,
            available_slots: prev.available_slots.includes(val)
                ? prev.available_slots.filter((x) => x !== val)
                : [...prev.available_slots, val]
        }));
    };

    const getSlotsForDay = (day: string) => {
        return form.available_slots
            .filter(s => s.startsWith(`${day}|`))
            .map(s => s.split('|')[1]);
    };

    const filtered = teachers.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase()))
    );

    // Group slots by day for display
    const groupSlotsByDay = (slots: string[]) => {
        const grouped: Record<string, string[]> = {};
        slots.forEach(s => {
            if (s.includes('|')) {
                const [day, slot] = s.split('|');
                if (!grouped[day]) grouped[day] = [];
                grouped[day].push(slot);
            }
        });
        return grouped;
    };

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Users size={18} color="white" />
                        </div>
                        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Teachers</h1>
                    </div>
                    <p style={{ color: '#94a3b8', fontSize: 14 }}>{teachers.length} total teachers registered</p>
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                    <input
                        className="input-field"
                        style={{ width: 220 }}
                        placeholder="Search teachers..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    <button className="btn-primary" onClick={openAdd}>
                        <Plus size={16} /> Add Teacher
                    </button>
                </div>
            </div>

            {/* Teachers Grid */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: 60, color: '#475569' }}>Loading...</div>
            ) : filtered.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: 60,
                    background: '#1e293b', borderRadius: 16, border: '1px solid #334155',
                }}>
                    <Users size={48} color="#334155" style={{ margin: '0 auto 16px' }} />
                    <p style={{ color: '#475569', fontSize: 16 }}>No teachers found. Add your first teacher!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {filtered.map((t) => {
                        const groupedSlots = groupSlotsByDay(t.available_slots);
                        const daysWithSlots = Object.keys(groupedSlots);

                        return (
                            <div key={t.id} className="card-hover" style={{
                                background: '#1e293b', borderRadius: 16, border: '1px solid #334155',
                                padding: 20, position: 'relative', overflow: 'hidden',
                                display: 'flex', flexDirection: 'column'
                            }}>
                                {/* Color accent */}
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                                    background: t.status === 'active'
                                        ? 'linear-gradient(90deg, #6366f1, #10b981)'
                                        : 'linear-gradient(90deg, #475569, #334155)',
                                }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{
                                            width: 44, height: 44, borderRadius: 12,
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: 18, fontWeight: 700, color: 'white',
                                        }}>
                                            {t.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 16, color: '#f1f5f9' }}>{t.name}</div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                                <Phone size={11} color="#6366f1" />
                                                <span style={{ fontSize: 12, color: '#94a3b8' }}>{t.mobile}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleStatus(t)}
                                        className={t.status === 'active' ? 'badge-active' : 'badge-inactive'}
                                        style={{ padding: '4px 12px', borderRadius: 999, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: 'none' }}
                                    >
                                        {t.status}
                                    </button>
                                </div>

                                {/* Subjects */}
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 8, letterSpacing: '0.05em' }}>SUBJECTS</div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {t.subjects.map((s) => (
                                            <span key={s} style={{
                                                background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                                                padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 500,
                                            }}>{s}</span>
                                        ))}
                                    </div>
                                </div>

                                {/* Day-wise Availability */}
                                <div style={{ marginBottom: 20, flex: 1 }}>
                                    <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 8, letterSpacing: '0.05em' }}>AVAILABILITY</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                        {t.available_days.map(day => (
                                            <div key={day} style={{ background: 'rgba(30, 41, 59, 0.5)', borderRadius: 8, padding: '6px 10px', border: '1px solid rgba(51, 65, 85, 0.5)' }}>
                                                <div style={{ fontSize: 12, fontWeight: 600, color: '#f1f5f9', marginBottom: 2 }}>{day}</div>
                                                <div style={{ fontSize: 11, color: '#94a3b8' }}>
                                                    {groupedSlots[day]?.length > 0
                                                        ? groupedSlots[day].join(', ')
                                                        : <span style={{ fontStyle: 'italic', color: '#475569' }}>No slots selected</span>
                                                    }
                                                </div>
                                            </div>
                                        ))}
                                        {t.available_days.length === 0 && (
                                            <div style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>No days selected</div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: 8, borderTop: '1px solid #334155', paddingTop: 16 }}>
                                    <button className="btn-secondary" onClick={() => openEdit(t)} style={{ flex: 1, justifyContent: 'center', padding: '8px' }}>
                                        <Pencil size={14} /> Edit
                                    </button>
                                    <button className="btn-danger" onClick={() => handleDelete(t.id)} style={{ padding: '8px 12px' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="glass" style={{
                        borderRadius: 20, width: '100%', maxWidth: 700,
                        maxHeight: '90vh', overflowY: 'auto', padding: 32,
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <h2 style={{ fontSize: 20, fontWeight: 700 }}>
                                {editingId ? 'Edit Teacher' : 'Add New Teacher'}
                            </h2>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSave}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Teacher Name *</label>
                                    <input className="input-field" placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Mobile (WhatsApp) *</label>
                                    <input className="input-field" placeholder="10-digit number" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })} required />
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>Subjects *</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {SUBJECTS.map((s) => (
                                        <label key={s} className="checkbox-label" style={{ background: form.subjects.includes(s) ? 'rgba(99,102,241,0.15)' : '', borderColor: form.subjects.includes(s) ? 'rgba(99,102,241,0.4)' : '' }}>
                                            <input type="checkbox" checked={form.subjects.includes(s)} onChange={() => setForm({ ...form, subjects: toggleArray(form.subjects, s) })} />
                                            {s}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#10b981', marginBottom: 12 }}>1. Select Available Days</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {DAYS.map((d) => (
                                        <label key={d} className="checkbox-label" style={{
                                            background: form.available_days.includes(d) ? 'rgba(16,185,129,0.12)' : '',
                                            borderColor: form.available_days.includes(d) ? 'rgba(16,185,129,0.3)' : '',
                                            padding: '8px 16px'
                                        }}>
                                            <input type="checkbox" checked={form.available_days.includes(d)} onChange={() => setForm({ ...form, available_days: toggleArray(form.available_days, d) })} />
                                            {d}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {form.available_days.length > 0 && (
                                <div style={{ marginBottom: 24, padding: 20, background: 'rgba(15, 23, 42, 0.4)', borderRadius: 16, border: '1px solid #334155' }}>
                                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#f59e0b', marginBottom: 16 }}>2. Assign Time Slots for Each Day</label>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        {form.available_days.map(day => (
                                            <div key={day} style={{ borderBottom: '1px solid #334155', paddingBottom: 16 }}>
                                                <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', marginBottom: 10 }}>{day}</div>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                    {TIME_SLOTS.map((sl) => {
                                                        const isSelected = form.available_slots.includes(`${day}|${sl}`);
                                                        return (
                                                            <label key={`${day}-${sl}`} className="checkbox-label" style={{
                                                                background: isSelected ? 'rgba(245,158,11,0.12)' : '',
                                                                borderColor: isSelected ? 'rgba(245,158,11,0.3)' : '',
                                                                fontSize: 11
                                                            }}>
                                                                <input type="checkbox" checked={isSelected} onChange={() => toggleDaySlot(day, sl)} />
                                                                {sl}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div style={{ marginBottom: 24 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 8 }}>Status</label>
                                <select className="input-field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as 'active' | 'inactive' })}>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: 'center' }}>
                                    <X size={16} /> Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={saving} style={{ flex: 2, justifyContent: 'center' }}>
                                    {saving ? 'Saving...' : <><Save size={16} /> {editingId ? 'Update Teacher' : 'Add Teacher'}</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

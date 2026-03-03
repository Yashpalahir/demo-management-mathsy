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

    const filtered = teachers.filter((t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.subjects.some((s) => s.toLowerCase().includes(search.toLowerCase()))
    );

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
                    {filtered.map((t) => (
                        <div key={t.id} className="card-hover" style={{
                            background: '#1e293b', borderRadius: 16, border: '1px solid #334155',
                            padding: 20, position: 'relative', overflow: 'hidden',
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
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>SUBJECTS</div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {t.subjects.map((s) => (
                                        <span key={s} style={{
                                            background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                                            padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
                                        }}>{s}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Days */}
                            <div style={{ marginBottom: 12 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>AVAILABLE DAYS</div>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.available_days.join(', ') || '—'}</div>
                            </div>

                            {/* Slots */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>TIME SLOTS ({t.available_slots.length})</div>
                                <div style={{ fontSize: 12, color: '#94a3b8' }}>{t.available_slots.slice(0, 2).join(', ')}{t.available_slots.length > 2 ? ` +${t.available_slots.length - 2} more` : ''}</div>
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
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowModal(false)}>
                    <div className="glass" style={{
                        borderRadius: 20, width: '100%', maxWidth: 640,
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

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>Available Days *</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {DAYS.map((d) => (
                                        <label key={d} className="checkbox-label" style={{ background: form.available_days.includes(d) ? 'rgba(16,185,129,0.12)' : '', borderColor: form.available_days.includes(d) ? 'rgba(16,185,129,0.3)' : '' }}>
                                            <input type="checkbox" checked={form.available_days.includes(d)} onChange={() => setForm({ ...form, available_days: toggleArray(form.available_days, d) })} />
                                            {d}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94a3b8', marginBottom: 10 }}>Available Time Slots *</label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {TIME_SLOTS.map((sl) => (
                                        <label key={sl} className="checkbox-label" style={{ background: form.available_slots.includes(sl) ? 'rgba(245,158,11,0.12)' : '', borderColor: form.available_slots.includes(sl) ? 'rgba(245,158,11,0.3)' : '' }}>
                                            <input type="checkbox" checked={form.available_slots.includes(sl)} onChange={() => setForm({ ...form, available_slots: toggleArray(form.available_slots, sl) })} />
                                            {sl}
                                        </label>
                                    ))}
                                </div>
                            </div>

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

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { type Student, type Payment } from '@/lib/supabase';
import { Wallet, Search, Filter, Plus, FileText, Send, CheckCircle, Clock, Download } from 'lucide-react';
import { format } from 'date-fns';
import { generateFeeReceipt } from '@/lib/pdf';
import { exportToExcel } from '@/lib/excel';
import { STANDARDS } from '@/lib/constants';

export default function FeesPage() {
    const [students, setStudents] = useState<Student[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStandard, setSelectedStandard] = useState<string>('all');
    const [feeModal, setFeeModal] = useState<Student | null>(null);
    const [paymentModal, setPaymentModal] = useState<Student | null>(null);
    const [saving, setSaving] = useState(false);

    // Fee Form State
    const [finalizedFees, setFinalizedFees] = useState<number>(0);

    // Payment Form State
    const [amount, setAmount] = useState<number>(0);
    const [monthsPaid, setMonthsPaid] = useState<number>(1);
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        const [sRes, pRes] = await Promise.all([
            supabase.from('students')
                .select('*, teacher:teachers(name)')
                .eq('status', 'finalized')
                .order('name'),
            supabase.from('payments').select('*').order('created_at', { ascending: false }),
        ]);
        setStudents(sRes.data || []);
        setPayments(pRes.data || []);
        setLoading(false);
    };

    const handleSetFee = async () => {
        if (!feeModal) return;
        setSaving(true);
        try {
            const { error } = await supabase.from('students')
                .update({ finalized_fees: finalizedFees })
                .eq('id', feeModal.id);

            if (error) alert(error.message);
            else {
                setFeeModal(null);
                fetchAll();
            }
        } finally {
            setSaving(false);
        }
    };

    const handleAddPayment = async () => {
        if (!paymentModal) return;
        setSaving(true);
        try {
            const { data: payData, error } = await supabase.from('payments').insert([{
                student_id: paymentModal.id,
                amount,
                months_paid: monthsPaid,
                remarks
            }]).select().single();

            if (error) alert(error.message);
            else {
                // Sync to Google Sheets
                try {
                    await fetch('/api/sync-sheet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'payment',
                            student: paymentModal,
                            payment: payData
                        }),
                    });
                } catch (err) {
                    console.error('Sheet Sync Error:', err);
                }

                setPaymentModal(null);
                fetchAll();
                alert('Payment added successfully!');
            }
        } finally {
            setSaving(false);
        }
    };

    const sendReceipt = async (student: Student, payment: Payment) => {
        const { whatsAppLink } = await generateFeeReceipt(student, payment);
        window.open(whatsAppLink, '_blank');
    };

    const filtered = students.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.mobile.includes(searchTerm);
        const matchesStandard = selectedStandard === 'all' || s.standard === selectedStandard;
        return matchesSearch && matchesStandard;
    });

    const handleExport = () => {
        const data = filtered.map(s => {
            const studentPayments = payments.filter(p => p.student_id === s.id);
            const totalPaid = getTotalPaidByStudent(s.id);
            const lastPayment = studentPayments[0];
            const monthsCovered = getMonthsPaidByStudent(s.id);

            return {
                'Student Name': s.name,
                'Mobile': s.mobile,
                'Standard': s.standard,
                'Monthly Fee': s.finalized_fees || 0,
                'Total Paid': totalPaid,
                'Months Covered': monthsCovered,
                'Last Payment Date': lastPayment ? format(new Date(lastPayment.payment_date), 'dd MMM yyyy') : 'No payments',
                'Teacher': (s as any).teacher?.name || 'N/A'
            };
        });
        exportToExcel(data, `Fee_Report_${format(new Date(), 'yyyy-MM-dd')}`);
    };

    const getTotalPaidByStudent = (studentId: string) => {
        return payments.filter(p => p.student_id === studentId).reduce((acc, curr) => acc + curr.amount, 0);
    };

    const getMonthsPaidByStudent = (studentId: string) => {
        return payments.filter(p => p.student_id === studentId).reduce((acc, curr) => acc + curr.months_paid, 0);
    };

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
                        <Wallet size={18} color="white" />
                    </div>
                    <h1 style={{ fontSize: 24, fontWeight: 700 }}>Fee Management</h1>
                </div>
                <p style={{ color: '#94a3b8', fontSize: 14 }}>Track finalized student fees, payments, and generated receipts.</p>
            </div>

            {/* Quick Stats Header */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 24 }}>
                <div style={{ background: '#1e293b', padding: 20, borderRadius: 16, border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                        <CheckCircle size={14} /> Total Collected
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>INR {payments.reduce((acc, p) => acc + p.amount, 0)}</div>
                </div>
                <div style={{ background: '#1e293b', padding: 20, borderRadius: 16, border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#fde047', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                        <Clock size={14} /> Monthly Expected
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800 }}>INR {students.reduce((acc, s) => acc + (s.finalized_fees || 0), 0)}</div>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
                    <Search size={18} color="#475569" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        className="input-field"
                        placeholder="Search student or mobile..."
                        style={{ paddingLeft: 44, width: '100%' }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <select
                    className="input-field"
                    style={{ width: 180 }}
                    value={selectedStandard}
                    onChange={(e) => setSelectedStandard(e.target.value)}
                >
                    <option value="all">All Standards</option>
                    {STANDARDS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <button className="btn-secondary" onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Download size={18} /> Export Excel
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 100, color: '#445164' }}>Loading...</div>
            ) : filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 60, background: '#1e293b', borderRadius: 16, border: '1px dashed #334155', color: '#475569' }}>
                    No finalized students found.
                </div>
            ) : (
                <div style={{ background: '#1e293b', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden' }}>
                    <div className="table-container" style={{ border: 'none' }}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Student</th>
                                    <th>Finalized Fee</th>
                                    <th>Total Paid</th>
                                    <th>Months Covered</th>
                                    <th>Last Payment</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(s => {
                                    const studentPayments = payments.filter(p => p.student_id === s.id);
                                    const totalPaid = getTotalPaidByStudent(s.id);
                                    const lastPayment = studentPayments[0];
                                    const monthsCovered = getMonthsPaidByStudent(s.id);

                                    return (
                                        <tr key={s.id}>
                                            <td style={{ fontWeight: 600 }}>
                                                {s.name}
                                                <div style={{ fontSize: 11, fontWeight: 400, color: '#94a3b8' }}>{s.mobile} | {s.standard}</div>
                                            </td>
                                            <td>
                                                <button
                                                    onClick={() => { setFeeModal(s); setFinalizedFees(s.finalized_fees || 0); }}
                                                    style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 700, cursor: 'pointer', textAlign: 'left', padding: 0 }}
                                                >
                                                    {s.finalized_fees ? `INR ${s.finalized_fees}` : 'Set Fee'}
                                                </button>
                                            </td>
                                            <td style={{ color: '#94a3b8', fontWeight: 600 }}>INR {totalPaid}</td>
                                            <td>
                                                <span style={{
                                                    background: 'rgba(99,102,241,0.1)', color: '#818cf8',
                                                    padding: '2px 8px', borderRadius: 999, fontSize: 12, fontWeight: 700
                                                }}>
                                                    {monthsCovered} month(s)
                                                </span>
                                            </td>
                                            <td style={{ fontSize: 12, color: '#475569' }}>
                                                {lastPayment ? format(new Date(lastPayment.payment_date), 'dd MMM yyyy') : 'No payments'}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    <button
                                                        className="btn-success"
                                                        style={{ padding: '6px 12px', fontSize: 12 }}
                                                        onClick={() => {
                                                            setPaymentModal(s);
                                                            setAmount(s.finalized_fees || 0);
                                                            setMonthsPaid(1);
                                                            setRemarks('');
                                                        }}
                                                    >
                                                        <Plus size={14} /> Add Payment
                                                    </button>
                                                    {lastPayment && (
                                                        <button
                                                            className="btn-secondary"
                                                            style={{ padding: '6px 12px', fontSize: 12 }}
                                                            onClick={() => sendReceipt(s, lastPayment)}
                                                        >
                                                            <FileText size={14} /> Receipt
                                                        </button>
                                                    )}
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

            {/* Set Finalized Fee Modal */}
            {feeModal && (
                <div className="modal-overlay">
                    <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, width: 440, border: '1px solid #334155' }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 24 }}>Set Finalized Fees</h2>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Monthly Fee (INR)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={finalizedFees}
                                onChange={(e) => setFinalizedFees(Number(e.target.value))}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => setFeeModal(null)}>Cancel</button>
                            <button className="btn-primary" onClick={handleSetFee} disabled={saving}>Save Fee</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Payment Modal */}
            {paymentModal && (
                <div className="modal-overlay">
                    <div style={{ background: '#1e293b', borderRadius: 16, padding: 32, width: 480, border: '1px solid #334155' }}>
                        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 24 }}>Add Fee Payment</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Amount Paid</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={amount}
                                    onChange={(e) => setAmount(Number(e.target.value))}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Months Paid</label>
                                <input
                                    type="number"
                                    className="input-field"
                                    value={monthsPaid}
                                    onChange={(e) => setMonthsPaid(Number(e.target.value))}
                                />
                            </div>
                        </div>
                        <div style={{ marginBottom: 24 }}>
                            <label style={{ display: 'block', fontSize: 13, color: '#94a3b8', marginBottom: 8 }}>Remarks (e.g., Pay mode, Month name)</label>
                            <input
                                className="input-field"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="e.g. Paid for March via GPay"
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                            <button className="btn-secondary" onClick={() => setPaymentModal(null)}>Cancel</button>
                            <button className="btn-primary" onClick={handleAddPayment} disabled={saving}>Confirm Payment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


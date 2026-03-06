import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Teacher = {
    id: string;
    name: string;
    mobile: string;
    subjects: string[];
    available_days: string[];
    available_slots: string[];
    status: 'active' | 'inactive';
    created_at: string;
};

export type Student = {
    id: string;
    name: string;
    standard: string;
    parent_name: string;
    board: string;
    address: string;
    mobile: string;
    student_mobile?: string;
    subjects: string[];
    preferred_day: string;
    preferred_date?: string;
    preferred_slot: string;
    assigned_teacher_id: string | null;
    status: 'unassigned' | 'assigned' | 'finalized' | 'not_interested';
    demo_status: 'pending' | 'successful' | 'failed' | null;
    created_at: string;
    comment?: string;
    fee_discussion?: string;
    finalized_fees?: number;
    teacher?: Teacher;
};

export type Payment = {
    id: string;
    student_id: string;
    amount: number;
    months_paid: number;
    payment_date: string;
    status: 'paid' | 'pending';
    remarks?: string;
    created_at: string;
};

export type TimeSlot = {
    id: string;
    teacher_id: string;
    day: string;
    slot: string;
    is_booked: boolean;
    student_id?: string | null;
};

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { type, student, teacher, payment } = body;

        const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

        if (!webhookUrl) {
            return NextResponse.json({ message: 'Webhook URL not configured' }, { status: 400 });
        }

        let payload: any = {
            timestamp: new Date().toLocaleString('en-IN'),
            type: type || 'assignment',
        };

        if (type === 'payment' && payment) {
            payload = {
                ...payload,
                student_name: student.name,
                student_mobile: student.mobile,
                amount: payment.amount,
                months_paid: payment.months_paid,
                remarks: payment.remarks || 'N/A',
                payment_date: payment.created_at || new Date().toISOString(),
                status: 'Paid',
            };
        } else {
            // Default to assignment
            payload = {
                ...payload,
                student_name: student.name,
                student_mobile: student.mobile,
                student_subjects: student.subjects.join(', '),
                student_standard: student.standard,
                preferred_day: student.preferred_day,
                preferred_slot: student.preferred_slot,
                preferred_date: student.preferred_date || 'N/A',
                teacher_name: teacher?.name || 'N/A',
                teacher_mobile: teacher?.mobile || 'N/A',
                assignment_status: 'Assigned',
            };
        }

        // Send to Google Sheets Webhook
        await fetch(webhookUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Sheet Sync Error:', error);
        return NextResponse.json({ error: 'Failed to sync with Google Sheets' }, { status: 500 });
    }
}

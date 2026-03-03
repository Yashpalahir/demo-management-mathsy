import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { student, teacher } = body;

        const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

        if (!webhookUrl) {
            return NextResponse.json({ message: 'Webhook URL not configured' }, { status: 400 });
        }

        const payload = {
            timestamp: new Date().toLocaleString('en-IN'),
            student_name: student.name,
            student_mobile: student.mobile,
            student_subjects: student.subjects.join(', '),
            student_standard: student.standard,
            preferred_day: student.preferred_day,
            preferred_slot: student.preferred_slot,
            preferred_date: student.preferred_date || 'N/A',
            teacher_name: teacher.name,
            teacher_mobile: teacher.mobile,
            assignment_status: 'Assigned',
        };

        // Send to Google Sheets Webhook (usually a Google Apps Script)
        const response = await fetch(webhookUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Sheet Sync Error:', error);
        return NextResponse.json({ error: 'Failed to sync with Google Sheets' }, { status: 500 });
    }
}

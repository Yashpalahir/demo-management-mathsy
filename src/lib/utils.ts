import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}

export function generateWhatsAppLink(
    teacherMobile: string,
    teacherName: string,
    studentName: string,
    standard: string,
    address: string,
    day: string,
    slot: string,
    parentContact: string,
    date?: string
): string {
    const mobile = teacherMobile.replace(/\D/g, '');
    const formattedMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;

    const dateStr = date ? `\n• *Date:* ${formatDate(date)}` : '';

    const message = `Hello ${teacherName},

New Student Assigned to You 🎓

*Student Details:*
• *Name:* ${studentName}
• *Standard:* ${standard}
• *Address:* ${address}${dateStr}
• *Demo Day:* ${day}
• *Time Slot:* ${slot}
• *Parent Contact:* ${parentContact}

Please confirm your availability. Thank you!

- Mathsy Admin`;

    return `https://wa.me/${formattedMobile}?text=${encodeURIComponent(message)}`;
}

export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
}

export function isToday(dateStr: string): boolean {
    const today = new Date();
    const date = new Date(dateStr);
    return (
        today.getDate() === date.getDate() &&
        today.getMonth() === date.getMonth() &&
        today.getFullYear() === date.getFullYear()
    );
}

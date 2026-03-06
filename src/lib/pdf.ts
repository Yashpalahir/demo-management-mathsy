import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

export async function generateFeeReceipt(student: any, payment: any) {
    const doc = new jsPDF();
    const primaryBlue = [15, 23, 42]; // #0f172a
    const accentBlue = [99, 102, 241]; // #6366f1
    const mathsyYellow = [253, 224, 71]; // #fde047

    // --- Header Section ---
    // Background
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, 210, 50, 'F');

    // Logo Replication
    // Icons (Simulated with simple shapes)
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    // Draw some math icons briefly
    doc.line(20, 15, 30, 15); doc.circle(25, 12, 1); // +
    doc.line(35, 10, 45, 20); doc.line(45, 10, 35, 20); // x

    // "MATHSY" Text
    doc.setTextColor(mathsyYellow[0], mathsyYellow[1], mathsyYellow[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.text('MATHSY', 105, 28, { align: 'center' });

    // "MATHS & SCIENCE" Subtitle
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('MATHS & SCIENCE', 105, 40, { align: 'center', charSpace: 2 });

    // --- Receipt Title ---
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('FEE RECEIPT', 105, 70, { align: 'center' });

    doc.setDrawColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.setLineWidth(1);
    doc.line(80, 75, 130, 75);

    // --- Student & Payment Details ---
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');

    const detailsY = 90;
    const leftCol = 20;
    const rightCol = 130;

    // Student Info
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT DETAILS', leftCol, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${student.name}`, leftCol, detailsY + 10);
    doc.text(`Class: ${student.standard}`, leftCol, detailsY + 18);
    doc.text(`Board: ${student.board}`, leftCol, detailsY + 26);
    doc.text(`Parent: ${student.parent_name}`, leftCol, detailsY + 34);
    doc.text(`Mobile: ${student.mobile}`, leftCol, detailsY + 42);

    // Payment Info
    doc.setFont('helvetica', 'bold');
    doc.text('PAYMENT DETAILS', rightCol, detailsY);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt No: #${payment.id.slice(0, 8).toUpperCase()}`, rightCol, detailsY + 10);
    doc.text(`Date: ${format(new Date(payment.payment_date), 'dd MMM yyyy')}`, rightCol, detailsY + 18);
    doc.text(`Status: ${payment.status.toUpperCase()}`, rightCol, detailsY + 26);

    // --- Table ---
    autoTable(doc, {
        startY: detailsY + 60,
        head: [['Description', 'Months Covered', 'Amount']],
        body: [
            ['Tuition Fees', payment.months_paid, `INR ${payment.amount}`],
        ],
        headStyles: { fillColor: primaryBlue as any, textColor: [255, 255, 255], fontStyle: 'bold' },
        foot: [['Total', '', `INR ${payment.amount}`]],
        footStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
        theme: 'grid',
    });

    // --- Footer ---
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Authorized Signatory', 190, finalY, { align: 'right' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text('Thank you for choosing Mathsy for your child\'s education!', 105, finalY + 40, { align: 'center' });

    // Save and return
    const fileName = `Receipt_${student.name.replace(/\s+/g, '_')}_${format(new Date(), 'dd-MM-yyyy')}.pdf`;
    doc.save(fileName);

    return {
        fileName,
        whatsAppLink: `https://wa.me/${student.mobile.replace(/\D/g, '')}?text=Hello%20${encodeURIComponent(student.parent_name)},%20here%20is%20the%20fee%20receipt%20for%20${encodeURIComponent(student.name)}.%20Amount:%20INR%20${payment.amount}%20for%20${payment.months_paid}%20month(s).`
    };
}

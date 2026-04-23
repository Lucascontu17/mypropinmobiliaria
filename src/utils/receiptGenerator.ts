import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ReceiptData {
  pago_id: string;
  contrato_id: string;
  inmobiliaria: string;
  numero_recibo: string;
  periodo: string;
  inquilino: string;
  propiedad: string;
  monto_total: number;
  monto_letras: string;
  desglose: {
    alquiler: number;
    expensas: number;
    abl: number;
  };
  metodo_pago: string;
  fecha_pago: string;
}

export const generateReceiptPDF = async (data: ReceiptData) => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // --- HEADER ---
  // Background rectangle for the header
  doc.setFillColor(15, 23, 42); // slate-900 (Zonatia Dark)
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Agency Name
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(data.inmobiliaria.toUpperCase(), margin, 25);
  
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Servicios de Administración de Propiedades", margin, 32);
  
  // Receipt Title & Number
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("RECIBO DE PAGO", pageWidth - margin - 70, 25);
  
  doc.setFontSize(12);
  doc.text(data.numero_recibo, pageWidth - margin - 70, 32);
  
  // --- CONTENT ---
  doc.setTextColor(15, 23, 42);
  let y = 60;
  
  // Details Grid
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("FECHA DE EMISIÓN:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: es }), margin + 40, y);
  
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("INQUILINO:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.inquilino, margin + 40, y);
  
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("PROPIEDAD:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.propiedad, margin + 40, y);
  
  y += 7;
  doc.setFont("helvetica", "bold");
  doc.text("PERIODO:", margin, y);
  doc.setFont("helvetica", "normal");
  doc.text(data.periodo, margin + 40, y);

  y += 15;
  
  // Table
  const tableData = [
    ["Concepto del Periodo", "Monto Total"],
    ["Alquiler Base", `$ ${data.desglose.alquiler.toLocaleString('es-AR')}`],
    ["Expensas Comunes", `$ ${data.desglose.expensas.toLocaleString('es-AR')}`],
    ["Impuesto ABL / Municipal", `$ ${data.desglose.abl.toLocaleString('es-AR')}`],
  ];

  (doc as any).autoTable({
    startY: y,
    head: [tableData[0]],
    body: tableData.slice(1),
    theme: 'grid',
    headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold' },
    columnStyles: {
      1: { halign: 'right' }
    }
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // Final Payment Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, pageWidth - (margin * 2), 25, 3, 3, 'F');
  
  y += 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text("MONTO RECIBIDO EN ESTA OPERACIÓN:", margin + 5, y);
  
  doc.setTextColor(5, 150, 105); // emerald-600
  doc.text(`$ ${data.monto_total.toLocaleString('es-AR')}`, pageWidth - margin - 5, y, { align: 'right' });
  
  y += 8;
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(`Son: ${data.monto_letras}`, margin + 5, y);

  y += 15;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(15, 23, 42);
  doc.text("Método de pago: " + data.metodo_pago, margin, y);
  
  // --- FOOTER ---
  y = doc.internal.pageSize.getHeight() - 40;
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text("Este es un comprobante válido emitido a través de la plataforma Zonatia.", pageWidth / 2, y, { align: 'center' });
  doc.text("Zonatia - Simplificando la gestión inmobiliaria.", pageWidth / 2, y + 5, { align: 'center' });

  return doc;
};

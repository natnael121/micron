// src/services/pdfThemes/classicTheme.ts
import jsPDF from 'jspdf';
import { MenuItem, Category, User } from '../../types';

export const generateClassicDesignPDF = async (
  businessInfo: User,
  menuItems: MenuItem[],
  categories: Category[]
): Promise<jsPDF> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 15;
  const columnGap = 10;
  const colWidth = (pageWidth - margin * 2 - columnGap) / 2;
  const lineHeight = 6;

  // === Background for every page ===
  const addBackground = () => {
    pdf.setFillColor(252, 248, 240); // light beige
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  const addPageWithBackground = () => {
    pdf.addPage();
    addBackground();
  };

  // === Cover Page ===
  const addCoverPage = () => {
    addBackground();

    // Border
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.5);
    pdf.rect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2);

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(36);
    pdf.setTextColor(0, 0, 0);
    pdf.text('MENU', pageWidth / 2, pageHeight / 2 - 10, { align: 'center' });

    // Restaurant name
    const name = businessInfo.businessName || 'RESTAURANT';
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'normal');
    pdf.text(name.toUpperCase(), pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });

    addPageWithBackground();
  };

  // === Category Box ===
  const addCategoryBox = (x: number, y: number, width: number, title: string, items: MenuItem[]): number => {
    const startY = y;

    // Header
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    pdf.text(title.toUpperCase(), x + 2, y + 5);

    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(x, y + 7, x + width, y + 7);

    let currentY = y + 12;

    items.forEach((item) => {
      const itemHeight = lineHeight + 3;
      if (currentY + itemHeight > pageHeight - margin) {
        addPageWithBackground();
        currentY = margin + 12;
      }

      const itemName = item.name;
      const priceText = `${item.price.toFixed(2)}`;
      const startX = x + 2;
      const endX = x + width - 2;

      // Item name
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      pdf.text(itemName, startX, currentY);

      // Dotted leader
      pdf.setFontSize(8);
      let dots = '';
      while (pdf.getTextWidth(dots) < endX - startX - pdf.getTextWidth(itemName) - pdf.getTextWidth(priceText) - 4) {
        dots += '.';
      }
      pdf.text(dots, startX + pdf.getTextWidth(itemName) + 2, currentY);

      // Price
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(priceText, endX, currentY, { align: 'right' });

      currentY += lineHeight;
    });

    // Box border
    pdf.setDrawColor(180, 180, 180);
    pdf.setLineWidth(0.5);
    pdf.rect(x, startY, width, currentY - startY + 3);

    return currentY + 8;
  };

  // === Footer ===
  const addFooter = () => {
    const footerY = pageHeight - 10;
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);

    const phone = businessInfo.aboutUs?.phone || businessInfo.phone || '+123-456-7890';
    const website = businessInfo.aboutUs?.website || 'www.restaurant.com';

    pdf.text(`Delivery order: ${phone}`, margin, footerY);
    pdf.text(website, pageWidth - margin, footerY, { align: 'right' });
  };

  // === Start PDF generation ===
  addCoverPage();

  let currentX = margin;
  let currentY = margin;

  const itemsByCategory = categories.reduce((acc, category) => {
    const categoryItems = menuItems.filter(
      (item) => item.category === category.name && item.available
    );
    if (categoryItems.length > 0) {
      acc[category.name] = categoryItems.sort((a, b) => a.name.localeCompare(b.name));
    }
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const uncategorizedItems = menuItems.filter(
    (item) => item.available && !categories.some((cat) => cat.name === item.category)
  );
  if (uncategorizedItems.length > 0) {
    itemsByCategory['Other Items'] = uncategorizedItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  for (const [catName, items] of Object.entries(itemsByCategory)) {
    if (currentY > pageHeight - margin - 40) {
      if (currentX === margin) {
        currentX = margin + colWidth + columnGap;
        currentY = margin;
      } else {
        addPageWithBackground();
        currentX = margin;
        currentY = margin;
      }
    }

    currentY = addCategoryBox(currentX, currentY, colWidth, catName, items);
  }

  addFooter();

  return pdf;
};

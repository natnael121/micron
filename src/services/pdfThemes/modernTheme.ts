import jsPDF from 'jspdf';
import { MenuItem, Category, User } from '../../types';

export const generateModernDesignPDF = async (
  businessInfo: User,
  menuItems: MenuItem[],
  categories: Category[]
): Promise<jsPDF> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 15;
  const columnGap = 10;
  const colWidth = (pageWidth - margin * 2 - columnGap) / 2;
  const headerHeight = 10;
  const lineHeight = 6;

  let currentX = margin;
  let currentY = margin + 10;

  // === Helper: start new column or page ===
  const moveToNextColumn = () => {
    if (currentX === margin) {
      // Move to right column
      currentX = margin + colWidth + columnGap;
      currentY = margin + 10;
    } else {
      // Add new page
      pdf.addPage();
      addBackground();
      currentX = margin;
      currentY = margin + 10;
    }
  };

  // === Beige background ===
  const addBackground = () => {
    pdf.setFillColor(245, 234, 212); // beige
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  // === Category Header ===
  const addCategoryHeader = (name: string) => {
    if (currentY + headerHeight > pageHeight - 20) moveToNextColumn();

    pdf.setFillColor(0, 0, 0);
    pdf.rect(currentX, currentY, colWidth, headerHeight, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(name.toUpperCase(), currentX + 2, currentY + 7);

    currentY += headerHeight + 3;
  };

  // === Menu Item ===
  const addMenuItem = (item: MenuItem) => {
    const itemHeight = lineHeight * 2 + 4;
    if (currentY + itemHeight > pageHeight - 20) moveToNextColumn();

    // Name + price with dotted leader
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 0, 0);
    const nameWidth = pdf.getTextWidth(item.name);

    const priceText = `${item.price.toFixed(0)}`;
    const priceWidth = pdf.getTextWidth(priceText);

    const startX = currentX + 2;
    const endX = currentX + colWidth - 2;
    const dotsStart = startX + nameWidth + 2;
    const dotsEnd = endX - priceWidth - 2;

    // Item name
    pdf.text(item.name, startX, currentY);

    // Dotted leader
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    let dots = '';
    while (pdf.getTextWidth(dots) < dotsEnd - dotsStart) {
      dots += '.';
    }
    pdf.text(dots, dotsStart, currentY);

    // Price
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text(priceText, endX, currentY, { align: 'right' });

    // Description
    if (item.description) {
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(80, 80, 80);
      const desc = item.description.length > 60 ? item.description.substring(0, 57) + '...' : item.description;
      pdf.text(desc, startX, currentY + 5);
    }

    currentY += itemHeight;
  };

  // === Footer ===
  const addFooter = () => {
    const footerY = pageHeight - 10;
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);

    const phone = businessInfo.aboutUs?.phone || businessInfo.phone || '+123-456-7890';
    const website = businessInfo.aboutUs?.website || 'www.webpage.com';

    pdf.text(`Delivery order: ${phone}`, margin, footerY);
    pdf.text(website, pageWidth - margin, footerY, { align: 'right' });
  };

  // === Start ===
  addBackground();

  // Title block
  pdf.setFillColor(0, 0, 0);
  pdf.rect(margin, margin, colWidth, 20, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(16);
  pdf.text('MENU', margin + colWidth / 2, margin + 13, { align: 'center' });

  currentY = margin + 30;

  // Group items by category
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

  // Render categories + items
  for (const [catName, items] of Object.entries(itemsByCategory)) {
    addCategoryHeader(catName);
    items.forEach((item) => addMenuItem(item));
  }

  addFooter();

  return pdf;
};

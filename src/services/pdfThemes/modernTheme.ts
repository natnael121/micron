import jsPDF from 'jspdf';
import { MenuItem, Category, User } from '../../types';

export const generateModernDesignPDF = async (
  businessInfo: User,
  menuItems: MenuItem[],
  categories: Category[]
): Promise<jsPDF> => {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const itemBoxWidth = (pageWidth - margin * 2) / 2;
  const itemBoxHeight = (pageHeight - 100) / 2;

  const loadImageAsBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading image:', error);
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }
  };

  const addPageHeader = () => {
    pdf.setFillColor(245, 245, 245);
    pdf.rect(0, 0, pageWidth, pageHeight, 'F');
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(32);
    pdf.setFont('helvetica', 'bolditalic');
    const businessName = businessInfo.businessName || 'Borcelle';
    const businessNameWidth = pdf.getTextWidth(businessName);
    pdf.text(businessName, (pageWidth - businessNameWidth) / 2, 25);

    const bannerY = 35;
    const bannerHeight = 12;
    const bannerWidth = 80;
    const bannerX = (pageWidth - bannerWidth) / 2;
    pdf.setFillColor(0, 0, 0);
    pdf.rect(bannerX, bannerY, bannerWidth, bannerHeight, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FOOD MENU', pageWidth / 2, bannerY + 8, { align: 'center' });
  };

  const addFooter = () => {
    const phone = businessInfo.aboutUs?.phone || businessInfo.phone || '+123-456-7890';
    const website = businessInfo.aboutUs?.website || 'WWW.REALLYGREATSITE.COM';
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Delivery order', margin, pageHeight - 20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(phone, margin, pageHeight - 14);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(website, pageWidth - margin, pageHeight - 14, { align: 'right' });
  };

  // Group items by categories
  const itemsByCategory = categories.reduce((acc, category) => {
    const categoryItems = menuItems.filter(item => item.category === category.name && item.available);
    if (categoryItems.length > 0) {
      acc[category.name] = categoryItems.sort((a, b) => a.name.localeCompare(b.name));
    }
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const uncategorizedItems = menuItems.filter(item => item.available && !categories.some(cat => cat.name === item.category));
  if (uncategorizedItems.length > 0) {
    itemsByCategory['Other Items'] = uncategorizedItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  const allItems = Object.values(itemsByCategory).flat();

  for (let i = 0; i < allItems.length; i++) {
    if (i % 4 === 0) {
      if (i > 0) pdf.addPage();
      addPageHeader();
    }

    const item = allItems[i];
    const gridX = i % 2; // column
    const gridY = Math.floor((i % 4) / 2); // row
    const boxX = margin + gridX * itemBoxWidth;
    const boxY = 60 + gridY * itemBoxHeight;
    const imageSize = 50;
    const imageCenterX = boxX + itemBoxWidth / 2;
    const imageY = boxY + 10;

    try {
      if (item.photo) {
        const base64 = await loadImageAsBase64(item.photo);
        pdf.setFillColor(255, 255, 255);
        pdf.circle(imageCenterX, imageY + imageSize / 2, imageSize / 2, 'F');
        pdf.addImage(base64, 'JPEG', imageCenterX - imageSize / 2, imageY, imageSize, imageSize);
      } else {
        pdf.setFillColor(240, 240, 240);
        pdf.circle(imageCenterX, imageY + imageSize / 2, imageSize / 2, 'F');
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(10);
        pdf.text('No Image', imageCenterX, imageY + imageSize / 2, { align: 'center' });
      }
    } catch (error) {
      console.error('Error adding image:', error);
    }

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(item.name, imageCenterX, imageY + imageSize + 10, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    const desc = item.description.length > 50 ? item.description.slice(0, 47) + '...' : item.description;
    pdf.text(desc, imageCenterX, imageY + imageSize + 16, { align: 'center' });

    pdf.setFillColor(0, 0, 0);
    pdf.circle(imageCenterX, imageY + imageSize + 30, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`$${item.price.toFixed(0)}`, imageCenterX, imageY + imageSize + 33, { align: 'center' });
  }

  addFooter();
  return pdf;
};

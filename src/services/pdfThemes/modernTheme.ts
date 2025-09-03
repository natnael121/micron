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
  const contentWidth = pageWidth - (margin * 2);
  
  let currentY = margin;
  let pageNumber = 1;

  const loadImageAsBase64 = async (imageUrl: string): Promise<string> => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result as string;
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error loading image:', error);
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
    }
  };

  const addNewPage = () => {
    pdf.addPage();
    pageNumber++;
    currentY = margin;
    addPageHeader();
  };

  const checkPageSpace = (requiredSpace: number) => {
    if (currentY + requiredSpace > pageHeight - 30) {
      addNewPage();
      return true;
    }
    return false;
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
    const menuText = 'FOOD MENU';
    const menuTextWidth = pdf.getTextWidth(menuText);
    pdf.text(menuText, (pageWidth - menuTextWidth) / 2, bannerY + 8);
    
    currentY = 60;
  };

  addPageHeader();

  const itemsByCategory = categories.reduce((acc, category) => {
    const categoryItems = menuItems.filter(item => 
      item.category === category.name && item.available
    );
    if (categoryItems.length > 0) {
      acc[category.name] = categoryItems.sort((a, b) => a.name.localeCompare(b.name));
    }
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const uncategorizedItems = menuItems.filter(item => 
    item.available && !categories.some(cat => cat.name === item.category)
  );
  if (uncategorizedItems.length > 0) {
    itemsByCategory['Other Items'] = uncategorizedItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  const allItems = Object.values(itemsByCategory).flat();
  
  for (let i = 0; i < allItems.length; i++) {
    const item = allItems[i];
    const itemHeight = 85;
    
    checkPageSpace(itemHeight);
    
    const isLeft = i % 2 === 0;
    const imageSize = 70;
    const imageX = isLeft ? margin : pageWidth - margin - imageSize;
    const textX = isLeft ? margin + imageSize + 10 : margin;
    const textWidth = contentWidth - imageSize - 10;
    
    try {
      if (item.photo) {
        const imageBase64 = await loadImageAsBase64(item.photo);
        pdf.setFillColor(255, 255, 255);
        pdf.circle(imageX + imageSize/2, currentY + imageSize/2, imageSize/2, 'F');
        pdf.addImage(imageBase64, 'JPEG', imageX, currentY, imageSize, imageSize);
      } else {
        pdf.setFillColor(240, 240, 240);
        pdf.circle(imageX + imageSize/2, currentY + imageSize/2, imageSize/2, 'F');
        pdf.setTextColor(150, 150, 150);
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text('No Image', imageX + imageSize/2, currentY + imageSize/2, { align: 'center' });
      }
    } catch (error) {
      console.error('Error adding image:', error);
      pdf.setFillColor(240, 240, 240);
      pdf.circle(imageX + imageSize/2, currentY + imageSize/2, imageSize/2, 'F');
    }
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    
    const itemNameY = currentY + 20;
    const maxNameWidth = textWidth - 20;
    
    const words = item.name.split(' ');
    let lines = [];
    let currentLine = '';
    
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = pdf.getTextWidth(testLine);
      
      if (testWidth <= maxNameWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
    
    lines = lines.slice(0, 2);
    
    lines.forEach((line, lineIndex) => {
      if (isLeft) {
        pdf.text(line, textX, itemNameY + (lineIndex * 8));
      } else {
        pdf.text(line, textX + textWidth, itemNameY + (lineIndex * 8), { align: 'right' });
      }
    });
    
    pdf.setTextColor(100, 100, 100);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    
    const descriptionY = itemNameY + (lines.length * 8) + 5;
    const description = item.description.length > 80 ? 
      item.description.substring(0, 77) + '...' : item.description;
    
    const descWords = description.split(' ');
    let descLines = [];
    let currentDescLine = '';
    
    for (const word of descWords) {
      const testLine = currentDescLine ? `${currentDescLine} ${word}` : word;
      const testWidth = pdf.getTextWidth(testLine);
      
      if (testWidth <= maxNameWidth) {
        currentDescLine = testLine;
      } else {
        if (currentDescLine) descLines.push(currentDescLine);
        currentDescLine = word;
      }
    }
    if (currentDescLine) descLines.push(currentDescLine);
    
    descLines = descLines.slice(0, 2);
    
    descLines.forEach((line, lineIndex) => {
      if (isLeft) {
        pdf.text(line, textX, descriptionY + (lineIndex * 4));
      } else {
        pdf.text(line, textX + textWidth, descriptionY + (lineIndex * 4), { align: 'right' });
      }
    });
    
    const priceY = currentY + imageSize - 15;
    const priceX = isLeft ? textX + textWidth - 25 : textX + 25;
    
    pdf.setFillColor(0, 0, 0);
    pdf.circle(priceX, priceY, 12, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    const priceText = `$${item.price.toFixed(0)}`;
    pdf.text(priceText, priceX, priceY + 2, { align: 'center' });
    
    const lineY = currentY + itemHeight - 5;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.5);
    
    if (isLeft) {
      pdf.line(textX, lineY, textX + textWidth - 30, lineY);
    } else {
      pdf.line(textX + 30, lineY, textX + textWidth, lineY);
    }
    
    currentY += itemHeight + 10;
  }

  currentY = pageHeight - 25;
  
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  
  pdf.text('Delivery order', margin, currentY);
  
  const phone = businessInfo.aboutUs?.phone || businessInfo.phone || '+123-456-7890';
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text(phone, margin, currentY + 6);
  
  const website = businessInfo.aboutUs?.website || 'WWW.REALLYGREATSITE.COM';
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(website, pageWidth - margin, currentY + 3, { align: 'right' });
  
  return pdf;
};
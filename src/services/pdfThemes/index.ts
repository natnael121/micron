// PDF Theme Exports
export { generateModernDesignPDF } from './modernTheme';
export { generateClassicDesignPDF } from './classicTheme';
export { generateElegantDesignPDF } from './elegantTheme';
export { generateMinimalDesignPDF } from './minimalTheme';

export type PDFTheme = 'modern' | 'classic' | 'elegant' | 'minimal';

export const PDF_THEME_OPTIONS = [
  {
    id: 'modern' as const,
    name: 'Modern Style',
    description: 'Alternating layout with circular images and elegant typography',
    preview: 'Modern design with large circular food images and stylish script business name'
  },
  {
    id: 'classic' as const,
    name: 'Classic Restaurant',
    description: 'Traditional menu layout with clean typography and organized sections',
    preview: 'Clean, professional layout with category sections and traditional styling'
  },
  {
    id: 'elegant' as const,
    name: 'Elegant Fine Dining',
    description: 'Sophisticated design with premium typography and refined layout',
    preview: 'Luxurious design with premium fonts, gold accents, and sophisticated spacing'
  },
  {
    id: 'minimal' as const,
    name: 'Minimal Clean',
    description: 'Clean, simple design with focus on readability and white space',
    preview: 'Minimalist layout with clean typography and plenty of white space'
  }
];
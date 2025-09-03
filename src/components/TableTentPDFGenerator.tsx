import React, { useState } from 'react';
import { X, Download, FileText, Eye, Printer, Palette } from 'lucide-react';
import { MenuItem, Category, User } from '../types';
import { 
  generateModernDesignPDF,
  generateClassicDesignPDF,
  generateElegantDesignPDF,
  generateMinimalDesignPDF,
  PDF_THEME_OPTIONS,
  PDFTheme
} from '../services/pdfThemes';

interface TableTentPDFGeneratorProps {
  userId: string;
  businessInfo: User;
  menuItems: MenuItem[];
  categories: Category[];
  onClose: () => void;
}

export const TableTentPDFGenerator: React.FC<TableTentPDFGeneratorProps> = ({
  userId,
  businessInfo,
  menuItems,
  categories,
  onClose,
}) => {
  const [generating, setGenerating] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState<PDFTheme>('modern');

  const generatePrintMenuPDF = async (): Promise<import('jspdf')> => {
    switch (selectedDesign) {
      case 'modern':
        return await generateModernDesignPDF(businessInfo, menuItems, categories);
      case 'classic':
        return await generateClassicDesignPDF(businessInfo, menuItems, categories);
      case 'elegant':
        return await generateElegantDesignPDF(businessInfo, menuItems, categories);
      case 'minimal':
        return await generateMinimalDesignPDF(businessInfo, menuItems, categories);
      default:
        return await generateModernDesignPDF(businessInfo, menuItems, categories);
    }
  };

  const generatePrintMenu = async () => {
    if (menuItems.length === 0) {
      alert('No menu items available to print');
      return;
    }

    setGenerating(true);
    
    try {
      const pdf = await generatePrintMenuPDF();
      const fileName = `${businessInfo.businessName?.toLowerCase().replace(/\s+/g, '-') || 'restaurant-menu'}-${selectedDesign}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating print menu:', error);
      alert('Failed to generate menu PDF. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const previewMenu = async () => {
    try {
      setGenerating(true);
      const pdf = await generatePrintMenuPDF();
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (error) {
      console.error('Error previewing menu:', error);
      alert('Failed to preview menu');
    } finally {
      setGenerating(false);
    }
  };

  // Group menu items by category for display
  const itemsByCategory = categories.reduce((acc, category) => {
    const categoryItems = menuItems.filter(item => 
      item.category === category.name && item.available
    );
    if (categoryItems.length > 0) {
      acc[category.name] = categoryItems.sort((a, b) => a.name.localeCompare(b.name));
    }
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Add uncategorized items
  const uncategorizedItems = menuItems.filter(item => 
    item.available && !categories.some(cat => cat.name === item.category)
  );
  if (uncategorizedItems.length > 0) {
    itemsByCategory['Other Items'] = uncategorizedItems.sort((a, b) => a.name.localeCompare(b.name));
  }

  const totalItems = Object.values(itemsByCategory).reduce((sum, items) => sum + items.length, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Printer className="w-6 h-6 text-gray-800" />
              <h2 className="text-xl font-bold text-gray-900">Print Menu Generator</h2>
            </div>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-600 mt-2">Choose a design and generate a beautiful menu for printing</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Design Selection */}
          <div className="bg-gray-100 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Palette className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Choose Design Style</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {PDF_THEME_OPTIONS.map((design) => (
                <div
                  key={design.id}
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    selectedDesign === design.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => setSelectedDesign(design.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{design.name}</h4>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      selectedDesign === design.id
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {selectedDesign === design.id && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{design.description}</p>
                  <p className="text-xs text-gray-500">{design.preview}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Design Preview */}
          <div className="bg-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Design Preview - {PDF_THEME_OPTIONS.find(d => d.id === selectedDesign)?.name}</h3>
            <div className="bg-white border border-gray-300 rounded-lg p-6 relative overflow-hidden">
              {/* Preview based on selected design */}
              {selectedDesign === 'modern' && (
                <div className="text-center mb-6">
                  <div className="font-bold text-2xl text-gray-900 italic tracking-wide mb-2">
                    {businessInfo.businessName || 'Restaurant Name'}
                  </div>
                  <div className="inline-block bg-black text-white px-6 py-2 font-bold text-sm tracking-wider">
                    FOOD MENU
                  </div>
                </div>
              )}

              {selectedDesign === 'classic' && (
                <div className="mb-6">
                  <div className="bg-gray-100 p-4 rounded-lg text-center mb-4">
                    <div className="font-bold text-2xl text-gray-900 mb-1">
                      {businessInfo.businessName || 'Restaurant Name'}
                    </div>
                    <div className="text-gray-600 text-sm tracking-wider">MENU</div>
                    <div className="w-full h-0.5 bg-green-500 mt-2"></div>
                  </div>
                  <div className="bg-green-500 text-white px-4 py-2 font-bold text-sm">
                    APPETIZERS
                  </div>
                </div>
              )}

              {selectedDesign === 'elegant' && (
                <div className="text-center mb-6 border-2 border-yellow-400 p-6">
                  <div className="font-bold text-3xl text-gray-900 mb-2">
                    {businessInfo.businessName || 'Restaurant Name'}
                  </div>
                  <div className="w-16 h-0.5 bg-yellow-400 mx-auto mb-2"></div>
                  <div className="text-gray-600 italic">Fine Dining Experience</div>
                </div>
              )}

              {selectedDesign === 'minimal' && (
                <div className="text-center mb-6">
                  <div className="font-normal text-xl text-gray-900 mb-4">
                    {businessInfo.businessName || 'Restaurant Name'}
                  </div>
                  <div className="w-20 h-0.5 bg-gray-400 mx-auto"></div>
                </div>
              )}

              {/* Sample item layout */}
              <div className="space-y-4">
                {selectedDesign === 'modern' && (
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-gray-500 text-xs">IMAGE</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-gray-900 mb-1">SAMPLE DISH</h4>
                      <p className="text-gray-600 text-sm">Delicious description of the menu item</p>
                      <div className="w-24 h-0.5 bg-gray-300 mt-2"></div>
                    </div>
                    <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">$12</span>
                    </div>
                  </div>
                )}

                {selectedDesign === 'classic' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">SAMPLE APPETIZER</h4>
                        <p className="text-gray-600 text-sm">Fresh ingredients with house-made sauce</p>
                      </div>
                      <span className="font-bold text-gray-900 ml-4">$8.99</span>
                    </div>
                    <div className="border-b border-dotted border-gray-300"></div>
                  </div>
                )}

                {selectedDesign === 'elegant' && (
                  <div className="text-center border-b border-gray-200 pb-4">
                    <h4 className="font-bold text-xl text-gray-900 mb-2">SIGNATURE DISH</h4>
                    <p className="text-gray-600 italic text-sm mb-2">Exquisitely prepared with premium ingredients</p>
                    <div className="inline-block bg-yellow-400 text-gray-900 px-3 py-1 font-bold text-sm">
                      $24.99
                    </div>
                  </div>
                )}

                {selectedDesign === 'minimal' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-900">SIMPLE DISH</span>
                      <span className="text-gray-900">12.99</span>
                    </div>
                    <div className="text-xs text-gray-500">Clean and simple description</div>
                    <div className="border-b border-gray-200"></div>
                  </div>
                )}
              </div>

              <div className="text-center text-xs text-gray-500 mt-8">
                <p>Sample layout preview</p>
              </div>
            </div>
          </div>

          {/* Menu Summary */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Menu Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{Object.keys(itemsByCategory).length}</div>
                <div className="text-gray-600">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">{totalItems}</div>
                <div className="text-gray-600">Available Items</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  ${Math.min(...menuItems.filter(i => i.available).map(i => i.price)).toFixed(2)}
                </div>
                <div className="text-gray-600">Starting From</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-800">
                  ${Math.max(...menuItems.filter(i => i.available).map(i => i.price)).toFixed(2)}
                </div>
                <div className="text-gray-600">Up To</div>
              </div>
            </div>
          </div>

          {/* Design Features */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              {PDF_THEME_OPTIONS.find(d => d.id === selectedDesign)?.name} Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {selectedDesign === 'modern' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                      <span className="text-gray-700">Large, circular food images</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                      <span className="text-gray-700">Alternating left/right layout</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                      <span className="text-gray-700">Stylish script business name</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                      <span className="text-gray-700">Black banner with "FOOD MENU"</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                      <span className="text-gray-700">Circular price badges</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                      <span className="text-gray-700">Clean typography and spacing</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                      <span className="text-gray-700">Professional footer with contact info</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-800 rounded-full"></div>
                      <span className="text-gray-700">Modern, elegant layout</span>
                    </div>
                  </div>
                </>
              )}

              {selectedDesign === 'classic' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Traditional restaurant layout</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Category sections with headers</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Dotted lines between items and prices</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Clean, readable typography</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Professional header design</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Organized by food categories</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Easy-to-read descriptions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                      <span className="text-gray-700">Contact information footer</span>
                    </div>
                  </div>
                </>
              )}

              {selectedDesign === 'elegant' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Luxurious gold accents and borders</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Premium typography with elegant fonts</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Sophisticated spacing and layout</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Fine dining presentation style</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Decorative flourishes and dividers</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Centered, balanced composition</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Premium price presentation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-gray-700">Upscale restaurant aesthetic</span>
                    </div>
                  </div>
                </>
              )}

              {selectedDesign === 'minimal' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                      <span className="text-gray-700">Ultra-clean typography</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                      <span className="text-gray-700">Maximum white space utilization</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                      <span className="text-gray-700">Minimal visual distractions</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                      <span className="text-gray-700">Focus on content readability</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                      <span className="text-gray-700">Simple line separators</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                      <span className="text-gray-700">Monochrome color scheme</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                      <span className="text-gray-700">Scandinavian-inspired design</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-gray-600 rounded-full"></div>
                      <span className="text-gray-700">Perfect for modern cafes</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Generation Options */}
          <div className="bg-gray-100 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Print Options</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Selected Design:</span>
                <span className="text-sm font-medium text-gray-900">
                  {PDF_THEME_OPTIONS.find(d => d.id === selectedDesign)?.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Format:</span>
                <span className="text-sm font-medium text-gray-900">A4 Portrait (210×297mm)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Layout:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedDesign === 'modern' ? 'Alternating image placement' :
                   selectedDesign === 'classic' ? 'Category-based sections' :
                   selectedDesign === 'elegant' ? 'Centered elegant layout' :
                   'Minimal clean layout'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Images:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedDesign === 'modern' ? 'Large circular photos' :
                   selectedDesign === 'classic' ? 'Text-focused layout' :
                   selectedDesign === 'elegant' ? 'Premium presentation' :
                   'Text-only layout'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              {totalItems} items across {Object.keys(itemsByCategory).length} categories
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={previewMenu}
                disabled={generating || totalItems === 0}
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>
              
              <button
                onClick={generatePrintMenu}
                disabled={generating || totalItems === 0}
                className="bg-gray-800 text-white px-6 py-2 rounded-lg hover:bg-gray-900 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold"
              >
                <Download className="w-4 h-4" />
                <span>
                  {generating ? 'Generating...' : `Download ${PDF_THEME_OPTIONS.find(d => d.id === selectedDesign)?.name} Menu`}
                </span>
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">Printing Instructions:</h4>
            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
              <li>Print on A4 paper in portrait orientation</li>
              <li>Use high-quality color printing for best results</li>
              <li>Ensure printer settings are set to "Actual Size" or "100%"</li>
              <li>Consider using premium paper (150-200gsm) for professional results</li>
              <li>
                {selectedDesign === 'modern' && 'Use color printing to showcase food photos effectively'}
                {selectedDesign === 'classic' && 'Black and white printing works well for this design'}
                {selectedDesign === 'elegant' && 'Color printing recommended for gold accents'}
                {selectedDesign === 'minimal' && 'Black and white printing is perfect for this clean design'}
              </li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};
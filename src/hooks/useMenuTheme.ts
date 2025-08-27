import { useState, useEffect } from 'react';

export const useMenuTheme = (userId?: string) => {
  const [theme, setTheme] = useState<'classic' | 'modern' | 'elegant' | 'minimal'>('classic');

  useEffect(() => {
    if (userId) {
      // In a real app, this would fetch from Firebase
      const savedTheme = localStorage.getItem(`menuTheme_${userId}`) as any;
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, [userId]);

  const updateTheme = (newTheme: 'classic' | 'modern' | 'elegant' | 'minimal') => {
    setTheme(newTheme);
    if (userId) {
      localStorage.setItem(`menuTheme_${userId}`, newTheme);
    }
  };

  return { theme, updateTheme };
};
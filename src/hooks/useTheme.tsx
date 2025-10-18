import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

//================ DEFINICIÓN DE TIPOS ====================
type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

//================ CREACIÓN DEL CONTEXTO ====================
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

//================ COMPONENTE PROVEEDOR DEL CONTEXTO (PROVIDER) ====================
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

//================ HOOK PERSONALIZADO PARA CONSUMIR EL CONTEXTO ====================
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
};
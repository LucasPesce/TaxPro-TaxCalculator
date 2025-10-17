import { createContext, useState, useContext, useEffect, type ReactNode } from 'react';

// Definimos los tipos de datos que manejará nuestro contexto
type Theme = 'light' | 'dark'; // El tema solo puede ser uno de estos dos strings

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// 1. CREAR EL CONTEXTO
// Creamos el contexto con un valor inicial `undefined`.
// Esto nos ayudará a detectar si usamos el hook fuera del proveedor.
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 2. CREAR EL PROVEEDOR (PROVIDER)
// Este es un componente que "envolverá" nuestra aplicación.
// Su trabajo es gestionar el estado del tema y proveerlo a todos sus hijos.
export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  // Estado para guardar el tema actual.
  // Leemos el valor guardado en localStorage o usamos 'light' por defecto.
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    return (savedTheme === 'light' || savedTheme === 'dark') ? savedTheme : 'light';
  });

  // useEffect se ejecuta cada vez que el valor de `theme` cambia.
  // Lo usamos para actualizar el atributo en el <html> y guardar en localStorage.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Función para cambiar el tema
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  // El componente Provider "provee" el valor (theme y toggleTheme)
  // a todos los componentes hijos que lo necesiten.
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// 3. CREAR EL HOOK PERSONALIZADO (CUSTOM HOOK)
// Este es el hook que nuestros componentes usarán para acceder al contexto.
export const useTheme = () => {
  const context = useContext(ThemeContext);
  // Si un componente intenta usar este hook fuera del ThemeProvider, lanzamos un error.
  if (context === undefined) {
    throw new Error('useTheme debe ser usado dentro de un ThemeProvider');
  }
  return context;
};
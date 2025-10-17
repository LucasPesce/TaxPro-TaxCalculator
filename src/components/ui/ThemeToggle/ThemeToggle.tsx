// src/components/ui/ThemeToggle/ThemeToggle.tsx

import { useTheme } from '../../../hooks/useTheme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import './ThemeToggle.css';

export const ThemeToggle = () => {
  // 1. Usamos nuestro hook personalizado para obtener el estado y la función.
  // ¡Así de fácil! Sin pasar props.
  const { theme, toggleTheme } = useTheme();

  return (
    <label className="theme-switcher" htmlFor="theme-toggle-input" aria-label="Cambiar tema">
      <FontAwesomeIcon icon={faSun} />
      <input 
        type="checkbox" 
        id="theme-toggle-input"
        className="theme-toggle-input" 
        onChange={toggleTheme}
        checked={theme === 'dark'}
      />
      
      <div className="switch">
          <span className="slider round"></span>
      </div>

      <FontAwesomeIcon icon={faMoon} />
    </label>
  );
};

// Componente para cuando el menú está colapsado
export const CollapsedThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className="collapsed-theme-toggle" title="Cambiar tema">
        <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
    </button>
  );
};
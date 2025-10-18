//================ IMPORTACIONES Y ESTILOS ====================
import { useTheme } from '../../../hooks/useTheme';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSun, faMoon } from '@fortawesome/free-solid-svg-icons';
import './ThemeToggle.css';

//================ COMPONENTE INTERRUPTOR DE TEMA (ESTILO SWITCH) ====================
export const ThemeToggle = () => {
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

//================ COMPONENTE INTERRUPTOR DE TEMA (ESTILO BOTÓN SIMPLE) ====================
export const CollapsedThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button onClick={toggleTheme} className="collapsed-theme-toggle" title="Cambiar tema">
        <FontAwesomeIcon icon={theme === 'light' ? faMoon : faSun} />
    </button>
  );
};
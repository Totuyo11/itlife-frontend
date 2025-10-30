import React from 'react';
import { useTheme } from '../theme';

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      className="btn-secondary"
      title={`Cambiar a modo ${next}`}
      onClick={() => setTheme(next)}
      aria-label="Cambiar tema"
      style={{ whiteSpace: 'nowrap' }}
    >
      {theme === 'dark' ? '🌞 Claro' : '🌙 Oscuro'}
    </button>
  );
}


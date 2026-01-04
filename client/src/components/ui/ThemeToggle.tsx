import React from 'react';
import { Button } from 'react-bootstrap';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline-secondary"
      size="sm"
      onClick={toggleTheme}
      className="d-flex align-items-center justify-content-center"
      style={{
        width: '40px',
        height: '40px',
        padding: 0,
        borderRadius: '50%',
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        color: 'var(--color-text-primary)',
        transition: 'all 0.3s ease',
      }}
      title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {theme === 'dark' ? (
        <Sun size={18} />
      ) : (
        <Moon size={18} />
      )}
    </Button>
  );
};

export default ThemeToggle;


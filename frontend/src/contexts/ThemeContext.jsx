import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Create Theme Context
const ThemeContext = createContext();

// Theme modes
export const THEME_MODES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system'
};

// Initial state
const initialState = {
  mode: THEME_MODES.SYSTEM, // system, light, dark
  isDark: false,
  colors: {
    primary: '#00A4EF',
    primaryDark: '#0056b3',
    secondary: '#2B2B2B',
    accent: '#FFB800',
    accentDark: '#ff9500',
    background: '#F5F7FA',
    surface: '#FFFFFF',
    text: '#2B2B2B',
    textSecondary: '#6B7280',
    border: '#E5E7EB',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6'
  },
  fontSize: 'medium', // small, medium, large
  animations: true,
  highContrast: false
};

// Action types
const THEME_ACTIONS = {
  SET_THEME_MODE: 'SET_THEME_MODE',
  SET_DARK_MODE: 'SET_DARK_MODE',
  SET_FONT_SIZE: 'SET_FONT_SIZE',
  TOGGLE_ANIMATIONS: 'TOGGLE_ANIMATIONS',
  TOGGLE_HIGH_CONTRAST: 'TOGGLE_HIGH_CONTRAST',
  UPDATE_COLORS: 'UPDATE_COLORS',
  RESET_THEME: 'RESET_THEME'
};

// Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME_MODE:
      return {
        ...state,
        mode: action.payload
      };
    
    case THEME_ACTIONS.SET_DARK_MODE:
      return {
        ...state,
        isDark: action.payload,
        colors: action.payload ? getDarkModeColors() : getLightModeColors()
      };
    
    case THEME_ACTIONS.SET_FONT_SIZE:
      return {
        ...state,
        fontSize: action.payload
      };
    
    case THEME_ACTIONS.TOGGLE_ANIMATIONS:
      return {
        ...state,
        animations: !state.animations
      };
    
    case THEME_ACTIONS.TOGGLE_HIGH_CONTRAST:
      return {
        ...state,
        highContrast: !state.highContrast,
        colors: !state.highContrast ? getHighContrastColors() : 
                state.isDark ? getDarkModeColors() : getLightModeColors()
      };
    
    case THEME_ACTIONS.UPDATE_COLORS:
      return {
        ...state,
        colors: { ...state.colors, ...action.payload }
      };
    
    case THEME_ACTIONS.RESET_THEME:
      return {
        ...initialState,
        isDark: detectSystemTheme()
      };
    
    default:
      return state;
  }
};

// Color schemes
const getLightModeColors = () => ({
  primary: '#00A4EF',
  primaryDark: '#0056b3',
  secondary: '#2B2B2B',
  accent: '#FFB800',
  accentDark: '#ff9500',
  background: '#F5F7FA',
  surface: '#FFFFFF',
  text: '#2B2B2B',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
});

const getDarkModeColors = () => ({
  primary: '#00A4EF',
  primaryDark: '#0056b3',
  secondary: '#1F2937',
  accent: '#FFB800',
  accentDark: '#ff9500',
  background: '#111827',
  surface: '#1F2937',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  border: '#374151',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
});

const getHighContrastColors = () => ({
  primary: '#0066CC',
  primaryDark: '#004499',
  secondary: '#000000',
  accent: '#FF9900',
  accentDark: '#CC7700',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#333333',
  border: '#000000',
  success: '#008800',
  warning: '#CC8800',
  error: '#CC0000',
  info: '#0066CC'
});

// Utility functions
const detectSystemTheme = () => {
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return false;
};

const saveThemeToStorage = (theme) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('intelixir-theme', JSON.stringify({
      mode: theme.mode,
      fontSize: theme.fontSize,
      animations: theme.animations,
      highContrast: theme.highContrast
    }));
  }
};

const loadThemeFromStorage = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('intelixir-theme');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error parsing saved theme:', error);
      }
    }
  }
  return null;
};

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, {
    ...initialState,
    isDark: detectSystemTheme()
  });

  // Load saved theme on mount
  useEffect(() => {
    const savedTheme = loadThemeFromStorage();
    if (savedTheme) {
      if (savedTheme.mode) {
        dispatch({ type: THEME_ACTIONS.SET_THEME_MODE, payload: savedTheme.mode });
      }
      if (savedTheme.fontSize) {
        dispatch({ type: THEME_ACTIONS.SET_FONT_SIZE, payload: savedTheme.fontSize });
      }
      if (typeof savedTheme.animations === 'boolean') {
        if (savedTheme.animations !== state.animations) {
          dispatch({ type: THEME_ACTIONS.TOGGLE_ANIMATIONS });
        }
      }
      if (typeof savedTheme.highContrast === 'boolean') {
        if (savedTheme.highContrast !== state.highContrast) {
          dispatch({ type: THEME_ACTIONS.TOGGLE_HIGH_CONTRAST });
        }
      }
    }
  }, [state.animations, state.highContrast]);

  // Handle system theme changes
  useEffect(() => {
    if (state.mode === THEME_MODES.SYSTEM && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = (e) => {
        dispatch({ type: THEME_ACTIONS.SET_DARK_MODE, payload: e.matches });
      };

      // Set initial value
      dispatch({ type: THEME_ACTIONS.SET_DARK_MODE, payload: mediaQuery.matches });

      // Listen for changes
      mediaQuery.addEventListener('change', handleChange);

      return () => {
        mediaQuery.removeEventListener('change', handleChange);
      };
    } else if (state.mode === THEME_MODES.LIGHT) {
      dispatch({ type: THEME_ACTIONS.SET_DARK_MODE, payload: false });
    } else if (state.mode === THEME_MODES.DARK) {
      dispatch({ type: THEME_ACTIONS.SET_DARK_MODE, payload: true });
    }
  }, [state.mode]);

  // Apply theme to document
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      
      // Apply dark mode class
      if (state.isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }

      // Apply high contrast class
      if (state.highContrast) {
        root.classList.add('high-contrast');
      } else {
        root.classList.remove('high-contrast');
      }

      // Apply font size class
      root.classList.remove('font-small', 'font-medium', 'font-large');
      root.classList.add(`font-${state.fontSize}`);

      // Apply animation preference
      if (!state.animations) {
        root.classList.add('reduce-motion');
      } else {
        root.classList.remove('reduce-motion');
      }

      // Apply CSS custom properties for colors
      Object.entries(state.colors).forEach(([key, value]) => {
        root.style.setProperty(`--color-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`, value);
      });
    }
  }, [state.isDark, state.highContrast, state.fontSize, state.animations, state.colors]);

  // Save theme changes to storage
  useEffect(() => {
    saveThemeToStorage(state);
  }, [state]);

  // Theme actions
  const setThemeMode = (mode) => {
    dispatch({ type: THEME_ACTIONS.SET_THEME_MODE, payload: mode });
  };

  const toggleDarkMode = () => {
    const newMode = state.isDark ? THEME_MODES.LIGHT : THEME_MODES.DARK;
    dispatch({ type: THEME_ACTIONS.SET_THEME_MODE, payload: newMode });
  };

  const setFontSize = (size) => {
    dispatch({ type: THEME_ACTIONS.SET_FONT_SIZE, payload: size });
  };

  const toggleAnimations = () => {
    dispatch({ type: THEME_ACTIONS.TOGGLE_ANIMATIONS });
  };

  const toggleHighContrast = () => {
    dispatch({ type: THEME_ACTIONS.TOGGLE_HIGH_CONTRAST });
  };

  const updateColors = (colorUpdates) => {
    dispatch({ type: THEME_ACTIONS.UPDATE_COLORS, payload: colorUpdates });
  };

  const resetTheme = () => {
    dispatch({ type: THEME_ACTIONS.RESET_THEME });
  };

  // Get computed theme values
  const getThemeValue = (property) => {
    return state.colors[property] || state[property];
  };

  // Check if current theme matches a condition
  const matchesTheme = (conditions) => {
    return Object.entries(conditions).every(([key, value]) => {
      if (key === 'dark') return state.isDark === value;
      if (key === 'light') return !state.isDark === value;
      return state[key] === value;
    });
  };

  // Context value
  const value = {
    // State
    mode: state.mode,
    isDark: state.isDark,
    colors: state.colors,
    fontSize: state.fontSize,
    animations: state.animations,
    highContrast: state.highContrast,
    
    // Actions
    setThemeMode,
    toggleDarkMode,
    setFontSize,
    toggleAnimations,
    toggleHighContrast,
    updateColors,
    resetTheme,
    
    // Utilities
    getThemeValue,
    matchesTheme,
    
    // Constants
    THEME_MODES
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme-aware component wrapper
export const withTheme = (Component) => {
  return function ThemedComponent(props) {
    const theme = useTheme();
    return <Component {...props} theme={theme} />;
  };
};

export default ThemeContext;
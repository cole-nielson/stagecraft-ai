import { createTheme, MantineColorsTuple } from '@mantine/core';

// Define luxury color palette
const sageNavy: MantineColorsTuple = [
  '#f0f4f8',
  '#d6e3f0',
  '#b3c9e0',
  '#8daed0',
  '#6693bf',
  '#4479af',
  '#1B365D', // Primary brand color
  '#162d51',
  '#122545',
  '#0d1d39'
];

const warmGold: MantineColorsTuple = [
  '#fefdf8',
  '#faf7eb',
  '#f5f0d6',
  '#f0e8c1',
  '#ebe0ac',
  '#e6d897',
  '#C9A961', // Accent color
  '#b89852',
  '#a88744',
  '#977635'
];

export const stagecraftTheme = createTheme({
  primaryColor: 'sageNavy',
  colors: {
    sageNavy,
    warmGold,
  },
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  headings: {
    fontFamily: 'Playfair Display, serif',
    sizes: {
      h1: { fontSize: '3.5rem', lineHeight: '1.1' },
      h2: { fontSize: '2.25rem', lineHeight: '1.2' },
      h3: { fontSize: '1.5rem', lineHeight: '1.3' },
      h4: { fontSize: '1.25rem', lineHeight: '1.4' },
    },
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
  },
  radius: {
    xs: '4px',
    sm: '8px', 
    md: '12px',
    lg: '16px',
    xl: '24px',
  },
  shadows: {
    xs: '0 2px 4px rgba(27, 54, 93, 0.1)',
    sm: '0 4px 12px rgba(27, 54, 93, 0.15)',
    md: '0 8px 25px rgba(27, 54, 93, 0.2)',
    lg: '0 20px 40px rgba(27, 54, 93, 0.25)',
    xl: '0 25px 50px rgba(27, 54, 93, 0.3)',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  components: {
    Button: {
      styles: {
        root: {
          fontWeight: 600,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    Card: {
      styles: {
        root: {
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0 20px 40px rgba(27, 54, 93, 0.15)',
          },
        },
      },
    },
  },
});
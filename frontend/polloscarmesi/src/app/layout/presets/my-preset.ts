import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura'; 

export const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#FDF5F0',
      100: '#F7E0D2',
      200: '#EFC1A5',
      300: '#E6A178',
      400: '#D67A4A',
      500: '#8D4E2D',
      600: '#7B4427',
      700: '#693921',
      800: '#572F1B',
      900: '#452415',
      950: '#2D170D'
    },
    success: { 50: '#E8F5E9', 100: '#C8E6C9', 200: '#A5D6A7', 300: '#81C784', 400: '#66BB6A', 500: '#2E7D32', 600: '#2E7D32', 700: '#1B5E20', 800: '#1B5E20', 900: '#0D3B0E', 950: '#061B07' },
    warning: { 50: '#FFF3E0', 100: '#FFE0B2', 200: '#FFCC80', 300: '#FFB74D', 400: '#FFA726', 500: '#F57C00', 600: '#F57C00', 700: '#E65100', 800: '#BF360C', 900: '#870000', 950: '#430000' },
    danger:  { 50: '#FFEBEE', 100: '#FFCDD2', 200: '#EF9A9A', 300: '#E57373', 400: '#EF5350', 500: '#D32F2F', 600: '#D32F2F', 700: '#C62828', 800: '#B71C1C', 900: '#7F0000', 950: '#4A0000' },
    info:    { 50: '#E1F5FE', 100: '#B3E5FC', 200: '#81D4FA', 300: '#4FC3F7', 400: '#29B6F6', 500: '#0288D1', 600: '#0288D1', 700: '#01579B', 800: '#01579B', 900: '#002F6C', 950: '#001A3B' },
    
    colorScheme: {
      light: {
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}'
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}'
        }
      },
      dark: {
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.900}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}'
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)'
        }
      }
    }
  }
});
// BookShelf color palette — warm terracotta / literary aesthetic
// Dark maroon:   #5E1010
// Rust red:      #A82E1A
// Terracotta:    #CC5030
// Cream:         #EDE0CC

const tintColorLight = '#5E1010';
const tintColorDark = '#EDE0CC';

export default {
  light: {
    text: '#2C0A0A',
    textSecondary: '#7A4A3A',
    background: '#EDE0CC',
    surface: '#F7F0E6',
    surfaceSecondary: '#E8D5BC',
    tint: tintColorLight,
    accent: '#A82E1A',
    accentLight: '#E8C4B0',
    border: '#D9C4A8',
    tabIconDefault: '#A07060',
    tabIconSelected: tintColorLight,
    star: '#CC5030',
    error: '#ef4444',
    success: '#22c55e',
  },
  dark: {
    text: '#F5EAD8',
    textSecondary: '#C09070',
    background: '#1A0505',
    surface: '#2E0D0D',
    surfaceSecondary: '#3D1515',
    tint: tintColorDark,
    accent: '#CC5030',
    accentLight: '#5E1010',
    border: '#4A1A1A',
    tabIconDefault: '#7A4A3A',
    tabIconSelected: tintColorDark,
    star: '#CC5030',
    error: '#ef4444',
    success: '#22c55e',
  },
};

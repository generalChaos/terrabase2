export interface LogoStyle {
  id: string;
  name: string;
  description: string;
  image: string;
  characteristics: string[];
  colorPalette: string[];
  targetAudience: string;
}

export const LOGO_STYLES: LogoStyle[] = [
  {
    id: 'fun-and-friendly',
    name: 'Fun & Friendly',
    description: 'Bright, colorful, cartoon-like designs perfect for youth teams',
    image: '/styles/lsc-example-logo-fun-and-friendly.png',
    characteristics: [
      'Rounded shapes',
      'Bright colors', 
      'Friendly mascots',
      'Playful typography'
    ],
    colorPalette: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'],
    targetAudience: 'Youth teams, recreational leagues'
  },
  {
    id: 'bold-and-competitive',
    name: 'Bold & Competitive',
    description: 'Strong, confident, professional designs for competitive teams',
    image: '/styles/lsc-example-logo-bold-and-competative.png',
    characteristics: [
      'Sharp lines',
      'Strong typography',
      'Team colors',
      'Professional look'
    ],
    colorPalette: ['#1E3A8A', '#DC2626', '#000000', '#FFFFFF'],
    targetAudience: 'Competitive teams, older age groups'
  },
  {
    id: 'dynamic-and-fierce',
    name: 'Dynamic & Fierce',
    description: 'Aggressive, energetic, action-oriented designs for high-energy sports',
    image: '/styles/lsc-example-logo-dynamic-and-fierce.png.png',
    characteristics: [
      'Angular shapes',
      'Dynamic elements',
      'Bold contrasts',
      'High energy'
    ],
    colorPalette: ['#DC2626', '#F59E0B', '#000000', '#6B7280'],
    targetAudience: 'High-energy sports, competitive leagues'
  },
  {
    id: 'classic-and-iconic',
    name: 'Classic & Iconic',
    description: 'Timeless, traditional, heritage-inspired designs for established teams',
    image: '/styles/lsc-example-logo-classic-and-iconic.png',
    characteristics: [
      'Clean lines',
      'Classic fonts',
      'Traditional symbols',
      'Heritage feel'
    ],
    colorPalette: ['#1E3A8A', '#F59E0B', '#FFFFFF', '#6B7280'],
    targetAudience: 'Established teams, traditional sports'
  }
];

export const getLogoStyleById = (id: string): LogoStyle | undefined => {
  return LOGO_STYLES.find(style => style.id === id);
};

export const getLogoStyleByName = (name: string): LogoStyle | undefined => {
  return LOGO_STYLES.find(style => style.name === name);
};

export const colors = {
  ink: '#12292E',
  sea: '#0E5E57',
  seaDeep: '#093F3A',
  foam: '#F2F7F4',
  hibiscus: '#E8465C',
  mango: '#FFB13D',
  sky: '#CDE9E2',
  card: '#FFFFFF',
  line: '#DCE8E3',
  muted: '#5C7570',
  sand: '#F6C877',
  sandDeep: '#E8A33D',
  glow: '#FFE1A8',
};

export const ISLANDS = [
  'Jamaica', 'Trinidad & Tobago', 'Barbados', 'Bahamas', 'Haiti',
  'Dominican Republic', 'Cuba', 'Puerto Rico', 'Grenada', 'St. Lucia',
  'St. Vincent & Grenadines', 'Antigua & Barbuda', 'Dominica',
  'St. Kitts & Nevis', 'Guyana', 'Belize', 'Suriname', 'Curaçao', 'Aruba',
  'Martinique', 'Guadeloupe', 'US Virgin Islands', 'British Virgin Islands',
  'Cayman Islands', 'Turks & Caicos', 'Montserrat', 'Anguilla', 'Bonaire',
  'Sint Maarten', 'St. Martin',
];

export const FLAG_COLORS = ['#E8465C', '#FFB13D', '#0E5E57', '#2E6FD8', '#7B4FBF', '#E8743B', '#1FA37A'];
export const islandColor = (island: string) =>
  FLAG_COLORS[Math.max(0, ISLANDS.indexOf(island)) % FLAG_COLORS.length];

export const LOOKING_FOR_OPTIONS = [
  'Looking for a Starboy 👑',
  'Looking for a Hotgyal 🔥',
  'Open to link up 💫',
  'Just here to lime 🌴',
  'Prefer not to say',
];

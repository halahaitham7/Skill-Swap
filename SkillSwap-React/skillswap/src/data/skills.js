// Skill categories, levels and scheduling constants shared across the app.

export const CATEGORIES = [
  { name: 'Photography', icon: 'camera', tone: 'purple', examples: 'Portraits · Lightroom · Street' },
  { name: 'Languages', icon: 'globe', tone: 'blue', examples: 'English · Spanish · Arabic' },
  { name: 'Programming', icon: 'code', tone: 'purple', examples: 'Python · JavaScript · SQL' },
  { name: 'Graphic Design', icon: 'pen', tone: 'blue', examples: 'Figma · Branding · Illustration' },
  { name: 'Cooking', icon: 'pot', tone: 'purple', examples: 'Baking · Vegan · Middle Eastern' },
  { name: 'Music', icon: 'music', tone: 'blue', examples: 'Guitar · Piano · Music theory' },
  { name: 'Marketing', icon: 'megaphone', tone: 'purple', examples: 'Social media · SEO · Copywriting' },
  { name: 'Video Editing', icon: 'video', tone: 'blue', examples: 'Premiere · DaVinci · Reels' },
];

// Maps a (lower-cased) skill name to its category. Unknown skills fall back to "Other".
const SKILL_CATEGORY = {
  photography: 'Photography',
  'photo editing': 'Photography',
  lightroom: 'Photography',
  'film photography': 'Photography',
  english: 'Languages',
  spanish: 'Languages',
  arabic: 'Languages',
  french: 'Languages',
  portuguese: 'Languages',
  japanese: 'Languages',
  german: 'Languages',
  'public speaking': 'Languages',
  python: 'Programming',
  javascript: 'Programming',
  sql: 'Programming',
  react: 'Programming',
  'graphic design': 'Graphic Design',
  illustration: 'Graphic Design',
  figma: 'Graphic Design',
  branding: 'Graphic Design',
  cooking: 'Cooking',
  baking: 'Cooking',
  sourdough: 'Cooking',
  guitar: 'Music',
  piano: 'Music',
  'music theory': 'Music',
  music: 'Music',
  marketing: 'Marketing',
  seo: 'Marketing',
  copywriting: 'Marketing',
  'social media': 'Marketing',
  'video editing': 'Video Editing',
  premiere: 'Video Editing',
};

export function categoryOf(skillName = '') {
  return SKILL_CATEGORY[skillName.trim().toLowerCase()] || 'Other';
}

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
export const METHODS = ['Online', 'In person', 'Both'];
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const TIMES = ['Morning', 'Afternoon', 'Evening'];
export const DURATIONS = [30, 45, 60, 90];
export const START_TIMES = ['09:00', '12:00', '15:00', '17:30', '18:00', '19:00', '20:00'];

// Avatar color pairs (background / text) that pass 4.5:1 contrast.
export const AVATAR_PALETTES = [
  { bg: '#FFE3D3', fg: '#8A3B12' },
  { bg: '#DDF3E8', fg: '#0D6B47' },
  { bg: '#E5F0FF', fg: '#0B5CAD' },
  { bg: '#EFEBFF', fg: '#4628D8' },
  { bg: '#FFF1C7', fg: '#7A5600' },
  { bg: '#FBE0EC', fg: '#8C1D4F' },
];

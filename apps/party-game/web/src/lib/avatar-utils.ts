// Avatar utility functions and constants

export const AVATAR_IMAGES = [
  'avatar_1_transparent.png',
  'avatar_2_transparent.png', 
  'avatar_3_transparent.png',
  'avatar_4_transparent.png',
  'avatar_5_transparent.png',
  'avatar_6_transparent.png',
  'avatar_7_transparent.png',
  'avatar_8_transparent.png',
  'avatar_9_transparent.png',
] as const;

// Fun party game names
export const RANDOM_NAMES = [
  'Shadow', 'Nova', 'Echo', 'Phoenix', 'Blitz', 'Frost', 'Vortex', 'Zen', 'Raven',
  'Blaze', 'Thunder', 'Mystic', 'Neon', 'Cosmic', 'Pulse', 'Quantum', 'Aurora', 'Flux',
  'Cipher', 'Rogue', 'Viper', 'Falcon', 'Wolf', 'Tiger', 'Dragon', 'Eagle', 'Lion',
  'Bear', 'Shark', 'Panda', 'Koala', 'Penguin', 'Owl', 'Hawk', 'Fox', 'Lynx'
] as const;

// Combined avatar options (only images)
export const ALL_AVATARS = [...AVATAR_IMAGES] as const;

export type AvatarImage = typeof AVATAR_IMAGES[number];
export type Avatar = AvatarImage;
export type RandomName = typeof RANDOM_NAMES[number];

// Helper function to check if avatar is an image
export function isImageAvatar(avatar: string): avatar is AvatarImage {
  return AVATAR_IMAGES.includes(avatar as AvatarImage);
}

// Helper function to get avatar image path
export function getAvatarImagePath(avatar: AvatarImage): string {
  return `/avatars/${avatar}`;
}

// Helper function to get avatar display name
export function getAvatarDisplayName(avatar: Avatar): string {
  // Extract number from filename (e.g., "avatar_1_transparent.png" -> "Avatar 1")
  const match = avatar.match(/avatar_(\d+)_transparent\.png/);
  if (match) {
    return `Avatar ${match[1]}`;
  }
  return avatar;
}

// Helper function to get random avatar
export function getRandomAvatar(): Avatar {
  const randomIndex = Math.floor(Math.random() * ALL_AVATARS.length);
  return ALL_AVATARS[randomIndex];
}

// Helper function to get random name
export function getRandomName(): RandomName {
  const randomIndex = Math.floor(Math.random() * RANDOM_NAMES.length);
  return RANDOM_NAMES[randomIndex];
}

// Helper function to get random avatar and name combination
export function getRandomAvatarAndName(): { avatar: Avatar; name: RandomName } {
  return {
    avatar: getRandomAvatar(),
    name: getRandomName()
  };
}

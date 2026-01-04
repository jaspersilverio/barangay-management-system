/**
 * Generate a default avatar SVG data URL
 * This is a reusable utility for displaying placeholder images
 */
export const getDefaultAvatar = (name: string = 'User', size: number = 120): string => {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#e5e7eb"/>
      <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" 
            font-family="Arial, sans-serif" font-size="${size / 3}" font-weight="600" fill="#6b7280">
        ${initials}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};

/**
 * Handle image load errors by replacing with default avatar
 */
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, name: string = 'User'): void => {
  const target = e.target as HTMLImageElement;
  target.src = getDefaultAvatar(name);
  target.onerror = null; // Prevent infinite loop
};


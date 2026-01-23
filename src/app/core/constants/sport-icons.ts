export const SPORT_ICONS = {
  1: 'sports_soccer',
  2: 'sports_basketball',
  3: 'sports_tennis',
  4: 'sports_baseball',
  5: 'sports_football',
  6: 'sports_volleyball',
  7: 'sports_hockey',
  8: 'sports_cricket',
  9: 'sports_golf',
  10: 'sports_rugby',
  11: 'sports_mma',
  12: 'sports_esports',
  13: 'sports_handball',
  14: 'sports_motorsports',
  15: 'sports_kabaddi'
};

export function getSportIcon(sportId: number): string {
  return SPORT_ICONS[sportId] || 'sports';
}

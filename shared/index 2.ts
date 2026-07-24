export const GAME_PHASES = {
  LOBBY: 'LOBBY',
  IN_PROGRESS: 'IN_PROGRESS',
  VOTING: 'VOTING',
  END_ROUND: 'END_ROUND'
} as const;

export type GamePhase = typeof GAME_PHASES[keyof typeof GAME_PHASES];

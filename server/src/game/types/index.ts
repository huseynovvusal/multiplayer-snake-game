export interface Position {
  x: number;
  y: number;
}

export interface Direction {
  x: number;
  y: number;
}

export interface Player {
  id: string;
  name: string;
  snake: Position[];
  direction: Direction;
  color: string;
  isEliminated: boolean;
  score: number;
}

export interface GameState {
  id: string;
  players: Record<string, Player>;
  food: Position[];
  gridSize: { width: number; height: number };
  isGameOver: boolean;
}

export interface GameRoom {
  id: string;
  gameState: GameState;
  isGameStarted: boolean;
}

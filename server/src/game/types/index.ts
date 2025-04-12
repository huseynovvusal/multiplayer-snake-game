export interface Position {
  x: number;
  y: number;
}

export interface Direction {
  x: number;
  y: number;
}

export type Snake = Position[];
export type Food = Position[];

export interface Player {
  id: string;
  name: string;
  snake: Snake;
  direction: Direction;
  color: string;
  isEliminated: boolean;
  score: number;
}

export interface GameState {
  id: string;
  players: Record<string, Player>;
  food: Food;
  gridSize: { width: number; height: number };
  isGameOver: boolean;
  isGameStarted: boolean;
}

export interface GameRoom {
  id: string;
  gameState: GameState;
  ownerId: string;
}

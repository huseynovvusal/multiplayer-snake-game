import { GameState } from './gameState.type';

export interface GameRoom {
  id: string;
  gameState: GameState;
  players: string[];
}

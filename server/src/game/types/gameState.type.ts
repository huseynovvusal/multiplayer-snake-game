import { Position } from "./position.type";
import { Snake } from "./snake.type";

export interface GameState {
  id: string;
  snakes: Record<string, Snake>;
  food: Position[];
  gridSize: { width: number; height: number };
  isGameOver: boolean;
}

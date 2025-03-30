export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT"

export interface Position {
  x: number
  y: number
}

export interface Snake {
  id: string
  positions: Position[]
  direction: Direction
  color: string
}

export interface GameState {
  id: string
  snakes: Record<string, Snake>
  food: Position[]
  gridSize: { width: number; height: number }
  isGameOver: boolean
}

export interface Player {
  id: string
  name: string
  score: number
}

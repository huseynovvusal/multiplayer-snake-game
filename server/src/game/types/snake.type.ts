import { Position } from "./position.type"

export interface Snake {
  id: string
  positions: Position[]
  direction: "UP" | "DOWN" | "LEFT" | "RIGHT"
  color: string
}

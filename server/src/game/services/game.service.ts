import { Injectable } from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { GameRoom } from "../types/gameRoom";
import { Position } from "../types/position.type";
import { Snake } from "../types/snake.type";

@Injectable()
export class GameService {
  private gameRooms: Map<string, GameRoom> = new Map();
  private readonly TICK_RATE = 100; // ms
  private intervalIds: Map<string, NodeJS.Timeout> = new Map();

  createGame(gridSize = { width: 30, height: 30 }): string {
    const gameId = uuidv4();

    const gameRoom: GameRoom = {
      id: gameId,
      players: [],
      gameState: {
        id: gameId,
        snakes: {},
        food: [],
        gridSize,
        isGameOver: false,
      },
    };

    this.gameRooms.set(gameId, gameRoom);
    this.generateFood(gameId);

    return gameId;
  }

  addPlayer(gameId: string, playerId: string): Snake | null {
    const gameRoom = this.gameRooms.get(gameId);
    if (!gameRoom) return null;

    // Random starting position
    const startX =
      Math.floor(Math.random() * (gameRoom.gameState.gridSize.width - 10)) + 5;
    const startY =
      Math.floor(Math.random() * (gameRoom.gameState.gridSize.height - 10)) + 5;

    // Random color
    const color = `#${Math.floor(Math.random() * 16777215).toString(16)}`;

    const snake: Snake = {
      id: playerId,
      positions: [{ x: startX, y: startY }],
      direction: ["UP", "DOWN", "LEFT", "RIGHT"][
        Math.floor(Math.random() * 4)
      ] as "UP" | "DOWN" | "LEFT" | "RIGHT",
      color,
    };

    gameRoom.players.push(playerId);
    gameRoom.gameState.snakes[playerId] = snake;

    // Start game loop if first player
    if (gameRoom.players.length === 1) {
      this.startGameLoop(gameId);
    }

    return snake;
  }

  removePlayer(gameId: string, playerId: string): void {
    const gameRoom = this.gameRooms.get(gameId);
    if (!gameRoom) return;

    gameRoom.players = gameRoom.players.filter((id) => id !== playerId);
    delete gameRoom.gameState.snakes[playerId];

    // Stop game if no players left
    if (gameRoom.players.length === 0) {
      this.stopGameLoop(gameId);
      this.gameRooms.delete(gameId);
    }
  }

  changeDirection(
    gameId: string,
    playerId: string,
    direction: "UP" | "DOWN" | "LEFT" | "RIGHT",
  ): void {
    const gameRoom = this.gameRooms.get(gameId);
    if (!gameRoom || !gameRoom.gameState.snakes[playerId]) return;

    const currentDir = gameRoom.gameState.snakes[playerId].direction;

    // Prevent 180-degree turns
    if (
      (currentDir === "UP" && direction === "DOWN") ||
      (currentDir === "DOWN" && direction === "UP") ||
      (currentDir === "LEFT" && direction === "RIGHT") ||
      (currentDir === "RIGHT" && direction === "LEFT")
    ) {
      return;
    }

    gameRoom.gameState.snakes[playerId].direction = direction;
  }

  private startGameLoop(gameId: string): void {
    const intervalId = setInterval(
      () => this.updateGameState(gameId),
      this.TICK_RATE,
    );
    this.intervalIds.set(gameId, intervalId);
  }

  private stopGameLoop(gameId: string): void {
    const intervalId = this.intervalIds.get(gameId);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervalIds.delete(gameId);
    }
  }

  private updateGameState(gameId: string): GameRoom | null {
    const gameRoom = this.gameRooms.get(gameId);
    if (!gameRoom) return null;

    // Move each snake
    Object.values(gameRoom.gameState.snakes).forEach((snake) => {
      const head = { ...snake.positions[0] };

      // Move head based on direction
      switch (snake.direction) {
        case "UP":
          head.y -= 1;
          break;
        case "DOWN":
          head.y += 1;
          break;
        case "LEFT":
          head.x -= 1;
          break;
        case "RIGHT":
          head.x += 1;
          break;
      }

      // Check for collisions
      if (this.checkCollision(gameRoom, head, snake.id)) {
        this.killSnake(gameRoom, snake.id);
        return;
      }

      // Check if food is eaten
      const foodIndex = this.isFoodEaten(gameRoom, head);
      if (foodIndex >= 0) {
        // Snake grows
        gameRoom.gameState.food.splice(foodIndex, 1);
        this.generateFood(gameId);
      } else {
        // Remove tail segment
        snake.positions.pop();
      }

      // Add new head position
      snake.positions.unshift(head);
    });

    return gameRoom;
  }

  private checkCollision(
    gameRoom: GameRoom,
    position: Position,
    snakeId: string,
  ): boolean {
    const { width, height } = gameRoom.gameState.gridSize;

    // Check wall collision
    if (
      position.x < 0 ||
      position.y < 0 ||
      position.x >= width ||
      position.y >= height
    ) {
      return true;
    }

    // Check collision with any snake (including self)
    for (const snake of Object.values(gameRoom.gameState.snakes)) {
      for (let i = 0; i < snake.positions.length; i++) {
        // Skip checking head position with itself for the moving snake
        if (snake.id === snakeId && i === 0) continue;

        const segment = snake.positions[i];
        if (segment.x === position.x && segment.y === position.y) {
          return true;
        }
      }
    }

    return false;
  }

  private isFoodEaten(gameRoom: GameRoom, position: Position): number {
    return gameRoom.gameState.food.findIndex(
      (food) => food.x === position.x && food.y === position.y,
    );
  }

  private killSnake(gameRoom: GameRoom, snakeId: string): void {
    delete gameRoom.gameState.snakes[snakeId];
  }

  private generateFood(gameId: string): void {
    const gameRoom = this.gameRooms.get(gameId);
    if (!gameRoom) return;

    const { width, height } = gameRoom.gameState.gridSize;

    // Generate a random position
    const newFood: Position = {
      x: Math.floor(Math.random() * width),
      y: Math.floor(Math.random() * height),
    };

    // Make sure it doesn't collide with any snake
    for (const snake of Object.values(gameRoom.gameState.snakes)) {
      if (
        snake.positions.some(
          (pos) => pos.x === newFood.x && pos.y === newFood.y,
        )
      ) {
        this.generateFood(gameId); // Try again with recursion
        return;
      }
    }

    gameRoom.gameState.food.push(newFood);
  }

  getGameState(gameId: string): GameRoom | undefined {
    return this.gameRooms.get(gameId);
  }
}

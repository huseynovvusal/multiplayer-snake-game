import { Injectable } from "@nestjs/common";
import { GameRoom, Player, Position } from "./types";
import { v4 as uuidv4 } from "uuid"; // Import uuid for generating unique room IDs

@Injectable()
export class GameService {
  private gameRooms: Map<string, GameRoom> = new Map();
  private intervalIds: Map<string, NodeJS.Timeout> = new Map();

  private readonly TICK_RATE = 300; // ms
  private GRID_SIZE = { width: 50, height: 50 };
  private INITIAL_SNAKE_LENGTH = 3;

  createGameRoom(ownerId: string, ownerName: string): GameRoom {
    const roomId = uuidv4(); // Generate a unique room ID

    const color = `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`; //? Random color for the player

    const gameRoom: GameRoom = {
      id: roomId,
      ownerId,
      gameState: {
        id: roomId,
        players: {
          [ownerId]: {
            id: ownerId,
            name: ownerName,
            score: 0,
            isEliminated: false,
            snake: [],
            direction: { x: 1, y: 0 },
            color,
          },
        },
        food: [],
        gridSize: this.GRID_SIZE,
        isGameOver: false,
        isGameStarted: false,
      },
    };

    this.gameRooms.set(roomId, gameRoom);

    return gameRoom;
  }

  getGameRoom(roomId: string): GameRoom | undefined {
    return this.gameRooms.get(roomId);
  }

  addPlayerToRoom(roomId: string, playerId: string, playerName: string): void {
    const gameRoom = this.getGameRoom(roomId);
    if (!gameRoom) throw new Error("There is no such a game room");

    const playerExists = playerId in gameRoom.gameState.players;
    if (playerExists) {
      throw new Error("Player already exists in the game room");
    }

    const color = `hsl(${Math.floor(Math.random() * 360)}, 100%, 50%)`; //? Random color for the player

    gameRoom.gameState.players[playerId] = {
      id: playerId,
      name: playerName,
      score: 0,
      isEliminated: false,
      snake: [],
      direction: { x: 1, y: 0 },
      color,
    };
  }

  eliminatePlayer(roomId: string, playerId: string): void {
    const gameRoom = this.getGameRoom(roomId);
    if (!gameRoom) throw new Error("There is no such a game room");

    const player = gameRoom.gameState.players[playerId];
    if (!player) throw new Error("Player not found");

    player.isEliminated = true;
  }

  startGame(roomId: string): void {
    const gameRoom = this.getGameRoom(roomId);
    if (!gameRoom) throw new Error("There is no such a game room");

    if (gameRoom.gameState.isGameStarted) {
      throw new Error("Game already started");
    }

    gameRoom.gameState.isGameStarted = true;

    // Initialize players
    for (const playerId in gameRoom.gameState.players) {
      const player = gameRoom.gameState.players[playerId];
      player.snake = this.initializeSnake();
    }

    // Start the game loop
    this.startGameLoop(roomId);

    //!
    console.log("Game started in room:", roomId);
  }

  private initializeSnake(): { x: number; y: number }[] {
    // Calculate the boundaries for the inner 70% of the grid
    const margin = {
      x: Math.floor(this.GRID_SIZE.width * 0.15), // 15% margin on each side = 70% usable area
      y: Math.floor(this.GRID_SIZE.height * 0.15),
    };

    // Min and max coordinates for spawn area
    const minX = margin.x;
    const maxX = this.GRID_SIZE.width - margin.x;
    const minY = margin.y;
    const maxY = this.GRID_SIZE.height - margin.y;

    // Collect all existing snake positions
    const allSnakePositions: { x: number; y: number }[] = [];
    this.gameRooms.forEach((gameRoom) => {
      if (gameRoom.gameState.isGameStarted) return;

      Object.values(gameRoom.gameState.players).forEach((player) => {
        if (player.snake.length > 0) {
          allSnakePositions.push(...player.snake);
        }
      });
    });

    // Possible directions: right, left, up, down
    const directions = [
      { x: 1, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ];

    let valid = false;
    let snake: { x: number; y: number }[] = [];
    let attempts = 0;
    const maxAttempts = 100;

    while (!valid && attempts < maxAttempts) {
      snake = [];

      // Choose a random direction
      const direction =
        directions[Math.floor(Math.random() * directions.length)];

      // Adjust boundaries based on the direction to prevent the snake from spawning at borders
      let adjustedMinX = minX;
      let adjustedMaxX = maxX;
      let adjustedMinY = minY;
      let adjustedMaxY = maxY;

      // Adjust the bounds based on the direction to ensure the entire snake body fits within the grid
      if (direction.x > 0) {
        // If moving right, ensure there's enough space to the left for the snake's body
        adjustedMinX = Math.max(minX, this.INITIAL_SNAKE_LENGTH - 1);
      } else if (direction.x < 0) {
        // If moving left, ensure there's enough space to the right for the snake's body
        adjustedMaxX = Math.min(
          maxX,
          this.GRID_SIZE.width - this.INITIAL_SNAKE_LENGTH,
        );
      }

      if (direction.y > 0) {
        // If moving down, ensure there's enough space above for the snake's body
        adjustedMinY = Math.max(minY, this.INITIAL_SNAKE_LENGTH - 1);
      } else if (direction.y < 0) {
        // If moving up, ensure there's enough space below for the snake's body
        adjustedMaxY = Math.min(
          maxY,
          this.GRID_SIZE.height - this.INITIAL_SNAKE_LENGTH,
        );
      }

      // Generate random starting position within the adjusted area
      const startX =
        Math.floor(Math.random() * (adjustedMaxX - adjustedMinX + 1)) +
        adjustedMinX;
      const startY =
        Math.floor(Math.random() * (adjustedMaxY - adjustedMinY + 1)) +
        adjustedMinY;

      valid = true;

      // Create snake segments based on the chosen direction
      for (let i = 0; i < this.INITIAL_SNAKE_LENGTH; i++) {
        const pos = {
          x: startX - direction.x * i,
          y: startY - direction.y * i,
        };

        // Check if the snake segment is within grid boundaries
        if (
          pos.x < 0 ||
          pos.x >= this.GRID_SIZE.width ||
          pos.y < 0 ||
          pos.y >= this.GRID_SIZE.height
        ) {
          valid = false;
          break;
        }

        // Check for overlap with existing snakes
        if (
          allSnakePositions.some(
            (segment) => segment.x === pos.x && segment.y === pos.y,
          )
        ) {
          valid = false;
          break;
        }

        snake.push(pos);
      }

      attempts++;
    }

    return snake;
  }

  private startGameLoop(roomId: string): void {
    const gameRoom = this.getGameRoom(roomId);
    if (!gameRoom) throw new Error("There is no such a game room");

    const intervalId = setInterval(() => {
      this.updateGameState(gameRoom);
    }, this.TICK_RATE);

    this.intervalIds.set(roomId, intervalId);
  }

  private updateGameState(gameRoom: GameRoom): void {
    for (const playerId in gameRoom.gameState.players) {
      const player = gameRoom.gameState.players[playerId];
      if (!player.isEliminated) {
        // Move the snake
        const head = { ...player.snake[0] };
        head.x += player.direction.x;
        head.y += player.direction.y;

        // Prevent moving backwards
        const neck = player.snake[1];
        if (neck && head.x === neck.x && head.y === neck.y) {
          head.x -= player.direction.x;
          head.y -= player.direction.y;
          continue;
        }

        // Check for collisions with walls or other players
        this.checkCollision(gameRoom, playerId, head);

        if (player.isEliminated) {
          continue;
        }

        // Update the snake position
        player.snake.unshift(head);
        player.snake.pop();

        console.log("Snake changed");
      }
    }

    // Check for collisions with food
    // For example, if a player eats food, grow the snake and increase score
    // Update food position, spawn new food, etc.

    // Check if the game is over
    if (this.isGameOver(gameRoom)) {
      clearInterval(this.intervalIds.get(gameRoom.id));
      gameRoom.gameState.isGameStarted = false;
      gameRoom.gameState.isGameOver = true;
    }
  }

  private isGameOver(gameRoom: GameRoom): null | Player {
    const activePlayers = Object.values(gameRoom.gameState.players).filter(
      (player) => !player.isEliminated,
    );

    // if (activePlayers.length === 1) {
    //   return activePlayers[0]; // Return the winner
    // }

    return null; // No winner yet
  }

  changePlayerDirection(
    roomId: string,
    playerId: string,
    direction: { x: number; y: number },
  ): void {
    const gameRoom = this.getGameRoom(roomId);
    if (!gameRoom) throw new Error("There is no such a game room");

    const player = gameRoom.gameState.players[playerId];
    if (!player) throw new Error("Player not found");

    // Prevent the snake from moving in the opposite direction
    if (
      (player.direction.x === -direction.x &&
        player.direction.y === -direction.y) ||
      (player.direction.x === direction.x && player.direction.y === direction.y)
    ) {
      return;
    }

    player.direction = direction;
  }

  private checkCollision(
    gameRoom: GameRoom,
    playerId: string,
    position: Position,
  ): void {
    if (!gameRoom) throw new Error("There is no such a game room");

    const player = gameRoom.gameState.players[playerId];
    if (!player) throw new Error("Player not found");

    // Check for collisions with walls
    if (
      position.x < 0 ||
      position.x >= gameRoom.gameState.gridSize.width ||
      position.y < 0 ||
      position.y >= gameRoom.gameState.gridSize.height
    ) {
      this.eliminatePlayer(gameRoom.id, playerId);
      return;
    }

    // Check for collisions with snakes including the player's own snake
    for (const otherPlayerId in gameRoom.gameState.players) {
      if (otherPlayerId !== playerId) {
        const otherPlayer = gameRoom.gameState.players[otherPlayerId];
        for (const segment of otherPlayer.snake) {
          if (segment.x === position.x && segment.y === position.y) {
            this.eliminatePlayer(gameRoom.id, playerId);
            return;
          }
        }
      }
    }
  }
}

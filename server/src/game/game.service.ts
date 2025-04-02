import { Injectable } from "@nestjs/common";
import { GameRoom, Player, Position } from "./types";

@Injectable()
export class GameService {
  private gameRooms: Map<string, GameRoom> = new Map();
  private intervalIds: Map<string, NodeJS.Timeout> = new Map();

  private readonly TICK_RATE = 100; // ms
  private GRID_SIZE = { width: 50, height: 50 };
  private INITIAL_SNAKE_LENGTH = 3;

  createGameRoom(roomId: string): GameRoom {
    const gameRoom: GameRoom = {
      id: roomId,
      gameState: {
        id: roomId,
        players: {},
        food: [],
        gridSize: this.GRID_SIZE,
        isGameOver: false,
      },
      isGameStarted: false,
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

    if (gameRoom.isGameStarted) {
      throw new Error("Game already started");
    }

    gameRoom.isGameStarted = true;

    // Initialize players' snakes
    for (const playerId in gameRoom.gameState.players) {
      const player = gameRoom.gameState.players[playerId];
      player.snake = this.initializeSnake();
    }

    // Start the game loop
    this.startGameLoop(roomId);
  }

  private initializeSnake(): { x: number; y: number }[] {
    const snake = [];
    const startX = Math.floor(Math.random() * this.GRID_SIZE.width);
    const startY = Math.floor(Math.random() * this.GRID_SIZE.height);

    for (let i = 0; i < this.INITIAL_SNAKE_LENGTH; i++) {
      snake.push({ x: startX - i, y: startY });
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
      }
    }

    // Check for collisions with food
    // For example, if a player eats food, grow the snake and increase score
    // Update food position, spawn new food, etc.

    // Check if the game is over
    if (this.isGameOver(gameRoom)) {
      clearInterval(this.intervalIds.get(gameRoom.id));
      gameRoom.isGameStarted = false;
      gameRoom.gameState.isGameOver = true;
    }
  }

  private isGameOver(gameRoom: GameRoom): null | Player {
    const activePlayers = Object.values(gameRoom.gameState.players).filter(
      (player) => !player.isEliminated,
    );

    if (activePlayers.length === 1) {
      return activePlayers[0]; // Return the winner
    }

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

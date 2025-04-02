import { Injectable } from "@nestjs/common";
import { GameRoom } from "./types";

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
}

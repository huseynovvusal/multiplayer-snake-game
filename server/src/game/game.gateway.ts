import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "./services/game.service";

@WebSocketGateway({ cors: true })
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private playerRooms = new Map<string, string>(); // playerId -> roomId

  constructor(private gameService: GameService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const gameId = this.playerRooms.get(client.id);

    if (gameId) {
      this.gameService.removePlayer(gameId, client.id);
      this.playerRooms.delete(client.id);

      // Notify room that player left
      client.to(gameId).emit("playerLeft", { playerId: client.id });

      // Get updated game state
      const gameRoom = this.gameService.getGameState(gameId);
      if (gameRoom) {
        this.server.to(gameId).emit("gameState", gameRoom.gameState);
      }
    }
  }

  @SubscribeMessage("createGame")
  handleCreateGame(client: Socket) {
    const gameId = this.gameService.createGame();
    client.join(gameId);

    const snake = this.gameService.addPlayer(gameId, client.id);
    this.playerRooms.set(client.id, gameId);

    // Start broadcasting game state
    this.startBroadcastingGameState(gameId);

    return { gameId, snake };
  }

  @SubscribeMessage("joinGame")
  handleJoinGame(client: Socket, data: { gameId: string }) {
    const { gameId } = data;
    const gameRoom = this.gameService.getGameState(gameId);

    if (!gameRoom) {
      return { error: "Game not found" };
    }

    client.join(gameId);
    const snake = this.gameService.addPlayer(gameId, client.id);
    this.playerRooms.set(client.id, gameId);

    // Notify room that player joined
    client.to(gameId).emit("playerJoined", {
      playerId: client.id,
      snake,
    });

    return {
      success: true,
      gameState: gameRoom.gameState,
      snake,
    };
  }

  @SubscribeMessage("changeDirection")
  handleChangeDirection(
    client: Socket,
    data: { direction: "UP" | "DOWN" | "LEFT" | "RIGHT" },
  ) {
    const gameId = this.playerRooms.get(client.id);
    if (!gameId) return;

    this.gameService.changeDirection(gameId, client.id, data.direction);
  }

  private startBroadcastingGameState(gameId: string) {
    const interval = setInterval(() => {
      const gameRoom = this.gameService.getGameState(gameId);
      if (!gameRoom) {
        clearInterval(interval);
        return;
      }

      this.server.to(gameId).emit("gameState", gameRoom.gameState);
    }, 50); // Send updates every 50ms
  }
}

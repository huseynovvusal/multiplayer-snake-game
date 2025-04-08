import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { GameService } from "./game.service";

@WebSocketGateway({
  cors: {
    origin: "*",
  },
})
export class GameGateway {
  @WebSocketServer() server: Server;
  private playerRooms = new Map<string, string>(); // Maps player IDs to room IDs

  constructor(private gameService: GameService) {}

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    const roomId = this.playerRooms.get(client.id);

    if (roomId) {
      this.gameService.eliminatePlayer(roomId, client.id);
      this.playerRooms.delete(client.id);
    }
  }

  @SubscribeMessage("createRoom")
  handleCreateRoom(client: any, data: { playerName: string }) {
    let gameRoom = undefined;

    // !!
    console.log("Creating room...", data.playerName);

    try {
      gameRoom = this.gameService.createGameRoom(client.id, data.playerName);
    } catch (error) {
      client.emit("roomCreationError", error.message);
      return;
    }

    client.join(gameRoom.id);

    this.playerRooms.set(client.id, gameRoom.id);

    this.server.to(gameRoom.id).emit("roomCreated", gameRoom);
  }

  @SubscribeMessage("joinRoom")
  handleJoinRoom(client: any, data: { roomId: string; playerName: string }) {
    const { roomId, playerName } = data;

    const gameRoom = this.gameService.getGameRoom(roomId);

    if (!gameRoom) {
      client.emit("roomNotFound", roomId);
      return;
    }

    client.join(roomId);
    this.playerRooms.set(client.id, roomId);

    this.gameService.addPlayerToRoom(roomId, client.id, playerName);
    // this.server.to(roomId).emit("playerJoined", client.id);
    this.server.to(roomId).emit("gameState", gameRoom.gameState);
  }

  @SubscribeMessage("startGame")
  handleStartGame(client: any, roomId: string) {
    const gameRoom = this.gameService.getGameRoom(roomId);

    if (!gameRoom) {
      client.emit("roomNotFound", roomId);
      return;
    }

    if (gameRoom.gameState.isGameStarted) {
      client.emit("gameAlreadyStarted", roomId);
      return;
    }

    if (gameRoom.ownerId !== client.id) {
      client.emit("notRoomOwner", roomId);
      return;
    }

    this.gameService.startGame(roomId);
    this.server.to(roomId).emit("gameStarted", roomId);

    this.startBroadcastingGameState(roomId);
  }

  @SubscribeMessage("move")
  handleMove(client: any, data: { direction: { x: number; y: number } }) {
    const roomId = this.playerRooms.get(client.id);
    if (!roomId) {
      client.emit("notInRoom");
      return;
    }

    const gameRoom = this.gameService.getGameRoom(roomId);
    if (!gameRoom) {
      client.emit("roomNotFound", roomId);
      return;
    }

    const player = gameRoom.gameState.players[client.id];
    if (!player) {
      client.emit("playerNotFound", client.id);
      return;
    }

    this.gameService.changePlayerDirection(roomId, client.id, data.direction);
  }

  private startBroadcastingGameState(gameId: string) {
    const interval = setInterval(() => {
      const gameRoom = this.gameService.getGameRoom(gameId);

      if (!gameRoom) {
        clearInterval(interval);
        return;
      }

      this.server.to(gameId).emit("gameState", gameRoom.gameState);
    }, 2000); // Send updates
  }
}

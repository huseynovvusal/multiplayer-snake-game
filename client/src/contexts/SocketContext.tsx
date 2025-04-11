import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import { Socket, io } from "socket.io-client"
import { GameRoom, GameState } from "../types"

interface SocketContextProps {
  socket: Socket | null
  isConnected: boolean
  gameRoom: GameRoom | null
  gameState: GameState | null
  joinRoom: (roomId: string, playerName: string) => void
  startGame: () => void
  createRoom: (playerName: string) => void
  handleMove: (direction: { x: number; y: number }) => void
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
  gameRoom: null,
  gameState: null,
  joinRoom: () => {},
  startGame: () => {},
  createRoom: () => {},
  handleMove: () => {},
})

export const useSocket = () => useContext(SocketContext)

interface SocketProviderProps {
  children: ReactNode
}

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [gameRoom, setGameRoom] = useState<GameRoom | null>(null)
  const [gameState, setGameState] = useState<GameState | null>(null)

  useEffect(() => {
    // Connect to the server
    const socketInstance = io("http://localhost:3000")

    socketInstance.on("connect", () => {
      setIsConnected(true)
    })

    socketInstance.on("disconnect", () => {
      setIsConnected(false)
    })

    socketInstance.on("roomCreated", (room: GameRoom) => {
      console.log("Game room data received:", room.id)
      setGameState(room.gameState)
      setGameRoom(room)
    })

    // Add this listener to handle joining an existing room
    socketInstance.on("joinedRoom", (room: GameRoom) => {
      console.log("Joined room:", room.id)
      setGameState(room.gameState)
      setGameRoom(room)
    })

    socketInstance.on("gameState", (gameState: GameState) => {
      setGameState(gameState)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const createRoom = (playerName: string) => {
    console.log("Creating room...", playerName)
    if (socket) {
      socket.emit("createRoom", { playerName })
    }
  }

  const joinRoom = (roomId: string, playerName: string) => {
    if (socket) {
      socket.emit("joinRoom", { roomId, playerName })
    }
  }

  const startGame = () => {
    if (socket && gameRoom) {
      socket.emit("startGame", gameRoom.id)
    }
  }

  const handleMove = (direction: { x: number; y: number }) => {
    if (socket && gameRoom) {
      socket.emit("move", { roomId: gameRoom.id, direction })
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        createRoom,
        gameRoom,
        gameState,
        joinRoom,
        startGame,
        handleMove,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

import { createContext, ReactNode, useContext, useEffect, useState } from "react"
import { Socket, io } from "socket.io-client"
import { GameRoom, GameState } from "../types"

interface SocketContextProps {
  socket: Socket | null
  isConnected: boolean
  createRoom: () => void
  gameRoom: GameRoom | null
  gameState: GameState | null
  joinRoom: (roomId: string, playerName: string) => void
  startGame: () => void
}

const SocketContext = createContext<SocketContextProps>({
  socket: null,
  isConnected: false,
  createRoom: () => {},
  gameRoom: null,
  gameState: null,
  joinRoom: () => {},
  startGame: () => {},
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

    socketInstance.on("gameState", (gameState: GameState) => {
      setGameState(gameState)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const createRoom = () => {
    console.log("Creating room...")
    if (socket) {
      socket.emit("createRoom")
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

  return (
    <SocketContext.Provider
      value={{ socket, isConnected, createRoom, gameRoom, gameState, joinRoom, startGame }}
    >
      {children}
    </SocketContext.Provider>
  )
}

import { useEffect, useState } from "react"
import { SocketProvider, useSocket } from "./context/SocketContext"
import { RoomManager } from "./components/RoomManager"
import { GameRoom } from "./components/GameRoom"

function AppContent() {
  const { socket } = useSocket()
  const [gameId, setGameId] = useState<string | null>(null)
  const [joinError, setJoinError] = useState<string | null>(null)

  const handleCreateGame = () => {
    if (!socket) return

    console.log("Sending createGame event")
    socket.emit("createGame", {}, (response: any) => {
      console.log("Received createGame response:", response)
      if (response.error) {
        setJoinError(response.error)
      } else {
        setGameId(response.gameId)
        console.log("Created game with ID:", response.gameId)
        console.log("Initial snake:", response.snake)
      }
    })
  }

  const handleJoinGame = (id: string) => {
    if (!socket) return

    console.log(`Sending joinGame event for game: ${id}`)
    socket.emit("joinGame", { gameId: id }, (response: any) => {
      console.log("Received joinGame response:", response)
      if (response.error) {
        setJoinError(response.error)
        console.error("Failed to join game:", response.error)
      } else {
        setGameId(id)
        console.log("Joined game with ID:", id)
        console.log("Game state:", response.gameState)
        console.log("Player snake:", response.snake)
      }
    })
  }

  const handleLeaveGame = () => {
    setGameId(null)
  }

  // Debug log connection state changes
  useEffect(() => {
    if (!socket) return

    const onConnect = () => {
      console.log("Connected to server with socket ID:", socket.id)
    }

    const onDisconnect = () => {
      console.log("Disconnected from server")
      setJoinError("Lost connection to server")
    }

    socket.on("connect", onConnect)
    socket.on("disconnect", onDisconnect)
    socket.on("connect_error", (err) => {
      console.error("Connection error:", err.message)
      setJoinError(`Connection error: ${err.message}`)
    })

    return () => {
      socket.off("connect", onConnect)
      socket.off("disconnect", onDisconnect)
      socket.off("connect_error")
    }
  }, [socket])

  return (
    <div className="min-h-screen bg-gray-800 text-white flex items-center justify-center p-4">
      {joinError && !gameId && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-900/80 px-4 py-2 rounded-md">
          <p className="text-white">{joinError}</p>
        </div>
      )}

      {gameId ? (
        <GameRoom gameId={gameId} onLeaveGame={handleLeaveGame} />
      ) : (
        <RoomManager onCreateGame={handleCreateGame} onJoinGame={handleJoinGame} />
      )}
    </div>
  )
}

function App() {
  return (
    <SocketProvider>
      <AppContent />
    </SocketProvider>
  )
}

export default App

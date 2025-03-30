import { useEffect, useState } from "react"
import { useSocket } from "../context/SocketContext"
import { GameBoard } from "./GameBoard"
import { Leaderboard } from "./Leaderboard"
import { GameState, Direction, Snake } from "../types/game.types"

interface GameRoomProps {
  gameId: string
  onLeaveGame: () => void
}

export const GameRoom = ({ gameId, onLeaveGame }: GameRoomProps) => {
  const { socket } = useSocket()
  const [gameState, setGameState] = useState<GameState | null>(null)
  const [playerId, setPlayerId] = useState<string | null>(null)
  const [playerSnake, setPlayerSnake] = useState<Snake | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notification, setNotification] = useState<string | null>(null)
  const [debugState, setDebugState] = useState<string | null>(null)

  // Initialize game state and socket listeners
  useEffect(() => {
    if (!socket) return

    // Set player ID from socket
    setPlayerId(socket.id)

    console.log("Setting up game listeners for game:", gameId)

    // Initialize game state for current player
    const initializeGame = () => {
      // Try to join the existing game
      socket.emit("joinGame", { gameId }, (response: any) => {
        if (response.error) {
          console.error("Error joining game:", response.error)
          setError(response.error)
        } else {
          console.log("Successfully joined game, initial state:", response)
          setGameState(response.gameState)
          setPlayerSnake(response.snake)
        }
      })
    }

    // Initialize game when socket is connected
    if (socket.connected) {
      initializeGame()
    } else {
      socket.once("connect", initializeGame)
    }

    // Listen for game state updates
    socket.on("gameState", (state: GameState) => {
      console.log("Received game state update:", state)
      setDebugState(
        JSON.stringify({
          snakeCount: Object.keys(state.snakes).length,
          foodCount: state.food.length,
          timestamp: new Date().toISOString(),
        })
      )
      setGameState(state)
    })

    // Listen for errors
    socket.on("error", (err: string) => {
      console.error("Game error:", err)
      setError(err)
    })

    // Listen for player joined events
    socket.on("playerJoined", ({ playerId: joinedPlayerId, snake }) => {
      console.log("Player joined:", joinedPlayerId, snake)
      setNotification(`Player ${joinedPlayerId.slice(0, 4)} joined the game!`)

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null)
      }, 3000)
    })

    // Listen for player left events
    socket.on("playerLeft", ({ playerId: leftPlayerId }) => {
      console.log("Player left:", leftPlayerId)
      setNotification(`Player ${leftPlayerId.slice(0, 4)} left the game!`)

      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null)
      }, 3000)
    })

    return () => {
      console.log("Cleaning up game listeners")
      socket.off("gameState")
      socket.off("error")
      socket.off("playerJoined")
      socket.off("playerLeft")
      socket.off("connect", initializeGame)
    }
  }, [socket, gameId])

  const handleDirectionChange = (direction: Direction) => {
    if (!socket) return
    console.log("Sending direction change:", direction)
    socket.emit("changeDirection", { direction })
  }

  const copyGameIdToClipboard = () => {
    navigator.clipboard.writeText(gameId)
    setNotification("Game ID copied to clipboard!")
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Snake Game</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-gray-400 text-sm">Game ID: {gameId}</span>
            <button
              onClick={copyGameIdToClipboard}
              className="text-gray-400 hover:text-white text-sm"
              title="Copy Game ID"
            >
              📋
            </button>
          </div>
          {playerId && (
            <div className="text-gray-400 text-sm mt-1">Your ID: {playerId.slice(0, 8)}</div>
          )}
        </div>
        <button onClick={onLeaveGame} className="retro-button">
          Leave Game
        </button>
      </div>

      {notification && (
        <div className="bg-green-900/50 rounded p-3 mb-6 text-center">
          <p className="text-green-200">{notification}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 rounded p-3 mb-6 text-center">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <GameBoard
            gameState={gameState}
            playerId={playerId}
            onDirectionChange={handleDirectionChange}
          />

          {debugState && (
            <div className="mt-2 p-2 bg-black/50 text-xs text-gray-400 rounded">
              <div>Debug: {debugState}</div>
              <div className="mt-1">
                {gameState && (
                  <>
                    <span>Snakes: {Object.keys(gameState.snakes).length}</span>
                    {Object.entries(gameState.snakes).map(([id, snake]) => (
                      <span key={id} className="ml-2" style={{ color: snake.color }}>
                        {id.slice(0, 4)}({snake.positions.length})
                      </span>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="lg:col-span-1">
          <Leaderboard gameState={gameState} playerId={playerId} />
        </div>
      </div>

      {gameState && Object.keys(gameState.snakes).length > 0 && (
        <div className="mt-4 text-center text-sm text-gray-400">
          <p>Active players: {Object.keys(gameState.snakes).length}</p>
        </div>
      )}
    </div>
  )
}

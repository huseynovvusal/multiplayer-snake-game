import { useState } from "react"
import { useSocket } from "../context/SocketContext"

interface RoomManagerProps {
  onJoinGame: (gameId: string) => void
  onCreateGame: () => void
}

export const RoomManager = ({ onJoinGame, onCreateGame }: RoomManagerProps) => {
  const { isConnected } = useSocket()
  const [gameId, setGameId] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleJoinGame = () => {
    if (!gameId.trim()) {
      setError("Please enter a game ID")
      return
    }

    setError(null)
    onJoinGame(gameId)
  }

  return (
    <div className="bg-gray-900 rounded-lg border-4 border-gray-700 p-8 max-w-md w-full mx-auto">
      <h1 className="text-3xl text-center mb-8 font-bold text-white">Snake Game</h1>

      <div className="space-y-6">
        {!isConnected && (
          <div className="bg-red-900/50 rounded p-3 text-center">
            <p className="text-red-200">Connecting to server...</p>
          </div>
        )}

        <div>
          <h2 className="text-xl mb-4 text-center font-bold text-white">Create New Game</h2>
          <button onClick={onCreateGame} disabled={!isConnected} className="retro-button w-full">
            Create Game
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div className="h-0.5 w-full bg-gray-700"></div>
          </div>
          <div className="flex justify-center">
            <span className="bg-gray-900 px-4 text-gray-400 relative">OR</span>
          </div>
        </div>

        <div>
          <h2 className="text-xl mb-4 text-center font-bold text-white">Join Existing Game</h2>

          {error && (
            <div className="bg-red-900/50 rounded p-2 mb-4 text-center">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter Game ID"
              className="retro-input flex-1"
              disabled={!isConnected}
            />
            <button onClick={handleJoinGame} disabled={!isConnected} className="retro-button">
              Join
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-400 text-sm">Use arrow keys to control your snake</p>
      </div>
    </div>
  )
}

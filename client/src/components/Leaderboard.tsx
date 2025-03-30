import { useMemo } from "react"
import { GameState } from "../types/game.types"

interface LeaderboardProps {
  gameState: GameState | null
  playerId: string | null
}

export const Leaderboard = ({ gameState, playerId }: LeaderboardProps) => {
  // Calculate scores based on snake length
  const players = useMemo(() => {
    if (!gameState) return []

    return Object.entries(gameState.snakes)
      .map(([id, snake]) => ({
        id,
        score: snake.positions.length,
        color: snake.color,
        isCurrentPlayer: id === playerId,
      }))
      .sort((a, b) => b.score - a.score)
  }, [gameState, playerId])

  return (
    <div className="bg-gray-900 rounded-lg border-4 border-gray-700 p-4 w-full">
      <h2 className="text-xl text-center mb-4 font-bold text-white">Leaderboard</h2>

      {players.length === 0 ? (
        <p className="text-center text-gray-400">No players yet</p>
      ) : (
        <div className="space-y-2">
          {players.map((player, index) => (
            <div
              key={player.id}
              className={`flex justify-between items-center p-2 rounded ${
                player.isCurrentPlayer ? "bg-gray-700" : "bg-gray-800"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-gray-400">{index + 1}.</span>
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: player.color }} />
                <span className="text-white">
                  {player.isCurrentPlayer ? "You" : `Player ${player.id.slice(0, 4)}`}
                </span>
              </div>
              <span className="font-bold text-white">{player.score}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

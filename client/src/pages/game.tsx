import React, { useEffect, useRef } from "react"
import { useSocket } from "../contexts/SocketContext"

const GRID_SIZE = 50

export default function Game() {
  const { isConnected, gameState, gameRoom, socket } = useSocket()

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // !
  console.log("gameState", gameState)

  const update = React.useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext("2d")

    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width
    canvas.height = rect.height

    ctx.fillStyle = "black"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const cellSize = Math.floor(Math.min(canvas.width, canvas.height) / GRID_SIZE)
    ctx.strokeStyle = "#233053"
    ctx.lineWidth = 0.75 // Set the stroke size

    for (let x = 0; x < GRID_SIZE; x++) {
      for (let y = 0; y < GRID_SIZE; y++) {
        const isEven = (x + y) % 2 === 0
        ctx.fillStyle = isEven ? "#2E3B5C" : "#3A456B"
        ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize)
      }
    }

    if (gameState && gameState.players) {
      Object.values(gameState.players).forEach((player) => {
        ctx.fillStyle = player.color
        player.snake.forEach((segment) => {
          ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize)
          ctx.strokeStyle = "#233053"
          const padding = cellSize * 0
          ctx.strokeRect(
            segment.x * cellSize + padding,
            segment.y * cellSize + padding,
            cellSize - padding * 2,
            cellSize - padding * 2
          )
        })
      })
    }
  }, [gameState])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      //TODO: Handle key events for player movement
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [update])

  if (!isConnected) return <div className="text-white">Connecting...</div>

  return (
    <div className="flex items-center gap-10 flex-wrap h-full justify-center bg-[#1E213F]">
      <h2>ID: {gameRoom?.id || gameState?.id}</h2>

      {gameState?.isGameStarted && (
        <canvas className="w-[500px] aspect-square" ref={canvasRef}></canvas>
      )}

      {!gameState?.isGameStarted && (
        <div className="flex flex-col justify-center p-6 gap-2  rounded-lg bg-[#2E3B5C]">
          <h1 className="text-white font-bold text-lg">Waiting for game to start...</h1>
          {socket?.id === gameRoom?.ownerId && (
            <button
              disabled={Object.keys(!gameState?.players).length <= 1}
              className="bg-[#3A456B] text-white font-bold py-2 px-4 rounded"
              onClick={() => {
                // socket.emit("startGame", gameRoom?.id)
              }}
            >
              Start Game
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col justify-center p-6 gap-2  rounded-lg">
        {gameState &&
          Object.keys(gameState?.players).map((playerId) => (
            <div key={playerId} className="flex items-center gap-2">
              <div
                className="w-6 aspect-square rounded-sm"
                style={{ backgroundColor: gameState.players[playerId].color }}
              ></div>
              <span className="text-white font-bold text-lg">
                {gameState.players[playerId].name}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}

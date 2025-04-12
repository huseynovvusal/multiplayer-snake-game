import React, { useEffect, useRef } from "react"
import { useSocket } from "../contexts/SocketContext"

const GRID_SIZE = 50

export default function Game() {
  const { isConnected, gameState, gameRoom, startGame, socket, handleMove } = useSocket()

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

    if (gameState) {
      // Draw food
      gameState.food.forEach((food) => {
        ctx.fillStyle = "red"
        ctx.fillRect(food.x * cellSize, food.y * cellSize, cellSize, cellSize)
      })

      // Draw players
      if (gameState.players) {
        Object.values(gameState.players).forEach((player) => {
          ctx.globalAlpha = player.isEliminated ? 0.2 : 1
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
    }
  }, [gameState])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameState?.isGameStarted) return

      let direction = { x: 0, y: 0 }

      switch (event.key) {
        case "ArrowUp":
          direction = { x: 0, y: -1 }
          break
        case "ArrowDown":
          direction = { x: 0, y: 1 }
          break
        case "ArrowLeft":
          direction = { x: -1, y: 0 }
          break
        case "ArrowRight":
          direction = { x: 1, y: 0 }
          break
        default:
          return
      }

      handleMove(direction)
      event.preventDefault() // Prevent default scrolling behavior
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [update, gameState, handleMove])

  useEffect(() => {
    console.log("DEYISDI")
    update()
  }, [update])

  if (!isConnected) return <div className="text-white">Connecting...</div>

  return (
    <div className="flex items-center gap-10 flex-wrap h-full justify-center bg-[#1E213F]">
      {(gameState?.isGameStarted || gameState?.isGameOver) && (
        <canvas className="w-[500px] aspect-square" ref={canvasRef}></canvas>
      )}

      <div className="font-mono text-white text-lg flex flex-col gap-2 p-6 rounded-lg bg-[#2E3B5C] border border-gray-700 ">
        <div className="flex items-center gap-2">
          <span className="select-none">Room Owner:</span>
          <span
            className="font-bold"
            style={{ color: gameRoom?.gameState.players[gameRoom?.ownerId].color }}
          >
            {gameRoom?.gameState.players[gameRoom?.ownerId].name || ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="select-none">Room ID:</span>
          <span className="text-yellow-300">{gameRoom?.id}</span>
        </div>

        {!gameState?.isGameStarted && (
          <div className="flex gap-2 flex-col">
            <span className="font-mono font-normal text-blue-200 text-md">
              Waiting for game to start...
            </span>

            {socket?.id === gameRoom?.ownerId && (
              <button
                disabled={
                  gameState?.players && Object.keys(gameState?.players).length <= 1 && false
                }
                className="bg-[#3A456B] text-white font-bold py-2 px-4 rounded"
                onClick={() => {
                  startGame()
                }}
              >
                Start Game
              </button>
            )}
          </div>
        )}
      </div>

      <div>
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
    </div>
  )
}

import { useEffect, useRef, useState } from "react"
import { GameState, Direction } from "../types/game.types"

interface GameBoardProps {
  gameState: GameState | null
  playerId: string | null
  onDirectionChange: (direction: Direction) => void
}

export const GameBoard = ({ gameState, playerId, onDirectionChange }: GameBoardProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [debug, setDebug] = useState<string | null>(null)

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!playerId) return

      switch (e.key) {
        case "ArrowUp":
          onDirectionChange("UP")
          break
        case "ArrowDown":
          onDirectionChange("DOWN")
          break
        case "ArrowLeft":
          onDirectionChange("LEFT")
          break
        case "ArrowRight":
          onDirectionChange("RIGHT")
          break
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  }, [playerId, onDirectionChange])

  // For debugging - log gameState changes
  useEffect(() => {
    if (!gameState) return

    const snakeCount = Object.keys(gameState.snakes).length
    const foodCount = gameState.food.length

    console.log("GameBoard: Game state updated", gameState)
    console.log(`GameBoard: Snakes: ${snakeCount}, Food: ${foodCount}`)

    if (snakeCount === 0) {
      console.warn("GameBoard: No snakes in game state")
    } else {
      console.log(
        "GameBoard: Snake data:",
        Object.entries(gameState.snakes).map(([id, snake]) => ({
          id: id.slice(0, 4),
          length: snake.positions.length,
          position: snake.positions[0],
          color: snake.color,
        }))
      )
    }

    // Show some debug info
    if (snakeCount > 0) {
      const snakeInfo = Object.entries(gameState.snakes)
        .map(([id, snake]) => {
          const isCurrentPlayer = id === playerId
          return `${isCurrentPlayer ? "You" : "Player " + id.slice(0, 4)}: ${
            snake.positions.length
          } segments, pos: (${snake.positions[0].x},${snake.positions[0].y}), color: ${snake.color}`
        })
        .join(", ")
      setDebug(`${snakeInfo}`)
    } else {
      setDebug("No snakes in game")
    }
  }, [gameState, playerId])

  // Draw game state on canvas
  useEffect(() => {
    if (!gameState || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Force higher resolution for canvas for sharper rendering
    const devicePixelRatio = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * devicePixelRatio
    canvas.height = rect.height * devicePixelRatio

    ctx.scale(devicePixelRatio, devicePixelRatio)
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`

    const { width, height } = gameState.gridSize
    const cellSize = Math.min(Math.floor(rect.width / width), Math.floor(rect.height / height))

    // Clear canvas
    ctx.fillStyle = "#111"
    ctx.fillRect(0, 0, rect.width, rect.height)

    // Draw grid lines for retro feel
    ctx.strokeStyle = "#222"
    ctx.lineWidth = 1

    for (let x = 0; x <= width; x++) {
      ctx.beginPath()
      ctx.moveTo(x * cellSize, 0)
      ctx.lineTo(x * cellSize, height * cellSize)
      ctx.stroke()
    }

    for (let y = 0; y <= height; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * cellSize)
      ctx.lineTo(width * cellSize, y * cellSize)
      ctx.stroke()
    }

    // Draw food
    gameState.food.forEach((food) => {
      ctx.fillStyle = "#ff0000"
      ctx.beginPath()
      ctx.arc(
        food.x * cellSize + cellSize / 2,
        food.y * cellSize + cellSize / 2,
        cellSize / 2 - 2,
        0,
        Math.PI * 2
      )
      ctx.fill()
    })

    // Draw snakes with brighter colors
    const snakes = Object.entries(gameState.snakes)

    if (snakes.length === 0) {
      // Draw a message when no snakes
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)"
      ctx.font = "16px monospace"
      ctx.textAlign = "center"
      ctx.fillText("Waiting for snakes...", rect.width / 2, rect.height / 2)
    } else {
      snakes.forEach(([id, snake]) => {
        const isCurrentPlayer = id === playerId

        // Make color brighter for better visibility
        let color = snake.color
        if (!color.startsWith("#")) {
          // Generate a random bright color if none provided
          const hue = Math.floor(Math.random() * 360)
          color = `hsl(${hue}, 80%, 60%)`
        }

        // Use brighter color for current player's snake
        ctx.fillStyle = isCurrentPlayer ? "#00ff00" : color

        // Draw each segment
        snake.positions.forEach((pos, index) => {
          // Draw body segments as rounded rects for retro feel
          const margin = 1
          const radius = 2

          // Simple drawing for small cell sizes
          if (cellSize < 10) {
            ctx.fillRect(
              pos.x * cellSize + margin,
              pos.y * cellSize + margin,
              cellSize - margin * 2,
              cellSize - margin * 2
            )
            return
          }

          // Draw segment with rounded corners for larger cells
          ctx.beginPath()
          ctx.roundRect(
            pos.x * cellSize + margin,
            pos.y * cellSize + margin,
            cellSize - margin * 2,
            cellSize - margin * 2,
            radius
          )
          ctx.fill()

          // Draw eyes on head
          if (index === 0) {
            ctx.fillStyle = "#fff"

            // Different eye positions based on direction
            let eyePositions = [
              { x: 0.25, y: 0.25 }, // left eye
              { x: 0.65, y: 0.25 }, // right eye
            ]

            // Adjust eye position based on snake direction
            switch (snake.direction) {
              case "DOWN":
                eyePositions = [
                  { x: 0.25, y: 0.65 },
                  { x: 0.65, y: 0.65 },
                ]
                break
              case "LEFT":
                eyePositions = [
                  { x: 0.25, y: 0.25 },
                  { x: 0.25, y: 0.65 },
                ]
                break
              case "RIGHT":
                eyePositions = [
                  { x: 0.65, y: 0.25 },
                  { x: 0.65, y: 0.65 },
                ]
                break
            }

            // Draw eyes
            eyePositions.forEach((eyePos) => {
              ctx.beginPath()
              ctx.arc(
                pos.x * cellSize + cellSize * eyePos.x,
                pos.y * cellSize + cellSize * eyePos.y,
                cellSize * 0.1,
                0,
                Math.PI * 2
              )
              ctx.fill()
            })

            // Add border around current player's snake head
            if (isCurrentPlayer) {
              ctx.strokeStyle = "#fff"
              ctx.lineWidth = 2
              ctx.strokeRect(
                pos.x * cellSize + margin / 2,
                pos.y * cellSize + margin / 2,
                cellSize - margin,
                cellSize - margin
              )
            }

            // Reset fill style for next segment
            ctx.fillStyle = isCurrentPlayer ? "#00ff00" : color
          }
        })
      })
    }
  }, [gameState, playerId])

  if (!gameState) {
    return (
      <div className="flex items-center justify-center bg-gray-900 w-full h-72 rounded-lg border-4 border-gray-700">
        <div className="animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="w-full h-[500px] relative bg-gray-900 rounded-lg border-4 border-gray-700 overflow-hidden">
      <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />

      {debug && (
        <div className="absolute top-2 left-2 bg-black/70 p-2 rounded text-xs text-white max-w-[80%] z-10">
          {debug}
        </div>
      )}

      {/* Game info */}
      <div className="absolute top-2 right-2 bg-black/70 p-2 rounded text-xs text-white z-10">
        {gameState.food.length > 0 && <div>Food: {gameState.food.length}</div>}
        <div>Players: {Object.keys(gameState.snakes).length}</div>
        <div className="text-green-300">Use arrow keys to move</div>
      </div>

      {/* Arrow key controls */}
      <div className="absolute bottom-4 right-4 flex flex-col items-center gap-2 opacity-70 z-10">
        <button
          onClick={() => onDirectionChange("UP")}
          className="w-12 h-12 bg-gray-800/80 flex items-center justify-center rounded-md"
        >
          ⬆️
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => onDirectionChange("LEFT")}
            className="w-12 h-12 bg-gray-800/80 flex items-center justify-center rounded-md"
          >
            ⬅️
          </button>
          <button
            onClick={() => onDirectionChange("DOWN")}
            className="w-12 h-12 bg-gray-800/80 flex items-center justify-center rounded-md"
          >
            ⬇️
          </button>
          <button
            onClick={() => onDirectionChange("RIGHT")}
            className="w-12 h-12 bg-gray-800/80 flex items-center justify-center rounded-md"
          >
            ➡️
          </button>
        </div>
      </div>
    </div>
  )
}

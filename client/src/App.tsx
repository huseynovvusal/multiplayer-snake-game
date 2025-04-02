import React, { useEffect, useRef, useState } from "react"

const GRID_SIZE = 50

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState({
    players: [
      {
        id: 1,
        name: "Player 1",
        color: "green",
        direction: { x: 1, y: 0 },
        snake: [
          { x: 10, y: 10 },
          { x: 10, y: 11 },
          { x: 10, y: 12 },
          { x: 10, y: 13 },
        ],
      },
      {
        id: 2,
        name: "Player 2",
        color: "orange",
        direction: { x: 1, y: 0 },
        snake: [
          { x: 20, y: 15 },
          { x: 21, y: 15 },
          { x: 22, y: 15 },
          { x: 23, y: 15 },
          { x: 24, y: 15 },
          { x: 25, y: 15 },
          { x: 25, y: 16 },
        ],
      },
    ],
  })

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
    gameState.players.forEach((player) => {
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
  }, [gameState])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      setGameState((prevState) => ({
        ...prevState,
        players: prevState.players.map((player) =>
          player.id === 1
            ? {
                ...player,
                direction:
                  event.key === "ArrowUp"
                    ? { x: 0, y: -1 }
                    : event.key === "ArrowDown"
                    ? { x: 0, y: 1 }
                    : event.key === "ArrowLeft"
                    ? { x: -1, y: 0 }
                    : event.key === "ArrowRight"
                    ? { x: 1, y: 0 }
                    : player.direction,
              }
            : player
        ),
      }))
    }

    window.addEventListener("keydown", handleKeyDown)

    const interval = setInterval(() => {
      setGameState((prevState) => ({
        ...prevState,
        players: prevState.players.map((player) =>
          player.id === 1
            ? {
                ...player,
                snake: player.snake.map((segment, index) => {
                  if (index === 0) {
                    return {
                      x: segment.x + (player.direction?.x || 0),
                      y: segment.y + (player.direction?.y || 0),
                    } // Move the head in the current direction
                  }
                  return player.snake[index - 1] // Move the rest of the body
                }),
              }
            : player
        ),
      }))
      update()
    }, 100)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      clearInterval(interval)
    }
  }, [update])

  return (
    <div className="flex items-start gap-10">
      <canvas className="h-[700px] aspect-square" ref={canvasRef}></canvas>
      <div className="flex flex-col justify-center p-6">
        {gameState.players.map((player) => (
          <div key={player.id} className="flex items-center mr-4">
            <div className="w-4 h-4 mr-2" style={{ backgroundColor: player.color }}></div>
            <span>{player.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

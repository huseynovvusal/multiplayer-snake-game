import React, { useEffect, useRef, useState } from "react"

const GRID_SIZE = 50

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState({
    players: [
      {
        id: 1,
        name: "Player 1",
        color: "red",
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

    gameState.players.forEach((player) => {
      ctx.fillStyle = player.color
      player.snake.forEach((segment) => {
        ctx.fillRect(segment.x * cellSize, segment.y * cellSize, cellSize, cellSize)
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
    <div className="h-[700px] aspect-square mx-auto">
      <canvas className="w-full h-full" ref={canvasRef}></canvas>
    </div>
  )
}

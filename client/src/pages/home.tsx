import { useNavigate } from "react-router"
import { useSocket } from "../contexts/SocketContext"
import { useState } from "react"

export default function Home() {
  const { createRoom, joinRoom } = useSocket()

  const navigate = useNavigate()

  const [roomId, setRoomId] = useState("")
  const [playerName, setPlayerName] = useState("")

  return (
    <div>
      <h1>Welcome to the Snake Game</h1>
      <p>Join a room or create a new one to start playing!</p>
      {/* Add your game room creation and joining logic here */}
      <button
        type="button"
        onClick={() => {
          console.log("PLYASJHASFSHAS:", playerName)
          createRoom(playerName)
          navigate("/game")
        }}
      >
        Create Room
      </button>

      <input
        type="text"
        placeholder="Enter room ID"
        id="roomId"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <input
        type="text"
        placeholder="Enter your name"
        id="playerName"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
      />

      <button
        onClick={() => {
          joinRoom(roomId, playerName)
          navigate("/game")
        }}
      >
        Join Room
      </button>
      {/* Display the game room information here */}
    </div>
  )
}

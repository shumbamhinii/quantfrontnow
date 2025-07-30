import { useEffect, useRef, useState } from 'react'
import { Button } from 'antd'
import { useNavigate } from 'react-router-dom'

export default function NotFoundPage () {
  const navigate = useNavigate()
  const [score, setScore] = useState(0)
  const [dotPosition, setDotPosition] = useState({ x: 100, y: 100 })
  const gameAreaRef = useRef<HTMLDivElement | null>(null)

  const moveDot = () => {
    const gameArea = gameAreaRef.current
    if (gameArea) {
      const maxX = gameArea.clientWidth - 30
      const maxY = gameArea.clientHeight - 30
      const x = Math.floor(Math.random() * maxX)
      const y = Math.floor(Math.random() * maxY)
      setDotPosition({ x, y })
    }
  }

  const handleClick = () => {
    setScore(score + 1)
    moveDot()
  }

  useEffect(() => {
    moveDot()
  }, [])

  return (
    <div className='flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200'>
      <h1 className='text-5xl font-bold text-gray-800 mb-2'>
        404 - Page Not Found
      </h1>
      <p className='text-lg text-gray-600 mb-6'>
        But hey! Try hitting the dot below 👇
      </p>
      <div
        ref={gameAreaRef}
        className='relative w-[300px] h-[300px] bg-white border-2 border-dashed border-gray-400 rounded-lg'
      >
        <div
          onClick={handleClick}
          className='absolute w-6 h-6 bg-pink-500 rounded-full cursor-pointer'
          style={{ top: dotPosition.y, left: dotPosition.x }}
        />
      </div>
      <p className='mt-4 text-gray-700'>
        Your score: <strong>{score}</strong>
      </p>
      <Button onClick={() => navigate('/')} className='mt-6'>
        Go Home
      </Button>
    </div>
  )
}

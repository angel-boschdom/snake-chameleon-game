/* src/App.js */
import React, { useState, useEffect, useRef } from 'react';
import Timer from './components/Timer';
import Counters from './components/Counters';
import GameOutcome from './components/GameOutcome';
import GameCanvas from './components/GameCanvas';
import './index.css';

function App() {
  const [timeLeft, setTimeLeft] = useState(60);
  const [snakeApplesEaten, setSnakeApplesEaten] = useState(0);
  const [chameleonApplesEaten, setChameleonApplesEaten] = useState(0);
  const [gameOutcome, setGameOutcome] = useState('');
  const [gameOver, setGameOver] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    // Timer countdown
    if (timeLeft > 0 && !gameOver) {
      timerRef.current = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      setGameOutcome("Time's up! The snake loses!");
      setGameOver(true);
    }
    return () => clearTimeout(timerRef.current);
  }, [timeLeft, gameOver]);

  const handleGameOutcome = (message) => {
    setGameOutcome(message);
    setGameOver(true);
    clearTimeout(timerRef.current);
  };

  const handleRestart = () => {
    setTimeLeft(60);
    setSnakeApplesEaten(0);
    setChameleonApplesEaten(0);
    setGameOutcome('');
    setGameOver(false);
  };

  return (
    <div id="gameContainer">
      <Timer timeLeft={timeLeft} />
      <GameCanvas
        timeLeft={timeLeft}
        snakeApplesEaten={snakeApplesEaten}
        setSnakeApplesEaten={setSnakeApplesEaten}
        chameleonApplesEaten={chameleonApplesEaten}
        setChameleonApplesEaten={setChameleonApplesEaten}
        handleGameOutcome={handleGameOutcome}
        gameOver={gameOver}
      />
      <Counters
        snakeApplesEaten={snakeApplesEaten}
        chameleonApplesEaten={chameleonApplesEaten}
      />
      {gameOver && <GameOutcome message={gameOutcome} onRestart={handleRestart} />}
    </div>
  );
}

export default App;

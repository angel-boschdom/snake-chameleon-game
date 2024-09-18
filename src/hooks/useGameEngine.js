// useGameEngine.js
import { useState, useRef, useEffect } from 'react';
import { initializeGameState, updateGameState } from '../game/GameEngine';

function useGameEngine({ isHost, dataChannel, handleGameOutcome, gameOver }) {
  const [gameState, setGameState] = useState(null);
  const gameStateRef = useRef(gameState);

  useEffect(() => {
    const initialGameState = initializeGameState(isHost);
    setGameState(initialGameState);
    gameStateRef.current = initialGameState;
  }, [isHost]);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!isHost || !dataChannel || !gameState || gameOver) return;

    let animationFrameId;

    const gameLoop = () => {
      const newState = updateGameState(
        gameStateRef.current,
        handleGameOutcome,
        dataChannel,
        isHost
      );
      gameStateRef.current = newState;
      setGameState(newState);

      // Send updated game state to guest
      if (dataChannel.readyState === 'open') {
        dataChannel.send(
          JSON.stringify({ type: 'gameStateUpdate', gameState: newState })
        );
      }

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isHost, dataChannel, gameState, gameOver]);

  return { gameState, gameStateRef };
}

export default useGameEngine;

import React, { useEffect, useRef } from 'react';
import InputManager from '../components/InputManager';
import useGameEngine from '../hooks/useGameEngine';
import useDataChannel from '../hooks/useDataChannel';
import { drawGameState } from '../game/drawGameState';
import { GRID_WIDTH, GRID_HEIGHT, ASPECT_RATIO } from '../game/constants';
import '../styles/GameCanvas.css';

function GameCanvas({ isHost, dataChannel, handleGameOutcome, gameOver }) {
  const canvasRef = useRef(null);

  const { gameState, gameStateRef } = useGameEngine({
    isHost,
    dataChannel,
    handleGameOutcome,
    gameOver,
  });

  useDataChannel({
    isHost,
    dataChannel,
    gameStateRef,
    handleGameOutcome,
    setGameState: () => {},
    drawGameState: (state) => drawGameState(canvasRef, state),
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const canvasWidth = canvas.parentElement.clientWidth;
      const canvasHeight = canvasWidth / ASPECT_RATIO;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }
  }, []);

  useEffect(() => {
    if (gameState) {
      drawGameState(canvasRef, gameState);
    }
  }, [gameState]);

  const handleMove = (direction) => {
    if (isHost) {
      if (direction) {
        gameStateRef.current.snakeDirection = direction;
      }
    } else {
      if (dataChannel.readyState === 'open') {
        dataChannel.send(
          JSON.stringify({ type: 'chameleonMove', direction })
        );
      }
    }
  };

  return (
    <div className="game-canvas-container">
      <canvas ref={canvasRef} className="game-canvas" />
      <InputManager onMove={handleMove} />
    </div>
  );
}

export default GameCanvas;

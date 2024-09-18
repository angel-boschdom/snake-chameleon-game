// drawGameState.js
import { GRID_WIDTH, GRID_HEIGHT } from './constants';

export const drawGameState = (canvasRef, state) => {
  const canvas = canvasRef.current;
  const ctx = canvas.getContext('2d');

  const cellWidth = canvas.width / GRID_WIDTH;
  const cellHeight = canvas.height / GRID_HEIGHT;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw apples
  ctx.fillStyle = '#f00';
  state.apples.forEach((apple) => {
    ctx.fillRect(
      apple.x * cellWidth,
      apple.y * cellHeight,
      cellWidth,
      cellHeight
    );
  });

  // Draw snake
  ctx.fillStyle = '#0f0';
  state.snake.forEach((segment) => {
    ctx.fillRect(
      segment.x * cellWidth,
      segment.y * cellHeight,
      cellWidth,
      cellHeight
    );
  });

  // Draw chameleon if visible
  if (state.chameleonVisible && state.chameleonImage.complete) {
    ctx.drawImage(
      state.chameleonImage,
      state.chameleon.x * cellWidth,
      state.chameleon.y * cellHeight,
      state.chameleon.width * cellWidth,
      state.chameleon.height * cellHeight
    );
  }
};

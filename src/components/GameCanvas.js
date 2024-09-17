/* src/components/GameCanvas.js */
import React, { useEffect, useRef, useState } from 'react';

function GameCanvas(props) {
  const {
    snakeApplesEaten,
    setSnakeApplesEaten,
    chameleonApplesEaten,
    setChameleonApplesEaten,
    handleGameOutcome,
    gameOver,
  } = props;

  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState(null);

  // Define constants
  const gridWidth = 20;
  const gridHeight = 30;

  useEffect(() => {
    if (gameState === null) {
      // Initialize game state only once
      setGameState({
        snakeSpeed: (1 / 80) * 10000,
        chameleonSpeed: (1 / 50) * 10000,
        lastSnakeMoveTime: 0,
        lastChameleonMoveTime: 0,
        snake: [
          {
            x: Math.floor(gridWidth / 2),
            y: Math.floor(gridHeight / 2),
          },
        ],
        snakeDirection: 'right',
        snakeAteApple: false,
        chameleon: {
          x: Math.floor(gridWidth / 4),
          y: Math.floor(gridHeight / 3),
          width: 2,
          height: 2,
        },
        chameleonDirection: null,
        chameleonVisible: false,
        chameleonVisibleUntil: 0,
        elapsedTicks: 0,
        visibilityTicks: [],
        apples: [],
        chameleonImage: new Image(),
      });
    }
  }, [gameState, gridWidth, gridHeight]);

  useEffect(() => {
    if (!gameState) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const cellWidth = canvas.width / gridWidth;
    const cellHeight = canvas.height / gridHeight;

    // Initialize the chameleon image
    gameState.chameleonImage.src = process.env.PUBLIC_URL + '/chameleon.png';

    // Generate apples and visibility times only once
    if (gameState.apples.length === 0) {
      generateApples();
    }
    if (gameState.visibilityTicks.length === 0) {
      generateVisibilityTimes();
    }

    let gameInterval;
    if (!gameOver) {
      gameInterval = setInterval(gameLoop, 20);
    }

    // Event listeners
    const handleKeyDown = (event) => {
      // Snake controls - WASD
      if (event.key === 'w' && gameState.snakeDirection !== 'down') {
        gameState.snakeDirection = 'up';
      } else if (event.key === 's' && gameState.snakeDirection !== 'up') {
        gameState.snakeDirection = 'down';
      } else if (event.key === 'a' && gameState.snakeDirection !== 'right') {
        gameState.snakeDirection = 'left';
      } else if (event.key === 'd' && gameState.snakeDirection !== 'left') {
        gameState.snakeDirection = 'right';
      }
      // Chameleon controls - arrow keys
      else if (event.key === 'ArrowUp') {
        gameState.chameleonDirection = 'up';
      } else if (event.key === 'ArrowDown') {
        gameState.chameleonDirection = 'down';
      } else if (event.key === 'ArrowLeft') {
        gameState.chameleonDirection = 'left';
      } else if (event.key === 'ArrowRight') {
        gameState.chameleonDirection = 'right';
      }
    };

    const handleKeyUp = (event) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
        gameState.chameleonDirection = null;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    function gameLoop() {
      if (!gameOver) {
        update();
        draw();
      } else {
        clearInterval(gameInterval);
      }
    }

    function update() {
      const currentTime = Date.now();
      gameState.snakeAteApple = false;

      // Move snake based on snakeSpeed
      if (currentTime - gameState.lastSnakeMoveTime >= gameState.snakeSpeed) {
        moveSnake();
        gameState.lastSnakeMoveTime = currentTime;
      }
      // Move chameleon based on chameleonSpeed
      if (currentTime - gameState.lastChameleonMoveTime >= gameState.chameleonSpeed) {
        moveChameleon();
        gameState.lastChameleonMoveTime = currentTime;
      }
      // Check for collision between snake and chameleon
      for (let i = 0; i < gameState.snake.length; i++) {
        const snakeSegment = {
          x: gameState.snake[i].x,
          y: gameState.snake[i].y,
          width: 1,
          height: 1,
        };
        if (rectOverlap(snakeSegment, gameState.chameleon)) {
          clearInterval(gameInterval);
          handleGameOutcome('Snake caught the chameleon! Snake wins!');
          return;
        }
      }
      // Chameleon visibility logic
      updateChameleonVisibility();
      // Increment elapsed ticks
      gameState.elapsedTicks++;
    }

    function moveSnake() {
      let headX = gameState.snake[0].x;
      let headY = gameState.snake[0].y;
      if (gameState.snakeDirection === 'left') headX--;
      else if (gameState.snakeDirection === 'right') headX++;
      else if (gameState.snakeDirection === 'up') headY--;
      else if (gameState.snakeDirection === 'down') headY++;

      // Wrap around the grid
      if (headX < 0) headX = gridWidth - 1;
      else if (headX >= gridWidth) headX = 0;
      if (headY < 0) headY = gridHeight - 1;
      else if (headY >= gridHeight) headY = 0;

      // Check for self-collision
      for (let i = 1; i < gameState.snake.length; i++) {
        if (gameState.snake[i].x === headX && gameState.snake[i].y === headY) {
          clearInterval(gameInterval);
          handleGameOutcome('Snake has eaten itself! Game over.');
          return;
        }
      }

      gameState.snake.unshift({ x: headX, y: headY });

      // Check if snake eats an apple
      for (let i = 0; i < gameState.apples.length; i++) {
        if (gameState.apples[i].x === headX && gameState.apples[i].y === headY) {
          setSnakeApplesEaten((prev) => prev + 1);
          gameState.apples.splice(i, 1);
          gameState.snakeAteApple = true;
          generateNewApple();
          break;
        }
      }

      if (!gameState.snakeAteApple) {
        gameState.snake.pop(); // Remove the last segment to keep the snake the same length
      }
    }

    function moveChameleon() {
      if (gameState.chameleonDirection !== null) {
        let chameleonX = gameState.chameleon.x;
        let chameleonY = gameState.chameleon.y;
        if (gameState.chameleonDirection === 'left') chameleonX--;
        else if (gameState.chameleonDirection === 'right') chameleonX++;
        else if (gameState.chameleonDirection === 'up') chameleonY--;
        else if (gameState.chameleonDirection === 'down') chameleonY++;

        // Ensure chameleon stays within bounds
        if (chameleonX < 0) chameleonX = 0;
        else if (chameleonX + gameState.chameleon.width > gridWidth) chameleonX = gridWidth - gameState.chameleon.width;
        if (chameleonY < 0) chameleonY = 0;
        else if (chameleonY + gameState.chameleon.height > gridHeight) chameleonY = gridHeight - gameState.chameleon.height;

        gameState.chameleon.x = chameleonX;
        gameState.chameleon.y = chameleonY;

        // Check if chameleon eats an apple
        for (let i = 0; i < gameState.apples.length; i++) {
          if (rectOverlap(gameState.chameleon, {
            x: gameState.apples[i].x,
            y: gameState.apples[i].y,
            width: 1,
            height: 1,
          })) {
            setChameleonApplesEaten((prev) => prev + 1);
            gameState.apples.splice(i, 1);
            gameState.chameleonVisibleUntil = gameState.elapsedTicks + 30; // extraVisibilityTicks
            generateNewApple();
            break;
          }
        }
      }
    }

    function draw() {
      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw apples
      ctx.fillStyle = 'red';
      for (let i = 0; i < gameState.apples.length; i++) {
        ctx.fillRect(
          gameState.apples[i].x * cellWidth,
          gameState.apples[i].y * cellHeight,
          cellWidth,
          cellHeight
        );
      }
      // Draw snake
      ctx.fillStyle = 'green';
      for (let i = 0; i < gameState.snake.length; i++) {
        ctx.fillRect(
          gameState.snake[i].x * cellWidth,
          gameState.snake[i].y * cellHeight,
          cellWidth,
          cellHeight
        );
      }
      // Draw chameleon if visible
      if (gameState.chameleonVisible) {
        ctx.drawImage(
          gameState.chameleonImage,
          gameState.chameleon.x * cellWidth,
          gameState.chameleon.y * cellHeight,
          gameState.chameleon.width * cellWidth,
          gameState.chameleon.height * cellHeight
        );
      }
    }

    function updateChameleonVisibility() {
      if (gameState.elapsedTicks < gameState.chameleonVisibleUntil) {
        gameState.chameleonVisible = true;
      } else if (gameState.visibilityTicks.includes(gameState.elapsedTicks)) {
        gameState.chameleonVisible = true;
      } else {
        gameState.chameleonVisible = false;
      }
    }

    function generateVisibilityTimes() {
      gameState.visibilityTicks = [];
      const visibilityDuration = 25; // 0.5 seconds = 25 ticks
      const intervals = [
        { start: 0, end: 20 * 50, frequency: 5 * 50 },
        { start: 20 * 50, end: 40 * 50, frequency: 3 * 50 },
        { start: 40 * 50, end: 60 * 50, frequency: 2 * 50 },
      ];
      for (let i = 0; i < intervals.length; i++) {
        const interval = intervals[i];
        for (let tick = interval.start; tick < interval.end; tick += interval.frequency) {
          for (let j = 0; j < visibilityDuration; j++) {
            gameState.visibilityTicks.push(tick + j);
          }
        }
      }
    }

    function generateApples() {
      const newApples = [];
      while (newApples.length < 11) {
        let appleX = Math.floor(Math.random() * gridWidth);
        let appleY = Math.floor(Math.random() * gridHeight);
        let positionOccupied = false;

        // Check if the position is already occupied
        for (let i = 0; i < newApples.length; i++) {
          if (newApples[i].x === appleX && newApples[i].y === appleY) {
            positionOccupied = true;
            break;
          }
        }
        // Check if the position is occupied by the snake
        for (let i = 0; i < gameState.snake.length; i++) {
          if (gameState.snake[i].x === appleX && gameState.snake[i].y === appleY) {
            positionOccupied = true;
            break;
          }
        }
        // Check if the position is occupied by the chameleon
        if (rectOverlap(
          { x: appleX, y: appleY, width: 1, height: 1 },
          gameState.chameleon
        )) {
          positionOccupied = true;
        }
        if (!positionOccupied) {
          newApples.push({ x: appleX, y: appleY });
        }
      }
      setGameState(prevState => ({ ...prevState, apples: newApples }));
    }

    function generateNewApple() {
      if (gameState.apples.length >= 11) return;
      let appleX, appleY, positionOccupied;
      do {
        appleX = Math.floor(Math.random() * gridWidth);
        appleY = Math.floor(Math.random() * gridHeight);
        positionOccupied = false;
        for (let i = 0; i < gameState.apples.length; i++) {
          if (gameState.apples[i].x === appleX && gameState.apples[i].y === appleY) {
            positionOccupied = true;
            break;
          }
        }
        for (let i = 0; i < gameState.snake.length; i++) {
          if (gameState.snake[i].x === appleX && gameState.snake[i].y === appleY) {
            positionOccupied = true;
            break;
          }
        }
        if (rectOverlap(
          { x: appleX, y: appleY, width: 1, height: 1 },
          gameState.chameleon
        )) {
          positionOccupied = true;
        }
      } while (positionOccupied);
      setGameState(prevState => ({
        ...prevState,
        apples: [...prevState.apples, { x: appleX, y: appleY }]
      }));
    }

    function rectOverlap(rect1, rect2) {
      return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
      );
    }

    return () => {
      clearInterval(gameInterval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gameState, gameOver, handleGameOutcome, setChameleonApplesEaten, setSnakeApplesEaten, gridWidth, gridHeight]);

  if (!gameState) return null;

  return (
    <canvas
    id="gameCanvas"
    ref={canvasRef}
    width={window.innerWidth * 0.9}  // 90% of viewport width
    height={window.innerHeight * 0.9} // 90% of viewport height
    style={{ maxWidth: '450px', maxHeight: '675px' }}  // Keep the max dimensions for larger screens
    ></canvas>
  );
}

export default GameCanvas;
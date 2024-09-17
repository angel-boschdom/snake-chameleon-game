import React, { useEffect, useRef, useState, useCallback } from 'react';
import InputManager from './InputManager';
import './GameCanvas.css';

function GameCanvas(props) {
  const { isHost, dataChannel, handleGameOutcome, gameOver } = props;

  const canvasRef = useRef(null);
  const [gameState, setGameState] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  // Define grid dimensions at the top level
  const gridWidth = 20;
  const gridHeight = 30;

  // Determine if the device is mobile
  useEffect(() => {
    setIsMobile(/Mobi|Android/i.test(navigator.userAgent));
  }, []);

  // Initialize game state
  useEffect(() => {
    if (!gameState) {
      const initialGameState = {
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
      };

      initialGameState.chameleonImage.src =
        process.env.PUBLIC_URL + '/chameleon.png';

      if (isHost) {
        generateApples(initialGameState);
        generateVisibilityTimes(initialGameState);
      }

      setGameState(initialGameState);
    }
    // Dependency array excludes gameState to prevent infinite loops
  }, [isHost]);

  // Set canvas size on initial render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const aspectRatio = 2 / 3;
      const canvasWidth = canvas.parentElement.clientWidth;
      const canvasHeight = canvasWidth / aspectRatio;
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    }
  }, []);

  // Separate useEffect for setting up dataChannel event listeners
  useEffect(() => {
    if (!dataChannel) return;

    // Host-specific dataChannel.onmessage setup
    if (isHost) {
      dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'chameleonMove') {
          setGameState((prevState) => ({
            ...prevState,
            chameleonDirection: data.direction,
          }));
        }
      };
    } else {
      // Guest-specific dataChannel.onmessage setup
      dataChannel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'gameStateUpdate') {
          setGameState(data.gameState);
          drawGameState(data.gameState); // Pass the updated gameState
        } else if (data.type === 'gameOver') {
          handleGameOutcome(data.message);
        }
      };
    }

    // Cleanup function
    return () => {
      dataChannel.onmessage = null;
    };
    // Only depends on dataChannel and isHost
  }, [dataChannel, isHost]);

  // Main game loop for the host
  const gameLoopStartedRef = useRef(false);

  useEffect(() => {
    if (!isHost || !dataChannel || !gameState) return;
    if (gameLoopStartedRef.current) return; // Prevent multiple game loops

    gameLoopStartedRef.current = true;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Adjust canvas size based on parent container
    const aspectRatio = 2 / 3;
    const canvasWidth = canvas.parentElement.clientWidth;
    const canvasHeight = canvasWidth / aspectRatio;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const cellWidth = canvas.width / gridWidth;
    const cellHeight = canvas.height / gridHeight;

    let animationFrameId;

    // Event listeners for snake controls
    const handleKeyDown = (event) => {
      if (event.key === 'w' && gameState.snakeDirection !== 'down') {
        setGameState((prevState) => ({
          ...prevState,
          snakeDirection: 'up',
        }));
      } else if (event.key === 's' && gameState.snakeDirection !== 'up') {
        setGameState((prevState) => ({
          ...prevState,
          snakeDirection: 'down',
        }));
      } else if (event.key === 'a' && gameState.snakeDirection !== 'right') {
        setGameState((prevState) => ({
          ...prevState,
          snakeDirection: 'left',
        }));
      } else if (event.key === 'd' && gameState.snakeDirection !== 'left') {
        setGameState((prevState) => ({
          ...prevState,
          snakeDirection: 'right',
        }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    const gameLoop = () => {
      if (!gameOver) {
        updateGameState();
        sendGameState();
        drawGameState(gameState);
        animationFrameId = requestAnimationFrame(gameLoop);
      } else {
        if (dataChannel.readyState === 'open') {
          dataChannel.send(
            JSON.stringify({ type: 'gameOver', message: 'Game Over' })
          );
        }
      }
    };

    gameLoop();

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      gameLoopStartedRef.current = false;
    };
    // Now includes gameState to ensure the game loop starts when gameState is ready
  }, [isHost, dataChannel, gameState, gameOver]);

  // For the guest, just draw the game state when it updates
  useEffect(() => {
    if (isHost || !gameState) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Adjust canvas size based on parent container
    const aspectRatio = 2 / 3;
    const canvasWidth = canvas.parentElement.clientWidth;
    const canvasHeight = canvasWidth / aspectRatio;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const cellWidth = canvas.width / gridWidth;
    const cellHeight = canvas.height / gridHeight;

    drawGameState(gameState);
  }, [gameState, isHost]);

  // Define drawGameState function outside useEffect
  const drawGameState = useCallback(
    (state) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      const cellWidth = canvas.width / gridWidth;
      const cellHeight = canvas.height / gridHeight;

      // Draw the game state to the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Draw apples
      ctx.fillStyle = '#f00'; // Bright red
      if (state.apples) {
        state.apples.forEach((apple) => {
          ctx.fillRect(
            apple.x * cellWidth,
            apple.y * cellHeight,
            cellWidth,
            cellHeight
          );
        });
      }
      // Draw snake
      ctx.fillStyle = '#0f0'; // Bright green
      if (state.snake) {
        state.snake.forEach((segment) => {
          ctx.fillRect(
            segment.x * cellWidth,
            segment.y * cellHeight,
            cellWidth,
            cellHeight
          );
        });
      }
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
    },
    [gridWidth, gridHeight]
  );

  // Input handling
  const handleMove = (direction) => {
    if (isHost) {
      if (direction !== null) {
        setGameState((prevState) => ({
          ...prevState,
          snakeDirection: direction,
        }));
      }
    } else {
      if (dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({ type: 'chameleonMove', direction }));
      }
    }
  };

  // Define game functions outside useEffect
  const updateGameState = () => {
    const currentTime = Date.now();

    setGameState((prevState) => {
      let newState = { ...prevState };
      newState.snakeAteApple = false;

      // Move snake based on snakeSpeed
      if (currentTime - newState.lastSnakeMoveTime >= newState.snakeSpeed) {
        moveSnake(newState);
        newState.lastSnakeMoveTime = currentTime;
      }

      // Move chameleon based on chameleonSpeed
      if (
        currentTime - newState.lastChameleonMoveTime >=
        newState.chameleonSpeed
      ) {
        moveChameleon(newState);
        newState.lastChameleonMoveTime = currentTime;
      }

      // Check for collision between snake and chameleon
      for (let i = 0; i < newState.snake.length; i++) {
        const snakeSegment = {
          x: newState.snake[i].x,
          y: newState.snake[i].y,
          width: 1,
          height: 1,
        };
        if (rectOverlap(snakeSegment, newState.chameleon)) {
          handleGameOutcome('Snake caught the chameleon! Snake wins!');
          if (dataChannel.readyState === 'open') {
            dataChannel.send(
              JSON.stringify({
                type: 'gameOver',
                message: 'Snake caught the chameleon! Snake wins!',
              })
            );
          }
          return newState;
        }
      }

      // Chameleon visibility logic
      updateChameleonVisibility(newState);

      // Increment elapsed ticks
      newState.elapsedTicks++;

      return newState;
    });
  };

  const sendGameState = () => {
    if (dataChannel.readyState === 'open') {
      dataChannel.send(
        JSON.stringify({ type: 'gameStateUpdate', gameState })
      );
    }
  };

  // Rest of the functions
  const moveSnake = (state) => {
    let headX = state.snake[0].x;
    let headY = state.snake[0].y;
    if (state.snakeDirection === 'left') headX--;
    else if (state.snakeDirection === 'right') headX++;
    else if (state.snakeDirection === 'up') headY--;
    else if (state.snakeDirection === 'down') headY++;
    // Wrap around the grid
    if (headX < 0) headX = gridWidth - 1;
    else if (headX >= gridWidth) headX = 0;
    if (headY < 0) headY = gridHeight - 1;
    else if (headY >= gridHeight) headY = 0;
    // Check for self-collision
    for (let i = 1; i < state.snake.length; i++) {
      if (state.snake[i].x === headX && state.snake[i].y === headY) {
        handleGameOutcome('Snake has eaten itself! Game over.');
        dataChannel.send(
          JSON.stringify({
            type: 'gameOver',
            message: 'Snake has eaten itself! Game over.',
          })
        );
        return;
      }
    }
    state.snake.unshift({ x: headX, y: headY });
    // Check if snake eats an apple
    for (let i = 0; i < state.apples.length; i++) {
      if (state.apples[i].x === headX && state.apples[i].y === headY) {
        state.apples.splice(i, 1);
        state.snakeAteApple = true;
        generateNewApple(state);
        break;
      }
    }
    if (!state.snakeAteApple) {
      state.snake.pop(); // Remove the last segment to keep the snake the same length
    }
  };

  const moveChameleon = (state) => {
    if (state.chameleonDirection !== null) {
      let chameleonX = state.chameleon.x;
      let chameleonY = state.chameleon.y;
      if (state.chameleonDirection === 'left') chameleonX--;
      else if (state.chameleonDirection === 'right') chameleonX++;
      else if (state.chameleonDirection === 'up') chameleonY--;
      else if (state.chameleonDirection === 'down') chameleonY++;
      // Ensure chameleon stays within bounds
      if (chameleonX < 0) chameleonX = 0;
      else if (chameleonX + state.chameleon.width > gridWidth)
        chameleonX = gridWidth - state.chameleon.width;
      if (chameleonY < 0) chameleonY = 0;
      else if (chameleonY + state.chameleon.height > gridHeight)
        chameleonY = gridHeight - state.chameleon.height;
      state.chameleon.x = chameleonX;
      state.chameleon.y = chameleonY;
      // Check if chameleon eats an apple
      for (let i = 0; i < state.apples.length; i++) {
        if (
          rectOverlap(state.chameleon, {
            x: state.apples[i].x,
            y: state.apples[i].y,
            width: 1,
            height: 1,
          })
        ) {
          state.apples.splice(i, 1);
          state.chameleonVisibleUntil = state.elapsedTicks + 30; // extraVisibilityTicks
          generateNewApple(state);
          break;
        }
      }
    }
  };

  const generateVisibilityTimes = (state) => {
    state.visibilityTicks = [];
    const visibilityDuration = 25;
    const intervals = [
      { start: 0, end: 20 * 50, frequency: 5 * 50 },
      { start: 20 * 50, end: 40 * 50, frequency: 3 * 50 },
      { start: 40 * 50, end: 60 * 50, frequency: 2 * 50 },
    ];
    for (let i = 0; i < intervals.length; i++) {
      const interval = intervals[i];
      for (
        let tick = interval.start;
        tick < interval.end;
        tick += interval.frequency
      ) {
        for (let j = 0; j < visibilityDuration; j++) {
          state.visibilityTicks.push(tick + j);
        }
      }
    }
  };

  const updateChameleonVisibility = (state) => {
    if (state.elapsedTicks < state.chameleonVisibleUntil) {
      state.chameleonVisible = true;
    } else if (state.visibilityTicks.includes(state.elapsedTicks)) {
      state.chameleonVisible = true;
    } else {
      state.chameleonVisible = false;
    }
  };

  const rectOverlap = (rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + (rect1.width || 1) > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + (rect1.height || 1) > rect2.y
    );
  };

  const generateApples = (state) => {
    const newApples = [];
    while (newApples.length < 11) {
      let appleX = Math.floor(Math.random() * gridWidth);
      let appleY = Math.floor(Math.random() * gridHeight);
      let positionOccupied = false;

      // Check if apple position is occupied
      for (let i = 0; i < newApples.length; i++) {
        if (newApples[i].x === appleX && newApples[i].y === appleY) {
          positionOccupied = true;
          break;
        }
      }
      for (let i = 0; i < state.snake.length; i++) {
        if (state.snake[i].x === appleX && state.snake[i].y === appleY) {
          positionOccupied = true;
          break;
        }
      }
      if (
        rectOverlap(
          { x: appleX, y: appleY, width: 1, height: 1 },
          state.chameleon
        )
      ) {
        positionOccupied = true;
      }
      if (!positionOccupied) {
        newApples.push({ x: appleX, y: appleY });
      }
    }
    state.apples = newApples;
  };

  const generateNewApple = (state) => {
    if (state.apples.length >= 11) return;
    let appleX, appleY, positionOccupied;
    do {
      appleX = Math.floor(Math.random() * gridWidth);
      appleY = Math.floor(Math.random() * gridHeight);
      positionOccupied = false;
      for (let i = 0; i < state.apples.length; i++) {
        if (state.apples[i].x === appleX && state.apples[i].y === appleY) {
          positionOccupied = true;
          break;
        }
      }
      for (let i = 0; i < state.snake.length; i++) {
        if (state.snake[i].x === appleX && state.snake[i].y === appleY) {
          positionOccupied = true;
          break;
        }
      }
      if (
        rectOverlap(
          { x: appleX, y: appleY, width: 1, height: 1 },
          state.chameleon
        )
      ) {
        positionOccupied = true;
      }
    } while (positionOccupied);
    state.apples.push({ x: appleX, y: appleY });
  };

  // Render the canvas and input manager
  return (
    <div className="game-canvas-container">
      <canvas ref={canvasRef} className="game-canvas" />
      <InputManager onMove={handleMove} isMobile={isMobile} />
    </div>
  );
}

export default GameCanvas;

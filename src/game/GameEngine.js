// GameEngine.js
import {
    SNAKE_SPEED,
    CHAMELEON_SPEED,
    GRID_WIDTH,
    GRID_HEIGHT,
  } from './constants';
  
  // Initialize game state based on whether the player is the host
  export const initializeGameState = (isHost) => {
    const initialGameState = {
      snakeSpeed: SNAKE_SPEED,
      chameleonSpeed: CHAMELEON_SPEED,
      lastSnakeMoveTime: 0,
      lastChameleonMoveTime: 0,
      snake: [
        {
          x: Math.floor(GRID_WIDTH / 2),
          y: Math.floor(GRID_HEIGHT / 2),
        },
      ],
      snakeDirection: 'right',
      snakeAteApple: false,
      chameleon: {
        x: Math.floor(GRID_WIDTH / 4),
        y: Math.floor(GRID_HEIGHT / 3),
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
  
    return initialGameState;
  };
  
  // Update game state on each game tick
  export const updateGameState = (
    state,
    handleGameOutcome,
    dataChannel,
    isHost
  ) => {
    const currentTime = Date.now();
    const newState = { ...state };
    newState.snakeAteApple = false;
  
    // Move snake based on snake speed
    if (currentTime - newState.lastSnakeMoveTime >= newState.snakeSpeed) {
      moveSnake(newState, handleGameOutcome, dataChannel, isHost);
      newState.lastSnakeMoveTime = currentTime;
    }
  
    // Move chameleon based on chameleon speed
    if (
      currentTime - newState.lastChameleonMoveTime >= newState.chameleonSpeed
    ) {
      moveChameleon(newState, handleGameOutcome, dataChannel, isHost);
      newState.lastChameleonMoveTime = currentTime;
    }
  
    // Update chameleon visibility logic
    updateChameleonVisibility(newState);
  
    // Increment the elapsed game ticks
    newState.elapsedTicks++;
  
    return newState;
  };
  
  // Move the snake based on its current direction
  const moveSnake = (state, handleGameOutcome, dataChannel, isHost) => {
    let headX = state.snake[0].x;
    let headY = state.snake[0].y;
  
    // Update the head position based on the direction
    if (state.snakeDirection === 'left') headX--;
    else if (state.snakeDirection === 'right') headX++;
    else if (state.snakeDirection === 'up') headY--;
    else if (state.snakeDirection === 'down') headY++;
  
    // Wrap the snake around the grid if it goes off the edge
    if (headX < 0) headX = GRID_WIDTH - 1;
    else if (headX >= GRID_WIDTH) headX = 0;
    if (headY < 0) headY = GRID_HEIGHT - 1;
    else if (headY >= GRID_HEIGHT) headY = 0;
  
    // Check if the snake collides with itself
    for (let i = 1; i < state.snake.length; i++) {
      if (state.snake[i].x === headX && state.snake[i].y === headY) {
        handleGameOutcome('Snake has eaten itself! Game over.');
        if (dataChannel && dataChannel.readyState === 'open') {
          dataChannel.send(
            JSON.stringify({
              type: 'gameOver',
              message: 'Snake has eaten itself! Game over.',
            })
          );
        }
        return;
      }
    }
  
    // Move the snake's head
    state.snake.unshift({ x: headX, y: headY });
  
    // Check if the snake eats an apple
    for (let i = 0; i < state.apples.length; i++) {
      if (state.apples[i].x === headX && state.apples[i].y === headY) {
        state.apples.splice(i, 1); // Remove the apple
        state.snakeAteApple = true;
        generateNewApple(state); // Generate a new apple
        break;
      }
    }
  
    // If the snake didn't eat an apple, remove the last segment
    if (!state.snakeAteApple) {
      state.snake.pop();
    }
  };
  
  // Move the chameleon based on its current direction
  const moveChameleon = (state, handleGameOutcome, dataChannel, isHost) => {
    if (state.chameleonDirection !== null) {
      let chameleonX = state.chameleon.x;
      let chameleonY = state.chameleon.y;
  
      // Update the chameleon position based on the direction
      if (state.chameleonDirection === 'left') chameleonX--;
      else if (state.chameleonDirection === 'right') chameleonX++;
      else if (state.chameleonDirection === 'up') chameleonY--;
      else if (state.chameleonDirection === 'down') chameleonY++;
  
      // Keep the chameleon within bounds
      if (chameleonX < 0) chameleonX = 0;
      else if (chameleonX + state.chameleon.width > GRID_WIDTH)
        chameleonX = GRID_WIDTH - state.chameleon.width;
  
      if (chameleonY < 0) chameleonY = 0;
      else if (chameleonY + state.chameleon.height > GRID_HEIGHT)
        chameleonY = GRID_HEIGHT - state.chameleon.height;
  
      state.chameleon.x = chameleonX;
      state.chameleon.y = chameleonY;
  
      // Check if the chameleon eats an apple
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
          state.chameleonVisibleUntil = state.elapsedTicks + 30; // Increase visibility
          generateNewApple(state);
          break;
        }
      }
    }
  };
  
  // Generate apples at random positions on the grid
  const generateApples = (state) => {
    const newApples = [];
    while (newApples.length < 11) {
      let appleX = Math.floor(Math.random() * GRID_WIDTH);
      let appleY = Math.floor(Math.random() * GRID_HEIGHT);
      let positionOccupied = false;
  
      // Check if apple position is occupied by another apple or snake/chameleon
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
      if (rectOverlap({ x: appleX, y: appleY, width: 1, height: 1 }, state.chameleon)) {
        positionOccupied = true;
      }
  
      if (!positionOccupied) {
        newApples.push({ x: appleX, y: appleY });
      }
    }
    state.apples = newApples;
  };
  
  // Generate a new apple in an available position
  const generateNewApple = (state) => {
    if (state.apples.length >= 11) return;
  
    let appleX, appleY, positionOccupied;
    do {
      appleX = Math.floor(Math.random() * GRID_WIDTH);
      appleY = Math.floor(Math.random() * GRID_HEIGHT);
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
      if (rectOverlap({ x: appleX, y: appleY, width: 1, height: 1 }, state.chameleon)) {
        positionOccupied = true;
      }
    } while (positionOccupied);
  
    state.apples.push({ x: appleX, y: appleY });
  };
  
  // Generate random intervals for chameleon visibility
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
      for (let tick = interval.start; tick < interval.end; tick += interval.frequency) {
        for (let j = 0; j < visibilityDuration; j++) {
          state.visibilityTicks.push(tick + j);
        }
      }
    }
  };
  
  // Update chameleon visibility based on the elapsed ticks
  const updateChameleonVisibility = (state) => {
    if (state.elapsedTicks < state.chameleonVisibleUntil) {
      state.chameleonVisible = true;
    } else if (state.visibilityTicks.includes(state.elapsedTicks)) {
      state.chameleonVisible = true;
    } else {
      state.chameleonVisible = false;
    }
  };
  
  // Check if two rectangles overlap
  const rectOverlap = (rect1, rect2) => {
    return (
      rect1.x < rect2.x + rect2.width &&
      rect1.x + (rect1.width || 1) > rect2.x &&
      rect1.y < rect2.y + rect2.height &&
      rect1.y + (rect1.height || 1) > rect2.y
    );
  };
  
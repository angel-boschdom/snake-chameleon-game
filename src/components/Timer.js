/* src/components/Timer.js */
import React from 'react';
import './Timer.css';

function Timer({ timeLeft }) {
  return <div id="timer">Time Left: {timeLeft}</div>;
}

export default Timer;

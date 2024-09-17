/* src/components/Counters.js */
import React from 'react';
import './Counters.css';

function Counters({ snakeApplesEaten, chameleonApplesEaten }) {
  return (
    <div id="counters">
      <div id="snakeApples">Snake Apples: {snakeApplesEaten}</div>
      <div id="chameleonApples">Chameleon Apples: {chameleonApplesEaten}</div>
    </div>
  );
}

export default Counters;

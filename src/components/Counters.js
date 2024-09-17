/* src/components/Counters.js */
import React from 'react';

function Counters({ snakeApplesEaten, chameleonApplesEaten }) {
  return (
    <div id="counters">
      <div id="snakeApples">Snake Apples Eaten: {snakeApplesEaten}</div>
      <div id="chameleonApples">Chameleon Apples Eaten: {chameleonApplesEaten}</div>
    </div>
  );
}

export default Counters;

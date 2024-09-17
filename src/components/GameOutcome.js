/* src/components/GameOutcome.js */
import React from 'react';
import './GameOutcome.css';

function GameOutcome({ message, onRestart }) {
  return (
    <div id="gameOutcomeOverlay">
      <div id="gameOutcomeMessage">
        {message}
        <button id="gameOutcomeButton" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}

export default GameOutcome;

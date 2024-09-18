// useDataChannel.js
import { useEffect } from 'react';

function useDataChannel({
  isHost,
  dataChannel,
  gameStateRef,
  handleGameOutcome,
  setGameState,
  drawGameState,
}) {
  useEffect(() => {
    if (!dataChannel) return;

    dataChannel.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (isHost) {
        if (data.type === 'chameleonMove') {
          gameStateRef.current.chameleonDirection = data.direction;
        }
      } else {
        if (data.type === 'gameStateUpdate') {
          setGameState(data.gameState);
          drawGameState(data.gameState);
        } else if (data.type === 'gameOver') {
          handleGameOutcome(data.message);
        }
      }
    };

    return () => {
      dataChannel.onmessage = null;
    };
  }, [
    dataChannel,
    isHost,
    gameStateRef,
    handleGameOutcome,
    setGameState,
    drawGameState,
  ]);
}

export default useDataChannel;

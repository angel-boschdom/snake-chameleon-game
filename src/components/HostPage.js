import React, { useState, useEffect, useRef } from 'react';
import GameCanvas from './GameCanvas';
import '../styles/HostGuestPage.css';

function HostPage() {
  const [offer, setOffer] = useState('');
  const [answer, setAnswer] = useState('');
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Generating SDP offer...');
  const [error, setError] = useState(null);
  const dataChannelRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameOutcomeMessage, setGameOutcomeMessage] = useState('');

  useEffect(() => {
    const peerConnection = new RTCPeerConnection();
    dataChannelRef.current = peerConnection.createDataChannel('gameData');
    dataChannelRef.current.onopen = () => {
      setStatus('Connected!');
      setConnected(true);
    };
    dataChannelRef.current.onmessage = (event) => {
      // Handle incoming messages from guest
      const message = JSON.parse(event.data);
      // Handle chameleon inputs
    };

    // Collect ICE candidates
    const iceCandidates = [];
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        iceCandidates.push(event.candidate);
      } else {
        // ICE gathering completed
        const localDescription = peerConnection.localDescription;
        setOffer(JSON.stringify(localDescription));
        setStatus('SDP Offer generated! Copy and send it to the guest.');
      }
    };

    peerConnection
      .createOffer()
      .then((offer) => peerConnection.setLocalDescription(offer))
      .catch((err) => {
        setError('Error generating offer: ' + err.message);
      });

    peerConnectionRef.current = peerConnection;
  }, []);

  const handleAnswerSubmit = () => {
    const answerDescription = new RTCSessionDescription(JSON.parse(answer));
    peerConnectionRef.current
      .setRemoteDescription(answerDescription)
      .then(() => {
        setStatus('SDP Answer accepted. Waiting for connection...');
      })
      .catch((err) => {
        setError('Error setting remote description: ' + err.message);
      });
  };

  // Define handleGameOutcome function
  const handleGameOutcome = (message) => {
    setGameOver(true);
    setGameOutcomeMessage(message);
    alert(message); // Display the game outcome
  };

  return (
    <div className="host-page">
      <h2>Host Page</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <p>Status: {status}</p>
      {!connected ? (
        <>
          <div>
            <h3>SDP Offer:</h3>
            <textarea value={offer} readOnly rows={10} cols={50} />
            <button onClick={() => navigator.clipboard.writeText(offer)}>Copy Offer</button>
          </div>
          <div>
            <h3>Paste SDP Answer:</h3>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={10}
              cols={50}
            />
            <button onClick={handleAnswerSubmit}>Submit Answer</button>
          </div>
        </>
      ) : (
        <GameCanvas
          isHost={true}
          dataChannel={dataChannelRef.current}
          handleGameOutcome={handleGameOutcome} // Pass the function as a prop
          gameOver={gameOver} // Pass the gameOver state
        />
      )}
    </div>
  );
}

export default HostPage;

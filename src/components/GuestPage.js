import React, { useState, useEffect, useRef } from 'react';
import GameCanvas from './GameCanvas';
import '../styles/HostGuestPage.css';

function GuestPage() {
  const [offer, setOffer] = useState('');
  const [answer, setAnswer] = useState('');
  const [connected, setConnected] = useState(false);
  const [status, setStatus] = useState('Waiting for host’s SDP offer...');
  const [error, setError] = useState(null);
  const dataChannelRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const [gameOver, setGameOver] = useState(false);
  const [gameOutcomeMessage, setGameOutcomeMessage] = useState('');

  useEffect(() => {
    const peerConnection = new RTCPeerConnection();

    peerConnection.ondatachannel = (event) => {
      dataChannelRef.current = event.channel;
      dataChannelRef.current.onopen = () => {
        setStatus('Connected!');
        setConnected(true);
      };
      dataChannelRef.current.onmessage = (event) => {
        // Handle incoming messages from host
        const message = JSON.parse(event.data);
        // Update game state
      };
    };

    // Collect ICE candidates
    const iceCandidates = [];
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        iceCandidates.push(event.candidate);
      } else {
        // ICE gathering completed
        const localDescription = peerConnection.localDescription;
        setAnswer(JSON.stringify(localDescription));
        setStatus('SDP Answer generated! Copy and send it to the host.');
      }
    };

    peerConnectionRef.current = peerConnection;
  }, []);

  const handleOfferSubmit = () => {
    const offerDescription = new RTCSessionDescription(JSON.parse(offer));
    peerConnectionRef.current
      .setRemoteDescription(offerDescription)
      .then(() => peerConnectionRef.current.createAnswer())
      .then((answer) => peerConnectionRef.current.setLocalDescription(answer))
      .catch((err) => {
        setError('Error processing offer: ' + err.message);
      });
  };

  // Define handleGameOutcome function
  const handleGameOutcome = (message) => {
    setGameOver(true);
    setGameOutcomeMessage(message);
    alert(message); // Display the game outcome
  };

  return (
    <div className="guest-page">
      <h2>Guest Page</h2>
      {error && <div style={{ color: 'red' }}>{error}</div>}
      <p>Status: {status}</p>
      {!connected ? (
        <>
          <div>
            <h3>Paste SDP Offer:</h3>
            <textarea
              value={offer}
              onChange={(e) => setOffer(e.target.value)}
              rows={10}
              cols={50}
            />
            <button onClick={handleOfferSubmit}>Submit Offer</button>
          </div>
          {answer && (
            <div>
              <h3>SDP Answer:</h3>
              <textarea value={answer} readOnly rows={10} cols={50} />
              <button onClick={() => navigator.clipboard.writeText(answer)}>Copy Answer</button>
            </div>
          )}
        </>
      ) : (
        <GameCanvas
          isHost={false}
          dataChannel={dataChannelRef.current}
          handleGameOutcome={handleGameOutcome} // Pass the function as a prop
          gameOver={gameOver} // Pass the gameOver state
        />
      )}
    </div>
  );
}

export default GuestPage;

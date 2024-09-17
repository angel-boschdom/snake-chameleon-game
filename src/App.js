/* src/App.js */
import React, { useState } from 'react';
import HostPage from './components/HostPage';
import GuestPage from './components/GuestPage';
import './index.css';

function App() {
  const [role, setRole] = useState(null);

  const selectRole = (selectedRole) => {
    setRole(selectedRole);
  };

  return (
    <div id="gameContainer">
      {!role ? (
        <div className="role-selection">
          <h1>Snake vs. Chameleon</h1>
          <button onClick={() => selectRole('host')}>Host Game (Play as Snake)</button>
          <button onClick={() => selectRole('guest')}>Join Game (Play as Chameleon)</button>
        </div>
      ) : role === 'host' ? (
        <HostPage />
      ) : (
        <GuestPage />
      )}
    </div>
  );
}

export default App;

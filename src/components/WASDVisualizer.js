// src/components/WASDVisualizer.js
import React, { useState, useEffect } from 'react';
import '../styles/WASDVisualizer.css';

function WASDVisualizer({ onMove }) {
  const [keysPressed, setKeysPressed] = useState({
    w: false,
    a: false,
    s: false,
    d: false,
  });

  useEffect(() => {
    const handleKeyDown = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setKeysPressed((prev) => ({ ...prev, [key]: true }));
        onMove(key);
      }
    };

    const handleKeyUp = (e) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd'].includes(key)) {
        setKeysPressed((prev) => ({ ...prev, [key]: false }));
        onMove(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onMove]);

  return (
    <div className="wasd-visualizer">
      <div className={`key ${keysPressed.w ? 'active' : ''}`}>W</div>
      <div className="key-row">
        <div className={`key ${keysPressed.a ? 'active' : ''}`}>A</div>
        <div className={`key ${keysPressed.s ? 'active' : ''}`}>S</div>
        <div className={`key ${keysPressed.d ? 'active' : ''}`}>D</div>
      </div>
    </div>
  );
}

export default WASDVisualizer;

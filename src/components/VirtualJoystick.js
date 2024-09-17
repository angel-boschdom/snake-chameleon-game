// src/components/VirtualJoystick.js
import React, { useEffect, useState } from 'react';
import nipplejs from 'nipplejs';
import './VirtualJoystick.css';

function VirtualJoystick({ onMove }) {
  const [joystick, setJoystick] = useState(null);

  useEffect(() => {
    const options = {
      zone: document.getElementById('joystick'),
      mode: 'static',
      position: { left: '50%', bottom: '25%' },
      color: 'blue',
    };
    const joystickInstance = nipplejs.create(options);
    setJoystick(joystickInstance);

    return () => {
      joystickInstance.destroy();
    };
  }, []);

  useEffect(() => {
    if (joystick) {
      joystick.on('move', (evt, data) => {
        const { angle } = data;
        let direction = null;
        if (angle) {
          const degree = angle.degree;
          if (degree >= 45 && degree < 135) {
            direction = 'up';
          } else if (degree >= 135 && degree < 225) {
            direction = 'left';
          } else if (degree >= 225 && degree < 315) {
            direction = 'down';
          } else {
            direction = 'right';
          }
        }
        onMove(direction);
      });
      joystick.on('end', () => {
        onMove(null);
      });
    }
  }, [joystick, onMove]);

  return (
    <div className="virtual-joystick-container">
      <div id="joystick" className="joystick-zone"></div>
    </div>
  );
}

export default VirtualJoystick;

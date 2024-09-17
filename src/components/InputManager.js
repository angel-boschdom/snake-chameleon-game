// src/components/InputManager.js
import React from 'react';
import VirtualJoystick from './VirtualJoystick';
import WASDVisualizer from './WASDVisualizer';

function InputManager({ isMobile, onMove }) {
  return isMobile ? (
    <VirtualJoystick onMove={onMove} />
  ) : (
    <WASDVisualizer onMove={onMove} />
  );
}

export default InputManager;

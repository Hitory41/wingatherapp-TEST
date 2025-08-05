import React, { useState } from 'react';
import './App.css';

// Скопируйте весь код вашего компонента GiveawayApp сюда
// Замените строку с const { useStoredState } = hatch; на:
const useStoredState = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  });

  const setStoredValue = (newValue) => {
    try {
      setValue(newValue);
      window.localStorage.setItem(key, JSON.stringify(newValue));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [value, setStoredValue];
};

// Замените const { useUser } = hatch; на:
const useUser = () => ({
  id: 'web_user_' + Math.random().toString(36),
  name: 'Веб пользователь',
  color: '#FF802B'
});

// Здесь вставьте весь остальной код вашего GiveawayApp компонента
// но замените export default GiveawayApp; на:
function App() {
  return <GiveawayApp />;
}

export default App;

// hooks/useOnlineStatus.js
import { useState, useEffect } from 'react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Définir l'état initial
    setIsOnline(navigator.onLine);
    
    // Gestionnaires d'événements
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    // Écouter les changements de connexion
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Nettoyage
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline
  };
}
// components/OfflineMessage.js
import React from 'react';
import { WifiOff } from 'lucide-react';

export default function OfflineMessage({ isOnline }) {
  // Ne rien afficher si l'utilisateur est en ligne
  if (isOnline) return null;

  return (
    <div className="mb-6 p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
      <div className="flex items-center space-x-2">
        <WifiOff className="w-5 h-5 text-yellow-600" />
        <p className="text-yellow-800">
          Vous êtes hors ligne. Les modifications seront synchronisées à la reconnexion.
        </p>
      </div>
    </div>
  );
}
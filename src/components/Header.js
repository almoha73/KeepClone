// components/Header.js
import React from 'react';
import { Search, Wifi, WifiOff, Loader2, LogOut, User } from 'lucide-react';

export default function Header({ 
  user, 
  isOnline, 
  syncing, 
  searchTerm, 
  setSearchTerm, 
  onLogout 
}) {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo et statut */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-normal text-gray-700">Keep</h1>
          <div className="flex items-center space-x-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-500" title="En ligne" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" title="Hors ligne" />
            )}
            {syncing && (
              <div className="flex items-center space-x-1 text-blue-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-xs">Synchronisation...</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Barre de recherche */}
        <div className="flex-1 max-w-2xl mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les notes"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
            />
          </div>
        </div>

        {/* Infos utilisateur et déconnexion */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>{user?.email}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>
    </header>
  );
}
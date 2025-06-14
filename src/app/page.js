// src/app/page.js - REFACTORISÉ
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

// Composants
import AuthForm from '@/components/AuthForm';
import Header from '@/components/Header';
import NoteForm from '@/components/NoteForm';
import NotesGrid from '@/components/NotesGrid';
import OfflineMessage from '@/components/OfflineMessage';

// Hooks personnalisés
import { useAuth } from '@/hooks/useAuth';
import { useNotes } from '@/hooks/useNotes';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useNotesFilter } from '@/hooks/useNotesFilter';

export default function KeepClone() {
  // Hooks d'authentification
  const { user, authLoading, handleLogout } = useAuth();
  
  // Hook de statut de connexion
  const { isOnline } = useOnlineStatus();
  
  // Hook de gestion des notes
  const { 
    notes, 
    loading, 
    syncing,
    createNote, 
    deleteNote, 
    updateNote, 
    togglePin,
    moveNoteUp, 
    moveNoteDown
  } = useNotes(user);
  
  // Hook de filtrage et recherche
  const {
    searchTerm, 
    setSearchTerm,
    filteredNotes, 
    pinnedNotes, 
    unpinnedNotes
  } = useNotesFilter(notes);

  // Écran de chargement de l'authentification
  if (authLoading) {
    return <LoadingScreen message="Chargement..." />;
  }

  // Écran de connexion
  if (!user) {
    return <AuthForm />;
  }

  // Écran de chargement des notes
  if (loading) {
    return <LoadingScreen message="Chargement de vos notes..." />;
  }

  // Grouper les handlers de notes pour les passer plus facilement
  const noteHandlers = {
    onUpdate: updateNote,
    onDelete: deleteNote,
    onTogglePin: togglePin,
    onMoveUp: moveNoteUp,
    onMoveDown: moveNoteDown
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header avec recherche et infos utilisateur */}
      <Header 
        user={user}
        isOnline={isOnline}
        syncing={syncing}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onLogout={handleLogout}
      />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Formulaire de création de note */}
        <div className="mb-8">
          <NoteForm 
            user={user} 
            onCreateNote={createNote} 
            syncing={syncing} 
          />
        </div>

        {/* Message hors ligne */}
        <OfflineMessage isOnline={isOnline} />

        {/* Grille des notes */}
        <NotesGrid
          pinnedNotes={pinnedNotes}
          unpinnedNotes={unpinnedNotes}
          user={user}
          noteHandlers={noteHandlers}
          syncing={syncing}
          searchTerm={searchTerm}
          totalNotes={notes.length}
        />
      </div>
    </div>
  );
}

// Composant utilitaire pour les écrans de chargement
function LoadingScreen({ message }) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
}
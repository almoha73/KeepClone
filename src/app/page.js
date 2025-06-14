// src/app/page.js
'use client';

import React, { useState, useEffect } from 'react';
import { Search, Edit3, Loader2, Wifi, WifiOff, LogOut, User, Pin } from 'lucide-react';
// IMPORTS FIREBASE
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { ref, deleteObject } from 'firebase/storage';

// Imports des composants
import AuthForm from '@/components/AuthForm';
import NoteCard from '@/components/NoteCard';
import NoteForm from '@/components/NoteForm';

// Import de la configuration Firebase
import { db, auth, storage } from '@/lib/firebase';

export default function KeepClone() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [notes, setNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Écouter l'état d'authentification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Écouter les changements de connexion
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Charger les notes de l'utilisateur connecté
  useEffect(() => {
    if (!user) {
      setNotes([]);
      return;
    }

    setLoading(true);
    
    const q = query(
      collection(db, 'notes'), 
      where('ownerId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Trier par épinglées puis par date de création
      const sortedNotes = notesData.sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setNotes(sortedNotes);
      setLoading(false);
    }, (error) => {
      console.error('Erreur lors du chargement des notes:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Fonctions de réorganisation avec boutons (corrigées)
  const moveNoteUp = async (noteId) => {
    const currentNote = notes.find(n => n.id === noteId);
    const sectionNotes = currentNote.pinned ? pinnedNotes : unpinnedNotes;
    const currentIndex = sectionNotes.findIndex(n => n.id === noteId);
    
    if (currentIndex > 0) {
      await moveToPosition(noteId, currentIndex - 1);
    }
  };

  const moveNoteDown = async (noteId) => {
    const currentNote = notes.find(n => n.id === noteId);
    const sectionNotes = currentNote.pinned ? pinnedNotes : unpinnedNotes;
    const currentIndex = sectionNotes.findIndex(n => n.id === noteId);
    
    if (currentIndex < sectionNotes.length - 1) {
      await moveToPosition(noteId, currentIndex + 1);
    }
  };

  // Nouvelle fonction pour déplacer à une position spécifique (corrigée)
  const moveToPosition = async (noteId, targetPosition) => {
    const currentNote = notes.find(n => n.id === noteId);
    const sectionNotes = currentNote.pinned ? pinnedNotes : unpinnedNotes;
    const currentIndex = sectionNotes.findIndex(n => n.id === noteId);
    
    if (currentIndex === targetPosition) return;
    
    setSyncing(true);
    try {
      // Créer un nouveau tableau avec la note déplacée
      const newOrder = [...sectionNotes];
      const [movedNote] = newOrder.splice(currentIndex, 1);
      newOrder.splice(targetPosition, 0, movedNote);
      
      // Mettre à jour toutes les positions avec des index séquentiels
      const baseTime = Date.now();
      const updates = [];
      
      for (let i = 0; i < newOrder.length; i++) {
        const note = newOrder[i];
        // Utiliser un ordre décroissant pour que le premier ait le plus grand index
        const orderIndex = baseTime + (1000 * (newOrder.length - i));
        
        updates.push(updateDoc(doc(db, 'notes', note.id), {
          orderIndex: orderIndex,
          updatedAt: new Date(baseTime + i).toISOString()
        }));
      }
      
      // Exécuter toutes les mises à jour en parallèle
      await Promise.all(updates);
      
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      alert('Erreur lors du déplacement. Vérifiez votre connexion.');
    }
    setSyncing(false);
  };

  // Créer une nouvelle note
  const createNote = async (noteData) => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const completeNoteData = {
        ...noteData,
        title: noteData.title || 'Note sans titre',
        pinned: false,
        ownerId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await addDoc(collection(db, 'notes'), completeNoteData);
    } catch (error) {
      console.error('Erreur lors de la création de la note:', error);
      alert('Erreur lors de la sauvegarde. Vérifiez votre connexion.');
    }
    setSyncing(false);
  };

  // Supprimer une note
  const deleteNote = async (id) => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const noteToDelete = notes.find(note => note.id === id);
      
      // Supprimer tous les fichiers attachés
      if (noteToDelete?.attachments) {
        for (const attachment of noteToDelete.attachments) {
          try {
            const fileRef = ref(storage, attachment.path);
            await deleteObject(fileRef);
          } catch (error) {
            console.error('Erreur lors de la suppression du fichier:', error);
          }
        }
      }
      
      await deleteDoc(doc(db, 'notes', id));
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      alert('Erreur lors de la suppression. Vérifiez votre connexion.');
    }
    setSyncing(false);
  };

  // Épingler/désépingler une note
  const togglePin = async (id) => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const note = notes.find(n => n.id === id);
      await updateDoc(doc(db, 'notes', id), {
        pinned: !note.pinned,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de l\'épinglage:', error);
      alert('Erreur lors de la mise à jour. Vérifiez votre connexion.');
    }
    setSyncing(false);
  };

  // Mettre à jour une note
  const updateNote = async (id, updates) => {
    if (!user) return;
    
    setSyncing(true);
    try {
      await updateDoc(doc(db, 'notes', id), {
        ...updates,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      alert('Erreur lors de la mise à jour. Vérifiez votre connexion.');
    }
    setSyncing(false);
  };

  // Déconnexion
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Filtrer et trier les notes
  const filteredNotes = notes.filter(note => {
    const searchLower = searchTerm.toLowerCase();
    
    // Recherche dans titre et contenu
    const titleMatch = note.title?.toLowerCase().includes(searchLower);
    const contentMatch = note.content?.toLowerCase().includes(searchLower);
    
    // Recherche dans les fichiers attachés
    const attachmentMatch = note.attachments?.some(attachment => 
      attachment.name?.toLowerCase().includes(searchLower)
    );
    
    return titleMatch || contentMatch || attachmentMatch;
  });

  // Trier par orderIndex puis par date de création
  const sortedNotes = filteredNotes.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    
    // Dans la même section, trier par orderIndex ou date
    const aOrder = a.orderIndex || new Date(a.createdAt).getTime();
    const bOrder = b.orderIndex || new Date(b.createdAt).getTime();
    return bOrder - aOrder;
  });

  const pinnedNotes = sortedNotes.filter(note => note.pinned);
  const unpinnedNotes = sortedNotes.filter(note => !note.pinned);

  // Écran de chargement de l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Écran de connexion
  if (!user) {
    return <AuthForm />;
  }

  // Écran principal avec notes
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
          <p className="text-gray-600">Chargement de vos notes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
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

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

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
        {!isOnline && (
          <div className="mb-6 p-4 bg-yellow-100 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <WifiOff className="w-5 h-5 text-yellow-600" />
              <p className="text-yellow-800">
                Vous êtes hors ligne. Les modifications seront synchronisées à la reconnexion.
              </p>
            </div>
          </div>
        )}

        {/* Notes épinglées */}
        {pinnedNotes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-medium text-gray-600 mb-4 uppercase tracking-wide flex items-center">
              <Pin className="w-4 h-4 mr-2" />
              Épinglées
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {pinnedNotes.map((note, index) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  user={user}
                  onUpdate={updateNote}
                  onDelete={deleteNote}
                  onTogglePin={togglePin}
                  onMoveUp={moveNoteUp}
                  onMoveDown={moveNoteDown}
                  onMoveToPosition={moveToPosition}
                  canMoveUp={index > 0}
                  canMoveDown={index < pinnedNotes.length - 1}
                  totalInSection={pinnedNotes.length}
                  currentPosition={index}
                  syncing={syncing}
                />
              ))}
            </div>
          </div>
        )}

        {/* Autres notes */}
        {unpinnedNotes.length > 0 && (
          <div>
            {pinnedNotes.length > 0 && (
              <h2 className="text-sm font-medium text-gray-600 mb-4 uppercase tracking-wide">
                Autres
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {unpinnedNotes.map((note, index) => (
                <NoteCard 
                  key={note.id} 
                  note={note} 
                  user={user}
                  onUpdate={updateNote}
                  onDelete={deleteNote}
                  onTogglePin={togglePin}
                  onMoveUp={moveNoteUp}
                  onMoveDown={moveNoteDown}
                  onMoveToPosition={moveToPosition}
                  canMoveUp={index > 0}
                  canMoveDown={index < unpinnedNotes.length - 1}
                  totalInSection={unpinnedNotes.length}
                  currentPosition={index}
                  syncing={syncing}
                />
              ))}
            </div>
          </div>
        )}

        {/* Message si aucune note */}
        {notes.length === 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Edit3 className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl">Vos notes s'afficheront ici</p>
              <p className="text-sm mt-2">Créez votre première note !</p>
            </div>
          </div>
        )}

        {/* Message si recherche sans résultat */}
        {searchTerm && filteredNotes.length === 0 && notes.length > 0 && (
          <div className="text-center py-16">
            <div className="text-gray-400">
              <Search className="w-16 h-16 mx-auto mb-4" />
              <p className="text-xl">Aucune note trouvée</p>
              <p>Essayez un autre terme de recherche</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
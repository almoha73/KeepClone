// hooks/useNotes.js
import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  orderBy, 
  query, 
  where 
} from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

export function useNotes(user) {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

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
      const notesData = snapshot.docs.map(doc => {
        const data = doc.data();
        const note = {
          id: doc.id,
          ...data
        };
        
        // Debug: Vérifier les notes invalides
        if (!note.id || note.title === undefined) {
          console.warn('Invalid note from Firestore:', note);
        }
        
        return note;
      }).filter(note => note && note.id); // Filtrer les notes invalides
      
      setNotes(notesData);
      setLoading(false);
    }, (error) => {
      console.error('Erreur lors du chargement des notes:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

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

  // Épingler/désépingler une note
  const togglePin = async (id) => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const note = notes.find(n => n.id === id);
      if (!note) return;
      
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

  // Fonctions de réorganisation - VERSION CORRIGÉE
  // Elles reçoivent maintenant les listes triées en paramètre
  const moveNoteUp = async (noteId, sortedSectionNotes) => {
    const currentIndex = sortedSectionNotes.findIndex(n => n.id === noteId);
    
    if (currentIndex > 0) {
      // Échanger avec la note précédente
      const targetNote = sortedSectionNotes[currentIndex - 1];
      await swapNotes(noteId, targetNote.id);
    }
  };

  const moveNoteDown = async (noteId, sortedSectionNotes) => {
    const currentIndex = sortedSectionNotes.findIndex(n => n.id === noteId);
    
    if (currentIndex < sortedSectionNotes.length - 1) {
      // Échanger avec la note suivante
      const targetNote = sortedSectionNotes[currentIndex + 1];
      await swapNotes(noteId, targetNote.id);
    }
  };

  // Nouvelle fonction plus simple : échanger deux notes
  const swapNotes = async (noteId1, noteId2) => {
    setSyncing(true);
    try {
      const note1 = notes.find(n => n.id === noteId1);
      const note2 = notes.find(n => n.id === noteId2);
      
      if (!note1 || !note2) return;
      
      const now = Date.now();
      
      // Échanger les orderIndex
      const note1Order = note1.orderIndex || new Date(note1.createdAt || 0).getTime();
      const note2Order = note2.orderIndex || new Date(note2.createdAt || 0).getTime();
      
      // Mise à jour en parallèle
      await Promise.all([
        updateDoc(doc(db, 'notes', noteId1), {
          orderIndex: note2Order,
          updatedAt: new Date(now).toISOString()
        }),
        updateDoc(doc(db, 'notes', noteId2), {
          orderIndex: note1Order,
          updatedAt: new Date(now + 1).toISOString()
        })
      ]);
      
    } catch (error) {
      console.error('Erreur lors de l\'échange:', error);
      alert('Erreur lors du déplacement. Vérifiez votre connexion.');
    }
    setSyncing(false);
  };

  return {
    notes,
    loading,
    syncing,
    createNote,
    deleteNote,
    updateNote,
    togglePin,
    moveNoteUp,
    moveNoteDown
  };
}
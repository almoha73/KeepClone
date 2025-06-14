// hooks/useNotesFilter.js
import { useState, useMemo } from 'react';

export function useNotesFilter(notes) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer et trier les notes avec useMemo pour optimiser les performances
  const { filteredNotes, pinnedNotes, unpinnedNotes } = useMemo(() => {
    // Filtrer les notes selon le terme de recherche
    const filtered = notes.filter(note => {
      if (!note || !note.id) {
        console.warn('Filtering out invalid note:', note);
        return false;
      }
      
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

    // Trier par épinglage puis par orderIndex ou date de création
    const sorted = filtered.sort((a, b) => {
      if (!a || !b) {
        console.warn('Sorting with invalid notes:', { a, b });
        return 0;
      }
      
      // Les notes épinglées en premier
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // Dans la même section, trier par orderIndex ou date (COHÉRENT avec useNotes)
      const aOrder = a.orderIndex || new Date(a.createdAt || 0).getTime();
      const bOrder = b.orderIndex || new Date(b.createdAt || 0).getTime();
      // Ordre décroissant : plus récent/haut orderIndex en premier
      return bOrder - aOrder;
    });

    // Séparer les notes épinglées et non épinglées
    const pinned = sorted.filter(note => note && note.pinned);
    const unpinned = sorted.filter(note => note && !note.pinned);

    return {
      filteredNotes: sorted,
      pinnedNotes: pinned,
      unpinnedNotes: unpinned
    };
  }, [notes, searchTerm]);

  return {
    searchTerm,
    setSearchTerm,
    filteredNotes,
    pinnedNotes,
    unpinnedNotes
  };
}
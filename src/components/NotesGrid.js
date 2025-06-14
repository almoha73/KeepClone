// components/NotesGrid.js
import React from 'react';
import { Edit3, Search, Pin } from 'lucide-react';
import NoteCard from '@/components/NoteCard';

export default function NotesGrid({ 
  pinnedNotes, 
  unpinnedNotes, 
  user, 
  noteHandlers, 
  syncing,
  searchTerm,
  totalNotes
}) {
  const {
    onUpdate,
    onDelete,
    onTogglePin,
    onMoveUp,
    onMoveDown
  } = noteHandlers;

  // Aucune note du tout
  if (totalNotes === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 mb-4">
          <Edit3 className="w-16 h-16 mx-auto mb-4" />
          <p className="text-xl">Vos notes s&apos;afficheront ici</p>
          <p className="text-sm mt-2">Créez votre première note !</p>
        </div>
      </div>
    );
  }

  // Recherche sans résultat
  if (searchTerm && pinnedNotes.length === 0 && unpinnedNotes.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400">
          <Search className="w-16 h-16 mx-auto mb-4" />
          <p className="text-xl">Aucune note trouvée</p>
          <p>Essayez un autre terme de recherche</p>
        </div>
      </div>
    );
  }

  return (
    <div>
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
                onUpdate={onUpdate}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
                onMoveUp={(noteId) => onMoveUp(noteId, pinnedNotes)}
                onMoveDown={(noteId) => onMoveDown(noteId, pinnedNotes)}
                canMoveUp={index > 0}
                canMoveDown={index < pinnedNotes.length - 1}
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
                onUpdate={onUpdate}
                onDelete={onDelete}
                onTogglePin={onTogglePin}
                onMoveUp={(noteId) => onMoveUp(noteId, unpinnedNotes)}
                onMoveDown={(noteId) => onMoveDown(noteId, unpinnedNotes)}
                canMoveUp={index > 0}
                canMoveDown={index < unpinnedNotes.length - 1}
                syncing={syncing}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
// components/NoteCard.js
'use client';

import React, { useState, useEffect } from 'react';
import { Pin, Edit3, Trash2, Loader2, Download, FileText, Image as ImageIcon, Paperclip, X, ChevronUp, ChevronDown, MoreVertical } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export default function NoteCard({ 
  note, 
  onUpdate, 
  onDelete, 
  onTogglePin, 
  onMoveUp, 
  onMoveDown, 
  onMoveToPosition,
  canMoveUp, 
  canMoveDown, 
  totalInSection,
  currentPosition,
  syncing, 
  user 
}) {
  // Vérification de sécurité
  if (!note) {
    console.error('NoteCard: note is undefined');
    return null;
  }

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(note.title || '');
  const [editContent, setEditContent] = useState(note.content || '');
  const [editAttachments, setEditAttachments] = useState(note.attachments || []);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showPositionMenu, setShowPositionMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768 || 'ontouchstart' in window);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSave = async () => {
    if (editTitle !== note.title || editContent !== note.content || JSON.stringify(editAttachments) !== JSON.stringify(note.attachments)) {
      await onUpdate(note.id, { 
        title: editTitle, 
        content: editContent,
        attachments: editAttachments 
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(note.title || '');
    setEditContent(note.content || '');
    setEditAttachments(note.attachments || []);
    setIsEditing(false);
  };

  // Upload de fichiers en mode édition
  const handleFileUpload = async (files) => {
    if (!user || files.length === 0) return;
    
    setUploadingFiles(true);
    const uploadedFiles = [];
    
    try {
      for (const file of files) {
        const fileRef = ref(storage, `notes/${user.uid}/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        
        uploadedFiles.push({
          name: file.name,
          url: downloadURL,
          type: file.type,
          size: file.size,
          path: snapshot.ref.fullPath
        });
      }
      
      setEditAttachments(prev => [...prev, ...uploadedFiles]);
      
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload des fichiers.');
    }
    
    setUploadingFiles(false);
  };

  // Supprimer un fichier en mode édition
  const removeAttachment = async (attachment) => {
    try {
      const fileRef = ref(storage, attachment.path);
      await deleteObject(fileRef);
      
      setEditAttachments(prev => prev.filter(att => att.path !== attachment.path));
    } catch (error) {
      console.error('Erreur lors de la suppression du fichier:', error);
    }
  };

  const getFileIcon = (type) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div 
      className="relative bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 group"
      style={{ backgroundColor: note.color }}
      onMouseEnter={() => !isMobile && setShowActions(true)}
      onMouseLeave={() => {
        if (!isMobile) {
          setShowActions(false);
          setShowPositionMenu(false);
        }
      }}
      onTouchStart={() => isMobile && setShowActions(true)}
    >
      {/* Boutons de réorganisation (côté gauche) */}
      {!isEditing && (showActions || isMobile) && (
        <div className="absolute top-2 left-2 flex flex-col space-y-1">
          {/* Sur mobile, toujours montrer le menu principal */}
          {(canMoveUp || canMoveDown || totalInSection > 2) && (
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPositionMenu(!showPositionMenu);
                }}
                className={`p-1 text-white rounded-full transition-colors ${
                  isMobile 
                    ? 'bg-blue-600 hover:bg-blue-700' 
                    : 'bg-gray-800 hover:bg-purple-600'
                }`}
                title="Options de position"
                disabled={syncing}
              >
                <MoreVertical className="w-3 h-3" />
              </button>
              
              {/* Menu de position adaptatif */}
              {showPositionMenu && (
                <div className={`absolute bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px] ${
                  isMobile 
                    ? 'left-8 top-0' 
                    : 'left-8 top-0'
                }`}>
                  <div className="p-2 text-xs text-gray-500 border-b">
                    Position: {currentPosition + 1} / {totalInSection}
                  </div>
                  
                  {/* Déplacements rapides */}
                  {canMoveUp && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveUp(note.id);
                        setShowPositionMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ChevronUp className="w-4 h-4 mr-2" />
                      Monter d'une place
                    </button>
                  )}
                  
                  {canMoveDown && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveDown(note.id);
                        setShowPositionMenu(false);
                      }}
                      className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <ChevronDown className="w-4 h-4 mr-2" />
                      Descendre d'une place
                    </button>
                  )}
                  
                  {/* Séparateur si il y a des mouvements ET des positions */}
                  {(canMoveUp || canMoveDown) && totalInSection > 2 && (
                    <div className="border-t border-gray-200 my-1"></div>
                  )}
                  
                  {/* Positions spécifiques */}
                  {totalInSection > 2 && (
                    <>
                      {currentPosition !== 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveToPosition(note.id, 0);
                            setShowPositionMenu(false);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          📌 Placer en premier
                        </button>
                      )}
                      
                      {currentPosition !== totalInSection - 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMoveToPosition(note.id, totalInSection - 1);
                            setShowPositionMenu(false);
                          }}
                          className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          📍 Placer en dernier
                        </button>
                      )}
                      
                      {/* Positions intermédiaires (seulement si plus de 4 notes) */}
                      {totalInSection > 4 && (
                        <div className="border-t border-gray-200 my-1">
                          <div className="px-3 py-1 text-xs text-gray-500">Positions:</div>
                          {Array.from({ length: totalInSection }, (_, index) => {
                            if (index === 0 || index === totalInSection - 1 || index === currentPosition) {
                              return null; // Skip first, last, and current
                            }
                            return (
                              <button
                                key={index}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onMoveToPosition(note.id, index);
                                  setShowPositionMenu(false);
                                }}
                                className="block w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                              >
                                Position {index + 1}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                  
                  {/* Bouton fermer pour mobile */}
                  {isMobile && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPositionMenu(false);
                        setShowActions(false);
                      }}
                      className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 border-t border-gray-200"
                    >
                      ✕ Fermer
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Icônes d'action en haut à droite */}
      {!isEditing && (showActions || isMobile) && (
        <div className="absolute top-2 right-2 flex space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin(note.id);
            }}
            className={`p-1 text-white rounded-full transition-colors ${
              isMobile 
                ? 'bg-yellow-500 hover:bg-yellow-600' 
                : 'bg-gray-800 hover:bg-gray-700'
            }`}
            title={note.pinned ? "Désépingler" : "Épingler"}
            disabled={syncing}
          >
            <Pin className={`w-3 h-3 ${note.pinned ? 'fill-current text-yellow-200' : ''}`} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
              setShowActions(false);
              setShowPositionMenu(false);
            }}
            className={`p-1 text-white rounded-full transition-colors ${
              isMobile 
                ? 'bg-blue-500 hover:bg-blue-600' 
                : 'bg-gray-800 hover:bg-blue-600'
            }`}
            title="Modifier"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(note.id);
            }}
            className={`p-1 text-white rounded-full transition-colors ${
              isMobile 
                ? 'bg-red-500 hover:bg-red-600' 
                : 'bg-gray-800 hover:bg-red-600'
            }`}
            title="Supprimer"
            disabled={syncing}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Pin icon pour les notes épinglées (toujours visible si pas d'actions) */}
      {note.pinned && !showActions && !isMobile && (
        <Pin className="absolute top-2 right-2 w-4 h-4 text-yellow-500 fill-current" />
      )}

      <div className="p-4 pt-8">
        {isEditing ? (
          <div className="space-y-3">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full text-lg font-medium bg-transparent border-none outline-none resize-none text-gray-900 placeholder-gray-500"
              placeholder="Titre"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="w-full bg-transparent border-none outline-none resize-none min-h-[100px] text-gray-900 placeholder-gray-500"
              placeholder="Prendre une note..."
            />

            {/* Upload de fichiers en mode édition */}
            <div className="border-t pt-3">
              <div className="flex items-center space-x-2 mb-3">
                <label className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition-colors">
                  <Paperclip className="w-4 h-4 text-gray-600" />
                  <span className="text-sm text-gray-700">Ajouter des fichiers</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(Array.from(e.target.files))}
                    disabled={uploadingFiles}
                  />
                </label>
                {uploadingFiles && (
                  <div className="flex items-center space-x-1 text-blue-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Upload...</span>
                  </div>
                )}
              </div>

              {/* Affichage des fichiers en mode édition */}
              {editAttachments && editAttachments.length > 0 && (
                <div className="space-y-2 mb-3">
                  {editAttachments.map((attachment, index) => (
                    <div 
                      key={index} 
                      className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => window.open(attachment.url, '_blank')}
                    >
                      {getFileIcon(attachment.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">{attachment.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(attachment.url, '_blank');
                          }}
                          className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                          title="Ouvrir dans un nouvel onglet"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeAttachment(attachment);
                          }}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                          title="Supprimer le fichier"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={handleCancel}
                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                disabled={uploadingFiles}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-1"
                disabled={syncing || uploadingFiles}
              >
                {(syncing || uploadingFiles) && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Sauvegarder</span>
              </button>
            </div>
          </div>
        ) : (
          <div onClick={() => setIsEditing(true)} className="cursor-pointer">
            <h3 className="text-lg font-medium mb-2 text-gray-800">{note.title}</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
            
            {/* Affichage des fichiers attachés */}
            {note.attachments && note.attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {note.attachments.map((attachment, index) => (
                  <div 
                    key={index} 
                    className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(attachment.url, '_blank');
                    }}
                  >
                    {getFileIcon(attachment.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{attachment.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(attachment.size)}</p>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(attachment.url, '_blank');
                        }}
                        className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded"
                        title="Ouvrir dans un nouvel onglet"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {note.updatedAt && (
              <p className="text-xs text-gray-400 mt-2">
                Modifié {new Date(note.updatedAt).toLocaleDateString('fr-FR')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
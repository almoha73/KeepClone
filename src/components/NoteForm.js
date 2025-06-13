// components/NoteForm.js
'use client';

import React, { useState } from 'react';
import { Plus, Paperclip, Loader2, X, Download, FileText, Image as ImageIcon } from 'lucide-react';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '@/lib/firebase';

export default function NoteForm({ user, onCreateNote, syncing }) {
  const [isCreating, setIsCreating] = useState(false);
  const [newNote, setNewNote] = useState({ title: '', content: '', color: '#ffffff', attachments: [] });
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const colors = [
    '#ffffff', '#f8bbd9', '#e6c9a8', '#e8eaed', '#aecbfa', 
    '#d7aefb', '#fdcfe8', '#e8f0fe', '#fff3e0', '#f1f3f4'
  ];

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
      
      setNewNote(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...uploadedFiles]
      }));
      
    } catch (error) {
      console.error('Erreur lors de l\'upload:', error);
      alert('Erreur lors de l\'upload des fichiers.');
    }
    
    setUploadingFiles(false);
  };

  const removeAttachment = async (attachment) => {
    try {
      const fileRef = ref(storage, attachment.path);
      await deleteObject(fileRef);
      
      setNewNote(prev => ({
        ...prev,
        attachments: prev.attachments.filter(att => att.path !== attachment.path)
      }));
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

  const handleSubmit = async () => {
    if (newNote.title.trim() || newNote.content.trim()) {
      await onCreateNote(newNote);
      setNewNote({ title: '', content: '', color: '#ffffff', attachments: [] });
      setIsCreating(false);
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setNewNote({ title: '', content: '', color: '#ffffff', attachments: [] });
  };

  if (!isCreating) {
    return (
      <button
        onClick={() => setIsCreating(true)}
        className="flex items-center space-x-3 w-full max-w-2xl p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200 text-left text-gray-500"
      >
        <Plus className="w-5 h-5" />
        <span>Prendre une note...</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-4 max-w-2xl">
      <input
        type="text"
        placeholder="Titre"
        value={newNote.title}
        onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
        className="w-full text-lg font-medium mb-3 border-none outline-none resize-none text-gray-900 placeholder-gray-500"
      />
      <textarea
        placeholder="Prendre une note..."
        value={newNote.content}
        onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
        className="w-full border-none outline-none resize-none min-h-[100px] mb-4 text-gray-900 placeholder-gray-500"
      />
      
      {/* Sélecteur de couleurs */}
      <div className="flex space-x-2 mb-4">
        {colors.map(color => (
          <button
            key={color}
            onClick={() => setNewNote({ ...newNote, color })}
            className={`w-8 h-8 rounded-full border-2 ${
              newNote.color === color ? 'border-gray-400' : 'border-gray-200'
            }`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Upload de fichiers */}
      <div className="mb-4">
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

        {/* Affichage des fichiers attachés */}
        {newNote.attachments && newNote.attachments.length > 0 && (
          <div className="space-y-2">
            {newNote.attachments.map((attachment, index) => (
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

      {/* Boutons d'action */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={handleCancel}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
          disabled={syncing || uploadingFiles}
        >
          Annuler
        </button>
        <button
          onClick={handleSubmit}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center space-x-2"
          disabled={syncing || uploadingFiles}
        >
          {(syncing || uploadingFiles) && <Loader2 className="w-4 h-4 animate-spin" />}
          <span>Terminé</span>
        </button>
      </div>
    </div>
  );
}
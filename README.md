# 📝 Keep Clone

Une application de prise de notes moderne inspirée de Google Keep.

## ✨ Fonctionnalités

- 🔐 Authentification Firebase
- 📝 Création/édition/suppression de notes
- 📌 Épinglage et réorganisation
- 📁 Upload de fichiers
- 🔍 Recherche temps réel
- 📱 Interface responsive
- 🔄 Synchronisation hors ligne

## 🛠️ Stack technique

- **Next.js 14** + React 18
- **Firebase** (Auth, Firestore, Storage)
- **Tailwind CSS**
- **Hooks personnalisés**

## 🚀 Installation

```bash
# Cloner et installer
git clone https://github.com/almoha73/KeepClone.git
cd KeepClone
npm install

# Configuration Firebase
cp .env.example .env.local
# Ajouter vos clés Firebase

# Démarrer
npm run dev
```

## 📁 Architecture

```
src/
├── app/page.js              # Page principale (refactorisée)
├── components/              # Composants UI
│   ├── Header.js           # Header responsive
│   ├── NoteCard.js         # Carte de note
│   ├── NoteForm.js         # Formulaire
│   └── NotesGrid.js        # Grille des notes
├── hooks/                   # Logique métier
│   ├── useAuth.js          # Authentification
│   ├── useNotes.js         # CRUD notes
│   ├── useNotesFilter.js   # Recherche/tri
│   └── useOnlineStatus.js  # Statut réseau
└── lib/firebase.js         # Config Firebase
```

## 🧩 Hooks personnalisés

```javascript
// Authentification
const { user, authLoading, handleLogout } = useAuth();

// Gestion des notes
const { notes, createNote, updateNote, deleteNote } = useNotes(user);

// Recherche et tri
const { searchTerm, pinnedNotes, unpinnedNotes } = useNotesFilter(notes);

// Statut réseau
const { isOnline } = useOnlineStatus();
```

## 📱 Responsive

- **Mobile** : Header 2 lignes, boutons tactiles
- **Desktop** : Interface complète, grille adaptive

## 🔄 Refactoring effectué

✅ **Avant** : 1 fichier de 400 lignes  
✅ **Après** : 8 fichiers modulaires de 20-100 lignes chacun

- Code plus maintenable
- Logique métier séparée
- Composants réutilisables
- Bugs de position corrigés

---

**Développé avec Next.js + Firebase 🚀**
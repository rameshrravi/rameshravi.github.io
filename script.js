document.addEventListener('DOMContentLoaded', () => {
    const notesContainer = document.getElementById('notes-container');
    const newNoteBtn = document.getElementById('new-note-btn');
    const noteModal = document.getElementById('note-modal');
    const closeBtn = document.querySelector('.close-btn');
    const saveNoteBtn = document.getElementById('save-note-btn');
    const noteTitleInput = document.getElementById('note-title');
    const noteContentInput = document.getElementById('note-content');

    let editingNoteId = null;
    let db = null;

    // Initialize IndexedDB
    const initDB = () => {
        const request = indexedDB.open('NotesDB', 1);

        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            loadNotes();
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('notes')) {
                db.createObjectStore('notes', { keyPath: 'id' });
            }
        };
    };

    // Load notes from IndexedDB
    function loadNotes() {
        const transaction = db.transaction(['notes'], 'readonly');
        const objectStore = transaction.objectStore('notes');
        const request = objectStore.getAll();

        request.onsuccess = () => {
            notesContainer.innerHTML = '';
            const notes = request.result
                // Sort notes by timestamp, most recent first
                .sort((a, b) => b.timestamp - a.timestamp);
            
            if (notes.length === 0) {
                notesContainer.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-sticky-note"></i>
                        <p>No notes yet. Click "New Note" to get started!</p>
                    </div>
                `;
            } else {
                notes.forEach(note => createNoteElement(note));
            }
        };

        request.onerror = (event) => {
            console.error('Error loading notes:', event.target.error);
        };
    }

    // Create note element
    function createNoteElement(note) {
        const noteCard = document.createElement('div');
        noteCard.classList.add('note-card');
        noteCard.dataset.id = note.id;
        
        // Format timestamp
        const formattedDate = new Date(note.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        noteCard.innerHTML = `
            <h2>${note.title}</h2>
            <p>${note.content}</p>
            <div class="note-actions">
                <small class="note-timestamp">${formattedDate}</small>
                <div>
                    <button class="edit-note" title="Edit Note">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-note" title="Delete Note">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;

        // Edit note event
        noteCard.querySelector('.edit-note').addEventListener('click', () => {
            editingNoteId = note.id;
            noteTitleInput.value = note.title;
            noteContentInput.value = note.content;
            noteModal.style.display = 'flex';
        });

        // Delete note event
        noteCard.querySelector('.delete-note').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete this note?')) {
                deleteNote(note.id);
            }
        });

        notesContainer.appendChild(noteCard);
    }

    // Save note
    function saveNote() {
        const title = noteTitleInput.value.trim();
        const content = noteContentInput.value.trim();

        if (!title || !content) {
            alert('Please enter both a title and content for your note.');
            return;
        }

        const transaction = db.transaction(['notes'], 'readwrite');
        const objectStore = transaction.objectStore('notes');

        const note = {
            id: editingNoteId || Date.now().toString(),
            title,
            content,
            timestamp: Date.now()
        };

        const request = objectStore.put(note);

        request.onsuccess = () => {
            editingNoteId = null;
            loadNotes();
            closeModal();
        };

        request.onerror = (event) => {
            console.error('Error saving note:', event.target.error);
        };
    }

    // Delete note
    function deleteNote(id) {
        const transaction = db.transaction(['notes'], 'readwrite');
        const objectStore = transaction.objectStore('notes');
        const request = objectStore.delete(id);

        request.onsuccess = () => {
            loadNotes();
        };

        request.onerror = (event) => {
            console.error('Error deleting note:', event.target.error);
        };
    }

    // Open modal for new note
    function openModal() {
        editingNoteId = null;
        noteTitleInput.value = '';
        noteContentInput.value = '';
        noteModal.style.display = 'flex';
        noteTitleInput.focus();
    }

    // Close modal
    function closeModal() {
        noteModal.style.display = 'none';
    }

    // Event Listeners
    newNoteBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    saveNoteBtn.addEventListener('click', saveNote);

    // Close modal if clicked outside
    window.addEventListener('click', (event) => {
        if (event.target === noteModal) {
            closeModal();
        }
    });

    // Keyboard shortcuts
    window.addEventListener('keydown', (event) => {
        // Open new note modal with Ctrl+N
        if (event.ctrlKey && event.key === 'n') {
            event.preventDefault();
            openModal();
        }

        // Close modal with Escape key
        if (event.key === 'Escape') {
            closeModal();
        }
    });

    // Initialize IndexedDB and load notes
    initDB();
});

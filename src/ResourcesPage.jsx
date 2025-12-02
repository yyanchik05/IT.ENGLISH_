import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./contexts/AuthContext";

export default function ResourcesPage() {
  const { currentUser } = useAuth();
  const [notes, setNotes] = useState([]);
  const [term, setTerm] = useState("");
  const [definition, setDefinition] = useState("");
  const [loading, setLoading] = useState(true);

  // 1. Завантажуємо нотатки
  useEffect(() => {
    const fetchNotes = async () => {
      if (!currentUser) return;
      try {
        const q = query(collection(db, "user_notes"), where("userId", "==", currentUser.uid));
        const snapshot = await getDocs(q);
        const loadedNotes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setNotes(loadedNotes);
      } catch (error) { console.error(error); } 
      finally { setLoading(false); }
    };
    fetchNotes();
  }, [currentUser]);

  // 2. Додавання
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!term || !definition) return;
    try {
      const newNote = {
        userId: currentUser.uid,
        term: term,
        definition: definition,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, "user_notes"), newNote);
      setNotes([...notes, { id: docRef.id, ...newNote }]);
      setTerm(""); setDefinition("");
    } catch (error) { console.error(error); }
  };

  // 3. Видалення
  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "user_notes", id));
      setNotes(notes.filter(note => note.id !== id));
    } catch (error) { console.error(error); }
  };

  return (
    // ГОЛОВНИЙ КОНТЕЙНЕР (На весь екран)
    <div style={styles.pageWrapper}>
      
      {/* --- БОКОВЕ МЕНЮ (Activity Bar) --- */}
      <div style={styles.activityBar}>
         <div style={styles.activityTop}>
           <Link to="/" style={styles.activityIcon} title="Home">🏠</Link>
           {/* Активна іконка книжки */}
           <div style={styles.activityIconActive} title="Knowledge Base">📖</div>
         </div>
         <div style={styles.activityMiddle}>
           <Link to="/junior" style={styles.activityIcon}>J</Link>
           <Link to="/middle" style={styles.activityIcon}>M</Link>
           <Link to="/senior" style={styles.activityIcon}>S</Link>
         </div>
         <div style={styles.activityBottom}>
            <Link to="/leaderboard" style={styles.activityIcon}>🏆</Link>
            <Link to="/profile" style={styles.activityIcon}>👤</Link>
         </div>
      </div>

      {/* --- ЦЕНТРАЛЬНА ЧАСТИНА (Контент) --- */}
      <div style={styles.contentContainer}>
        <div style={styles.cardLayout}>
          
          {/* ЛІВА ПАНЕЛЬ: ПОСИЛАННЯ */}
          <div style={styles.sidebar}>
            <div style={styles.header}>
               <h2 style={{margin: 0, color: '#61dafb'}}>README.md</h2>
            </div>
            
            <div style={styles.section}>
              <h3 style={styles.subHeader}>// DOCUMENTATION</h3>
              <ul style={styles.linkList}>
                <li><a href="https://dictionary.cambridge.org/" target="_blank" style={styles.link}>Cambridge Dictionary ↗</a></li>
                <li><a href="https://www.powerthesaurus.org/" target="_blank" style={styles.link}>Power Thesaurus ↗</a></li>
                <li><a href="https://stackoverflow.com/" target="_blank" style={styles.link}>Stack Overflow ↗</a></li>
                <li><a href="https://github.com/git-guides" target="_blank" style={styles.link}>Git Guides ↗</a></li>
              </ul>
            </div>

            <div style={styles.section}>
              <h3 style={styles.subHeader}>// CHEAT SHEETS</h3>
              <div style={styles.cheatItem}><span style={{color: '#c678dd'}}>git commit</span> - save</div>
              <div style={styles.cheatItem}><span style={{color: '#c678dd'}}>git push</span> - upload</div>
              <div style={styles.cheatItem}><span style={{color: '#c678dd'}}>git pull</span> - download</div>
            </div>
          </div>

          {/* ПРАВА ПАНЕЛЬ: СЛОВНИК */}
          <div style={styles.mainContent}>
            <h2 style={{color: '#98c379', fontSize: '1.2rem', marginBottom: 20}}>
              const my_dictionary = [ ... ]
            </h2>

            <form onSubmit={handleAddNote} style={styles.form}>
              <input value={term} onChange={e => setTerm(e.target.value)} placeholder="Word" style={styles.input} />
              <input value={definition} onChange={e => setDefinition(e.target.value)} placeholder="Meaning" style={{...styles.input, flex: 2}} />
              <button type="submit" style={styles.addBtn}>push()</button>
            </form>

            <div style={styles.notesList}>
              {loading ? <div>Loading...</div> : notes.map(note => (
                <div key={note.id} style={styles.noteItem}>
                  <div style={{display: 'flex', gap: 10, alignItems: 'center'}}>
                    <span style={{color: '#e06c75', fontWeight: 'bold'}}>"{note.term}"</span>: 
                    <span style={{color: '#abb2bf'}}>"{note.definition}"</span>,
                  </div>
                  <button onClick={() => handleDelete(note.id)} style={styles.deleteBtn}>×</button>
                </div>
              ))}
              {notes.length === 0 && <div style={{color: '#555'}}>// Dictionary is empty.</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

const styles = {
  // Головний лейаут на весь екран
  pageWrapper: { display: 'flex', height: '100vh', backgroundColor: '#1e1e1e', overflow: 'hidden', fontFamily: '"JetBrains Mono", monospace' },
  
  // Стилі Activity Bar (ідентичні іншим сторінкам)
  activityBar: { width: '50px', backgroundColor: '#333333', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderRight: '1px solid #252526', zIndex: 10, flexShrink: 0 },
  activityTop: { display: 'flex', flexDirection: 'column', gap: 20 },
  activityMiddle: { display: 'flex', flexDirection: 'column', gap: 15 },
  activityBottom: { marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 15 },
  activityIcon: { fontSize: '1.2rem', cursor: 'pointer', opacity: 0.6, textDecoration: 'none', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '40px', height: '40px', borderRadius: '5px', transition: '0.2s' },
  activityIconActive: { fontSize: '1.2rem', cursor: 'pointer', opacity: 1, textDecoration: 'none', color: '#fff', borderLeft: '2px solid #fff', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#252526' },

  // Контейнер для контенту (центрування картки)
  contentContainer: { flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', overflowY: 'auto' },
  
  // Внутрішня картка (Словник + Посилання)
  cardLayout: { display: 'flex', width: '100%', maxWidth: '1000px', backgroundColor: '#252526', borderRadius: '10px', border: '1px solid #333', overflow: 'hidden', minHeight: '600px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  
  // Ліва панель всередині картки
  sidebar: { width: '300px', backgroundColor: '#21252b', borderRight: '1px solid #333', padding: '20px', display: 'flex', flexDirection: 'column' },
  header: { marginBottom: '30px' },
  section: { marginBottom: '30px' },
  subHeader: { color: '#5c6370', fontSize: '0.9rem', marginBottom: '15px' },
  linkList: { listStyle: 'none', padding: 0, margin: 0 },
  link: { display: 'block', padding: '8px 0', color: '#61dafb', textDecoration: 'none', transition: '0.2s' },
  cheatItem: { marginBottom: '8px', fontSize: '0.9rem', color: '#abb2bf' },

  // Права панель всередині картки
  mainContent: { flex: 1, padding: '40px', backgroundColor: '#282c34', display: 'flex', flexDirection: 'column' },
  form: { display: 'flex', gap: '10px', marginBottom: '30px' },
  input: { backgroundColor: '#1e1e1e', border: '1px solid #444', color: '#fff', padding: '10px', borderRadius: '4px', flex: 1, fontFamily: 'inherit' },
  addBtn: { backgroundColor: '#98c379', color: '#000', border: 'none', padding: '0 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
  notesList: { display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }, // Скрол для списку
  noteItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', backgroundColor: '#1e1e1e', borderRadius: '4px', borderLeft: '3px solid #c678dd' },
  deleteBtn: { background: 'none', border: 'none', color: '#5c6370', cursor: 'pointer', fontSize: '1.2rem' }
};
import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore'; // Додали query і where
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';

// Приймаємо specificLevel з App.jsx (наприклад, "junior")
function PracticePage({ specificLevel }) {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [output, setOutput] = useState("Ready to run...");
  const [loading, setLoading] = useState(true);
  
  // Стан для папок-категорій
  // Наприклад: { "Git Basics": true, "Error Messages": false }
  const [categoriesOpen, setCategoriesOpen] = useState({});

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        
        // 1. Робимо запит до бази: "Дай мені ТІЛЬКИ завдання цього рівня"
        const q = query(collection(db, "tasks"), where("level", "==", specificLevel));
        const querySnapshot = await getDocs(q);
        
        const loadedTasks = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          // Якщо в базі немає поля category, ставимо "General"
          category: doc.data().category || "General Modules" 
        }));
        
        setTasks(loadedTasks);

        // 2. Відкриваємо всі знайдені категорії за замовчуванням
        const uniqueCategories = [...new Set(loadedTasks.map(t => t.category))];
        const initialOpenState = {};
        uniqueCategories.forEach(cat => initialOpenState[cat] = true);
        setCategoriesOpen(initialOpenState);

        // 3. Відкриваємо перше завдання
        if (loadedTasks.length > 0) {
          setCurrentTask(loadedTasks[0]);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };

    fetchTasks();
  }, [specificLevel]); // Перезапускаємо, якщо змінився рівень

  const runCode = (selectedOption) => {
    if (!currentTask) return;
    if (selectedOption === currentTask.correct) {
      setOutput(`>> SUCCESS: Build passing.\n>> Output: "${currentTask['option_' + selectedOption]}"`);
    } else {
      setOutput(`>> ERROR: Runtime Exception.\n>> Expected logic for '${currentTask.correct}', but got '${selectedOption}'.`);
    }
  };

  const toggleCategory = (category) => {
    setCategoriesOpen(prev => ({ ...prev, [category]: !prev[category] }));
  };

  // Отримуємо список унікальних категорій для побудови меню
  const uniqueCategories = [...new Set(tasks.map(t => t.category))].sort();

  if (loading) return <div style={{padding: 20, color: 'white'}}>Loading {specificLevel.toUpperCase()} environment...</div>;

  return (
    <div style={styles.container}>
      {/* --- ЛІВА ПАНЕЛЬ (EXPLORER) --- */}
      <div style={styles.sidebar}>
        <div style={styles.explorerHeader}>EXPLORER: {specificLevel.toUpperCase()}_REPO</div>
        
        {tasks.length === 0 && <div style={{padding: 10, color: '#777'}}>No tasks yet.</div>}

        {/* Малюємо папки на основі КАТЕГОРІЙ */}
        {uniqueCategories.map(category => (
          <div key={category}>
            {/* Назва папки (Категорія) */}
            <div style={styles.folderHeader} onClick={() => toggleCategory(category)}>
              <span style={{ marginRight: 5 }}>{categoriesOpen[category] ? '📂' : '📁'}</span> 
              {category}
            </div>

            {/* Файли всередині категорії */}
            {categoriesOpen[category] && tasks
              .filter(t => t.category === category)
              .map(task => (
                <div 
                  key={task.id} 
                  onClick={() => { setCurrentTask(task); setOutput("Ready..."); }}
                  style={{ 
                    ...styles.fileItem,
                    backgroundColor: currentTask?.id === task.id ? '#37373d' : 'transparent',
                    color: currentTask?.id === task.id ? '#fff' : '#ccc'
                  }}
                >
                  <span style={{ marginRight: 5, marginLeft: 15 }}>📄</span> 
                  {task.title}.py
                </div>
            ))}
          </div>
        ))}
      </div>

      {/* --- ЦЕНТРАЛЬНА ЧАСТИНА --- */}
      <div style={styles.mainArea}>
        <div style={styles.tabsBar}>
          <div style={styles.activeTab}>
            📄 {currentTask ? `${currentTask.title}.py` : 'Select a file'}
          </div>
        </div>
        
        <div style={styles.editor}>
          {currentTask ? (
            <div style={{ flex: 1, display: 'flex' }}>
              <div style={{ color: '#666', marginRight: 10, textAlign: 'right', userSelect: 'none' }}>
                1<br/>2<br/>3<br/>4<br/>5<br/>6
              </div>
              <div style={{ flex: 1 }}>
                <SyntaxHighlighter 
                  language="python" 
                  style={atomOneDark} 
                  customStyle={{ background: 'transparent', margin: 0, padding: 0, fontSize: '14px' }}
                >
                  {currentTask.code || "# No code provided"}
                </SyntaxHighlighter>
              </div>
            </div>
          ) : <div style={{padding: 20, color: '#777'}}>// Select a task from the sidebar</div>}
        </div>

        {/* Панель кнопок (підтримка 4 варіантів) */}
        <div style={styles.actionPanel}>
          <div style={{ marginBottom: 10, color: '#888' }}>// TODO: Choose the correct variable assignment</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            
            <button onClick={() => runCode('a')} style={styles.button} disabled={!currentTask}>
              A: "{currentTask?.option_a || '...'}"
            </button>
            <button onClick={() => runCode('b')} style={styles.button} disabled={!currentTask}>
              B: "{currentTask?.option_b || '...'}"
            </button>
            
            {currentTask?.option_c && (
              <button onClick={() => runCode('c')} style={styles.button} disabled={!currentTask}>
                C: "{currentTask?.option_c}"
              </button>
            )}
            {currentTask?.option_d && (
              <button onClick={() => runCode('d')} style={styles.button} disabled={!currentTask}>
                D: "{currentTask?.option_d}"
              </button>
            )}
          </div>
        </div>

        <div style={styles.terminal}>
          <div style={styles.terminalHeader}>
            <span style={{ marginRight: 15, borderBottom: '1px solid white' }}>TERMINAL</span>
          </div>
          <pre style={{ color: output.includes('SUCCESS') ? '#4caf50' : (output.includes('ERROR') ? '#ff5252' : '#ccc'), fontFamily: 'monospace', margin: 0 }}>
            {output}
          </pre>
        </div>

        <div style={styles.statusBar}>
          <div style={styles.statusItem}>Branch: {specificLevel}*</div>
          <div style={styles.statusItem}>UTF-8</div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#1e1e1e', color: '#d4d4d4', fontFamily: 'Consolas, monospace', overflow: 'hidden' },
  sidebar: { width: '250px', backgroundColor: '#252526', borderRight: '1px solid #1e1e1e', display: 'flex', flexDirection: 'column' },
  explorerHeader: { padding: '10px 20px', fontSize: '0.7rem', fontWeight: 'bold', color: '#bbb' },
  folderHeader: { padding: '5px 10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.9rem', color: '#e0e0e0', display: 'flex', alignItems: 'center' },
  fileItem: { padding: '3px 10px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', transition: '0.2s' },
  mainArea: { flex: 1, display: 'flex', flexDirection: 'column' },
  tabsBar: { backgroundColor: '#2d2d2d', height: '35px', display: 'flex', alignItems: 'flex-end' },
  activeTab: { backgroundColor: '#1e1e1e', padding: '8px 15px', fontSize: '0.85rem', borderTop: '1px solid #007acc', color: '#fff' },
  editor: { flex: 1, padding: '20px', backgroundColor: '#1e1e1e', display: 'flex', overflow: 'auto' },
  actionPanel: { padding: '10px 20px', backgroundColor: '#1e1e1e', borderTop: '1px solid #333' },
  button: { padding: '8px 15px', backgroundColor: '#0e639c', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '0.85rem', borderRadius: '2px', textAlign: 'left' },
  terminal: { height: '150px', backgroundColor: '#1e1e1e', borderTop: '1px solid #333', padding: '10px', overflow: 'auto' },
  terminalHeader: { fontSize: '0.75rem', marginBottom: '10px', display: 'flex', cursor: 'pointer' },
  statusBar: { height: '22px', backgroundColor: '#007acc', display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '0.75rem', color: 'white', justifyContent: 'space-between' },
  statusItem: { marginRight: '15px' }
};

export default PracticePage;
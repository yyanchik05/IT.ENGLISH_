import { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useSearchParams, Link } from 'react-router-dom';

function PracticePage({ specificLevel }) {
  const [tasks, setTasks] = useState([]);
  const [currentTask, setCurrentTask] = useState(null);
  const [output, setOutput] = useState("Ready to run...");
  const [loading, setLoading] = useState(true);
  const [categoriesOpen, setCategoriesOpen] = useState({});
  const [userInputValue, setUserInputValue] = useState("");
  const [selectedFragments, setSelectedFragments] = useState([]);
  
  // Хук для роботи з URL
  const [searchParams, setSearchParams] = useSearchParams();

  // --- ЕФЕКТ 1: ТІЛЬКИ ЗАВАНТАЖЕННЯ ДАНИХ ---
  // Запускається лише коли змінюється РІВЕНЬ (junior/middle/senior)
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, "tasks"), where("level", "==", specificLevel));
        const querySnapshot = await getDocs(q);
        
        const loadedTasks = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          category: doc.data().category || "General Modules" 
        }));
        
        setTasks(loadedTasks);
        
        // Відкриваємо категорії
        const uniqueCategories = [...new Set(loadedTasks.map(t => t.category))];
        const initialOpenState = {};
        uniqueCategories.forEach(cat => initialOpenState[cat] = true);
        setCategoriesOpen(initialOpenState);
        
        setLoading(false);
      } catch (error) {
        console.error("Error:", error);
        setLoading(false);
      }
    };
    fetchTasks();
  }, [specificLevel]); // <--- ВАЖЛИВО: Тут немає searchParams!

  // --- ЕФЕКТ 2: СИНХРОНІЗАЦІЯ З URL ---
  // Запускається, коли завантажились TASKS або змінився URL
  useEffect(() => {
    if (tasks.length === 0) return;

    const taskIdFromUrl = searchParams.get("task");

    if (taskIdFromUrl) {
      // Якщо в URL є ID, шукаємо це завдання
      const foundTask = tasks.find(t => t.id === taskIdFromUrl);
      if (foundTask && foundTask.id !== currentTask?.id) {
        setCurrentTask(foundTask);
      }
    } else {
      // Якщо в URL пусто, відкриваємо перше завдання і ТИХО пишемо його в URL
      if (!currentTask) {
        const firstTask = tasks[0];
        setCurrentTask(firstTask);
        setSearchParams({ task: firstTask.id }, { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, searchParams]); // Слідкуємо за задачами та URL

  // Очищення полів при зміні завдання
  useEffect(() => {
    setUserInputValue("");
    setSelectedFragments([]);
    setOutput("Ready to run...");
  }, [currentTask]);

  const runCode = (answerToCheck) => {
    if (!currentTask) return;
    
    let finalAnswer = "";
    if (currentTask.type === 'builder') {
      finalAnswer = selectedFragments.join(' ');
    } else {
      finalAnswer = answerToCheck || userInputValue;
    }
    
    const cleanAnswer = (finalAnswer || "").toString().toLowerCase().trim();
    const cleanCorrect = (currentTask.correct || "").toString().toLowerCase().trim();

    if (cleanAnswer === cleanCorrect) {
      setOutput(`>> BUILD SUCCESSFUL [0.5s]\n>> Result: "${finalAnswer}"`);
    } else {
      setOutput(`>> FATAL ERROR: LogicException.\n>> The argument '${finalAnswer}' caused a runtime error.\n>> Please review the syntax and try again.\n>> Process finished with exit code 1.`);
    }
  };

  const toggleCategory = (category) => {
    setCategoriesOpen(prev => ({ ...prev, [category]: !prev[category] }));
  };

  const handleFragmentClick = (word) => setSelectedFragments([...selectedFragments, word]);
  const handleUndoFragment = () => setSelectedFragments(selectedFragments.slice(0, -1));

  const uniqueCategories = [...new Set(tasks.map(t => t.category))].sort();

 const renderCodeEditor = () => {
    if (!currentTask) return null;

    // 1. Рахуємо загальну кількість рядків у коді (для нумерації)
    const totalLines = (currentTask.code || '').split('\n').length;

    // 2. Визначаємо, що саме малювати справа (Контент)
    let content = null;

    // СЦЕНАРІЙ: INPUT MODE
    if (currentTask.type === 'input' && currentTask.code.includes('____')) {
      const lines = currentTask.code.split('\n');
      const inputLineIndex = lines.findIndex(line => line.includes('____'));
      
      const codeBefore = lines.slice(0, inputLineIndex).join('\n'); // Код до рядка з інпутом
      const targetLine = lines[inputLineIndex];                     // Сам рядок з інпутом
      const codeAfter = lines.slice(inputLineIndex + 1).join('\n'); // Код після

      const parts = targetLine.split('____');

      content = (
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
          {/* Блок коду зверху */}
          {codeBefore && (
            <SyntaxHighlighter language="python" style={atomOneDark} customStyle={styles.blockCode}>
              {codeBefore}
            </SyntaxHighlighter>
          )}

          {/* РЯДОК З ІНПУТОМ (Жорстка висота 22.5px, щоб не стрибало) */}
          <div style={styles.inputRow}>
            {/* Ліва частина тексту */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
               <SyntaxHighlighter language="python" style={atomOneDark} customStyle={styles.inlineCode}>
                 {parts[0]}
               </SyntaxHighlighter>
            </div>
            
            {/* Інпут */}
            <input
              type="text"
              value={userInputValue}
              onChange={(e) => setUserInputValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') runCode(); }}
              style={styles.inlineInput}
              autoFocus
              placeholder="..."
            />
            
            {/* Права частина тексту */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
               <SyntaxHighlighter language="python" style={atomOneDark} customStyle={styles.inlineCode}>
                 {parts[1] || ""}
               </SyntaxHighlighter>
            </div>
          </div>

          {/* Блок коду знизу */}
          {codeAfter && (
            <SyntaxHighlighter language="python" style={atomOneDark} customStyle={styles.blockCode}>
              {codeAfter}
            </SyntaxHighlighter>
          )}
        </div>
      );
    
    // СЦЕНАРІЙ: BUILDER MODE
    } else if (currentTask.type === 'builder' && currentTask.code.includes('____')) {
        const parts = currentTask.code.split('____');
        const constructedString = selectedFragments.join(' ');
        
        content = (
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', fontFamily: '"JetBrains Mono", monospace', fontSize: '15px', lineHeight: '1.5' }}>
             <SyntaxHighlighter language="python" style={atomOneDark} customStyle={styles.inlineCode}>{parts[0]}</SyntaxHighlighter>
             <div style={styles.builderArea}>{constructedString || <span style={{opacity: 0.3}}>...</span>}</div>
             <SyntaxHighlighter language="python" style={atomOneDark} customStyle={styles.inlineCode}>{parts[1] || ""}</SyntaxHighlighter>
             {selectedFragments.length > 0 && <button onClick={handleUndoFragment} style={styles.undoBtn} title="Undo">⌫</button>}
          </div>
        );

    // СЦЕНАРІЙ: ЗВИЧАЙНИЙ РЕЖИМ
    } else {
        content = (
            <SyntaxHighlighter 
              language="python" 
              style={atomOneDark} 
              customStyle={{ background: 'transparent', margin: 0, padding: 0, fontSize: '15px', lineHeight: '1.5' }}
              showLineNumbers={false}
            >
              {currentTask.code || "# Code missing"}
            </SyntaxHighlighter>
        );
    }

    // 3. ПОВЕРТАЄМО СПІЛЬНУ ОБГОРТКУ (Нумерація + Контент)
    return (
       <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start' }}>
          {/* Стовпчик з цифрами (ЗАВЖДИ ЗЛІВА) */}
          <div style={styles.lineNumbers}>
            {Array.from({length: totalLines}, (_, i) => i + 1).map(n => (
              <div key={n} style={{ height: '22.5px', lineHeight: '22.5px' }}>{n}</div>
            ))}
          </div>

          {/* Область коду */}
          <div style={{ flex: 1, paddingLeft: 10 }}>
            {content}
          </div>
        </div>
    );
  };

  const renderActionPanel = () => {
    if (!currentTask) return null;

    if (currentTask.type === 'input') return <button onClick={() => runCode()} style={styles.runButton}>▶ EXECUTE SCRIPT</button>;

    if (currentTask.type === 'builder') {
        const safeFragments = Array.isArray(currentTask.fragments) ? currentTask.fragments : [];
        return (
          <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
             <div style={{color: '#888', fontSize: '0.8rem'}}>// Click fragments to build the f-string:</div>
             {safeFragments.length === 0 && <div style={{color: 'orange', fontSize: '0.8rem'}}>⚠ Error: No fragments found. Check Firebase.</div>}
             <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
               {safeFragments.map((word, index) => (
                 <button key={index} onClick={() => handleFragmentClick(word)} style={styles.fragmentBtn}>{word}</button>
               ))}
             </div>
             <button onClick={() => runCode()} style={{...styles.runButton, marginTop: 10}}>▶ VERIFY STRING</button>
          </div>
        )
    }

    return (
        <div style={styles.gridOptions}>
          <button onClick={() => runCode('a')} style={styles.optionBtn}>var a = "{currentTask?.option_a}"</button>
          <button onClick={() => runCode('b')} style={styles.optionBtn}>var b = "{currentTask?.option_b}"</button>
          {currentTask?.option_c && <button onClick={() => runCode('c')} style={styles.optionBtn}>var c = "{currentTask.option_c}"</button>}
          {currentTask?.option_d && <button onClick={() => runCode('d')} style={styles.optionBtn}>var d = "{currentTask.option_d}"</button>}
        </div>
    );
  }

  if (loading) return <div style={styles.loadingScreen}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.activityBar}>
         <div style={styles.activityTop}><Link to="/" style={styles.activityIcon}>🏠</Link></div>
         <div style={styles.activityMiddle}>
           <Link to="/junior" style={specificLevel === 'junior' ? styles.activityIconActive : styles.activityIcon}>J</Link>
           <Link to="/middle" style={specificLevel === 'middle' ? styles.activityIconActive : styles.activityIcon}>M</Link>
           <Link to="/senior" style={specificLevel === 'senior' ? styles.activityIconActive : styles.activityIcon}>S</Link>
         </div>
         <div style={styles.activityBottom}>⚙️</div>
      </div>

      <div style={styles.sidebar}>
        <div style={styles.explorerHeader}>EXPLORER</div>
        <div style={styles.projectTitle}>∨ PROJECT [{specificLevel.toUpperCase()}]</div>
        <div style={styles.fileTree}>
          {uniqueCategories.map(category => (
            <div key={category}>
              <div style={styles.folderHeader} onClick={() => toggleCategory(category)}>
                <span style={{ marginRight: 6 }}>{categoriesOpen[category] ? 'v' : '>'}</span> 
                {category}
              </div>
              {categoriesOpen[category] && tasks.filter(t => t.category === category).map(task => (
                  <div key={task.id} 
                       onClick={() => { 
                         setCurrentTask(task);
                         setSearchParams({ task: task.id }); 
                       }} 
                       style={{...styles.fileItem, backgroundColor: currentTask?.id === task.id ? '#37373d' : 'transparent', color: currentTask?.id === task.id ? '#fff' : '#999', borderLeft: currentTask?.id === task.id ? '2px solid #61dafb' : '2px solid transparent'}}>
                    <span style={{marginRight: 0, marginLeft: 18, color: '#61dafb', opacity: 0.8}}>py.</span> {task.title}
                  </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div style={styles.mainArea}>
        <div style={styles.tabsBar}>
           <div style={styles.activeTab}><span style={{marginRight: 8, color: '#61dafb'}}>py</span> {currentTask ? `${currentTask.title}.py` : 'No File'}</div>
        </div>
        <div style={styles.editor}>{renderCodeEditor()}</div>
        <div style={styles.actionPanel}>
          <div style={styles.debugHeader}>
             <span>{currentTask?.type === 'input' ? 'MANUAL MODE' : (currentTask?.type === 'builder' ? 'CONSTRUCTOR MODE' : 'DEBUG CONSOLE')}</span>
          </div>
          {renderActionPanel()}
        </div>
        <div style={styles.terminal}>
          <div style={{marginBottom: 5, color: '#aaa', fontSize: '0.8rem', borderBottom: '1px solid #333'}}>OUTPUT</div>
          <pre style={{ color: output.includes('SUCCESS') ? '#4caf50' : (output.includes('ERROR') ? '#ff5252' : '#ccc'), fontFamily: 'monospace', margin: 0 }}>{output}</pre>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', height: '100vh', backgroundColor: '#1e1e1e', color: '#cccccc', fontFamily: '"JetBrains Mono", "Fira Code", monospace', overflow: 'hidden' },
  loadingScreen: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#1e1e1e', color: '#fff' },
  
  // --- Activity Bar & Sidebar ---
  activityBar: { width: '50px', backgroundColor: '#333333', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderRight: '1px solid #252526', zIndex: 10 },
  activityTop: { display: 'flex', flexDirection: 'column', gap: 20 },
  activityMiddle: { display: 'flex', flexDirection: 'column', gap: 15 },
  activityBottom: { marginBottom: 10 },
  activityIcon: { fontSize: '1.2rem', cursor: 'pointer', opacity: 0.6, textDecoration: 'none', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center', width: '40px', height: '40px', borderRadius: '5px', transition: '0.2s' },
  activityIconActive: { fontSize: '1.2rem', cursor: 'pointer', opacity: 1, textDecoration: 'none', color: '#fff', borderLeft: '2px solid #fff', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#252526' },
  sidebar: { width: '250px', backgroundColor: '#252526', display: 'flex', flexDirection: 'column' },
  explorerHeader: { padding: '10px 20px', fontSize: '0.7rem', letterSpacing: '1px', color: '#bbb', display: 'flex', justifyContent: 'space-between' },
  projectTitle: { padding: '5px 20px', fontSize: '0.75rem', fontWeight: 'bold', color: '#61dafb', textTransform: 'uppercase' },
  fileTree: { marginTop: 5, overflowY: 'auto', flex: 1 },
  folderHeader: { padding: '4px 20px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.85rem', display: 'flex', alignItems: 'center' },
  fileItem: { padding: '4px 20px', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', transition: 'background 0.1s' },
  
  // --- Main Area ---
  mainArea: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1e1e1e' },
  tabsBar: { backgroundColor: '#252526', height: '35px', display: 'flex', alignItems: 'flex-start', overflowX: 'auto' },
  activeTab: { backgroundColor: '#1e1e1e', padding: '8px 15px', fontSize: '0.85rem', borderTop: '1px solid #61dafb', color: '#fff', minWidth: '120px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  
  // --- Editor Area (ОНОВЛЕНО) ---
  editor: { flex: 1, padding: '20px', backgroundColor: '#1e1e1e', display: 'flex', overflow: 'auto' },
  
  lineNumbers: { 
    color: '#444', 
    marginRight: 0, // Прибрали відступ, щоб лінія була рівною
    paddingRight: '15px', // Додали внутрішній відступ
    textAlign: 'right', 
    userSelect: 'none', 
    fontSize: '15px', 
    lineHeight: '1.5', 
    width: '40px', // Трохи ширше
    borderRight: '1px solid #333' // Вертикальна лінія розділення
  },

  // Новий стиль для звичайних блоків коду
  blockCode: { 
    background: 'transparent', 
    margin: 0, 
    padding: 0, 
    fontSize: '15px', 
    lineHeight: '1.5' 
  },

  // Новий стиль для рядка з інпутом (щоб він не стрибав)
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    height: '22.5px', // Жорстка висота (15px * 1.5)
    overflow: 'hidden'
  },

  // Оновлений стиль для частин коду в рядку з інпутом
  inlineCode: { 
    background: 'transparent', 
    margin: 0, 
    padding: 0, 
    display: 'inline-block' 
  },

  // Оновлений інпут
  inlineInput: { 
    backgroundColor: 'transparent', 
    border: 'none', 
    borderBottom: '1px solid #61dafb', 
    color: '#fff', 
    fontFamily: 'inherit', 
    fontSize: '15px', 
    width: '120px', 
    textAlign: 'center', 
    outline: 'none', 
    margin: '0 5px',
    height: '20px', // Висота тексту
    lineHeight: '20px'
  },

  // --- Panels & Buttons ---
  actionPanel: { padding: '15px', backgroundColor: '#1e1e1e', borderTop: '1px solid #333' },
  debugHeader: { fontSize: '0.75rem', color: '#aaa', marginBottom: 10, display: 'flex', justifyContent: 'space-between' },
  gridOptions: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 },
  optionBtn: { padding: '10px', backgroundColor: '#2d2d2d', border: '1px solid #444', color: '#ccc', cursor: 'pointer', borderRadius: '4px', textAlign: 'left', fontFamily: 'inherit', fontSize: '0.9rem', transition: '0.2s' },
  terminal: { height: '120px', backgroundColor: '#1e1e1e', borderTop: '1px solid #333', padding: '10px 15px', overflow: 'auto' },
  runButton: { backgroundColor: '#238636', color: '#fff', border: '1px solid rgba(240,246,252,0.1)', borderRadius: '6px', padding: '8px 20px', fontWeight: '600', cursor: 'pointer', width: '100%' },
  
  // --- Builder Mode Styles ---
  builderArea: { borderBottom: '1px dashed #61dafb', minWidth: '100px', margin: '0 5px', color: '#98c379', padding: '0 5px', cursor: 'pointer' },
  fragmentBtn: { backgroundColor: '#3e4451', border: '1px solid #565c64', color: '#abb2bf', padding: '6px 12px', borderRadius: '15px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '0.9rem', transition: '0.2s' },
  undoBtn: { background: 'transparent', border: 'none', color: '#e06c75', cursor: 'pointer', fontSize: '1.2rem', marginLeft: 10 }
};

export default PracticePage;
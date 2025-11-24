import { useState, useEffect } from "react";
import { useAuth } from "./contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "./firebase";

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [contributions, setContributions] = useState({}); // { "2023-11-25": 5 }

  // Завантажуємо історію активності
  useEffect(() => {
    const fetchActivity = async () => {
      if (!currentUser) return;
      const q = query(collection(db, "user_progress"), where("userId", "==", currentUser.uid));
      const snapshot = await getDocs(q);
      
      const activityMap = {};
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        // Рахуємо кількість завдань на кожну дату
        if (activityMap[data.date]) {
            activityMap[data.date]++;
        } else {
            activityMap[data.date] = 1;
        }
      });
      setContributions(activityMap);
    };
    fetchActivity();
  }, [currentUser]);

  async function handleLogout() {
    try {
      await logout();
      navigate("/login");
    } catch (error) { console.error(error); }
  }

  // Генеруємо останні 60 днів
  const renderContributionGraph = () => {
    const days = [];
    for (let i = 59; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        const count = contributions[dateStr] || 0;
        
        // Колір залежить від кількості завдань
        let bg = '#161b22'; // Empty
        if (count > 0) bg = '#0e4429'; // 1 task
        if (count > 2) bg = '#006d32'; // 3 tasks
        if (count > 5) bg = '#26a641'; // 5+ tasks
        if (count > 8) bg = '#39d353'; // Super active

        days.push(
            <div key={dateStr} title={`${dateStr}: ${count} tasks`} style={{
                width: '12px', 
                height: '12px', 
                backgroundColor: bg, 
                borderRadius: '2px'
            }}></div>
        );
    }
    return days;
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={{margin: 0, color: '#61dafb'}}>USER_CONFIG</h2>
          <Link to="/" style={styles.closeBtn}>×</Link>
        </div>

        <div style={styles.codeBlock}>
          <div style={styles.row}><span style={styles.key}>"email":</span> <span style={styles.string}>"{currentUser?.email}"</span>,</div>
          <div style={styles.row}><span style={styles.key}>"uid":</span> <span style={styles.string}>"{currentUser?.uid}"</span>,</div>
          <div style={styles.row}><span style={styles.key}>"role":</span> <span style={styles.string}>"Developer"</span></div>
        </div>

        {/* --- GITHUB STYLE GRAPH --- */}
        <div style={{marginBottom: 30}}>
            <div style={{fontSize: '0.8rem', color: '#888', marginBottom: 10}}>CONTRIBUTION GRAPH (Last 60 Days)</div>
            <div style={{
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '4px', 
                maxWidth: '300px' // Щоб вони переносились у рядки
            }}>
                {renderContributionGraph()}
            </div>
        </div>

        <div style={styles.actions}>
          <Link to="/junior" style={styles.backBtn}>← Back to Code</Link>
          <button onClick={handleLogout} style={styles.logoutBtn}>System.exit(0)</button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1e1e1e', color: '#fff', fontFamily: '"JetBrains Mono", monospace' },
  card: { backgroundColor: '#252526', padding: '30px', borderRadius: '10px', width: '100%', maxWidth: '500px', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' },
  closeBtn: { textDecoration: 'none', color: '#888', fontSize: '1.5rem', fontWeight: 'bold' },
  codeBlock: { backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '5px', marginBottom: '30px', border: '1px solid #333' },
  row: { marginBottom: '10px', fontSize: '0.9rem' },
  key: { color: '#e06c75', marginRight: '10px' },
  string: { color: '#98c379' },
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { color: '#61dafb', textDecoration: 'none', fontSize: '0.9rem' },
  logoutBtn: { backgroundColor: '#e06c75', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }
};
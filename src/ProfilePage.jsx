import { useAuth } from "./contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function ProfilePage() {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    try {
      await logout();
      navigate("/login"); // Після виходу кидаємо на логін
    } catch (error) {
      console.error("Failed to log out", error);
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={{margin: 0, color: '#61dafb'}}>USER_CONFIG</h2>
          <Link to="/" style={styles.closeBtn}>×</Link>
        </div>

        <div style={styles.codeBlock}>
          <div style={styles.row}>
            <span style={styles.key}>"email":</span> 
            <span style={styles.string}>"{currentUser?.email}"</span>,
          </div>
          <div style={styles.row}>
            <span style={styles.key}>"uid":</span> 
            <span style={styles.string}>"{currentUser?.uid}"</span>,
          </div>
          <div style={styles.row}>
            <span style={styles.key}>"status":</span> 
            <span style={styles.boolean}>true</span>,
          </div>
          <div style={styles.row}>
            <span style={styles.key}>"role":</span> 
            <span style={styles.string}>"Developer"</span>
          </div>
        </div>

        <div style={styles.actions}>
          <Link to="/junior" style={styles.backBtn}>← Back to Code</Link>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            System.exit(0)
          </button>
        </div>
      </div>
    </div>
  );
}

// Стилі (Темна тема, схожа на JSON файл)
const styles = {
  container: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#1e1e1e', color: '#fff', fontFamily: '"JetBrains Mono", monospace' },
  card: { backgroundColor: '#252526', padding: '30px', borderRadius: '10px', width: '100%', maxWidth: '500px', border: '1px solid #333', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #333', paddingBottom: '10px' },
  closeBtn: { textDecoration: 'none', color: '#888', fontSize: '1.5rem', fontWeight: 'bold' },
  codeBlock: { backgroundColor: '#1e1e1e', padding: '20px', borderRadius: '5px', marginBottom: '30px', border: '1px solid #333' },
  row: { marginBottom: '10px', fontSize: '0.9rem' },
  key: { color: '#e06c75', marginRight: '10px' }, // Red
  string: { color: '#98c379' }, // Green
  boolean: { color: '#d19a66' }, // Orange
  actions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { color: '#61dafb', textDecoration: 'none', fontSize: '0.9rem' },
  logoutBtn: { backgroundColor: '#e06c75', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold' }
};
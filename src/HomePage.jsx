import { Link } from 'react-router-dom';

function HomePage() {
  return (
    <div style={styles.container}>
      
      {/* --- НАВІГАЦІЯ (Sticky Menu) --- */}
      <nav style={styles.navbar}>
        <div style={styles.logo}>IT.ENGLISH_</div>
        <div style={styles.navLinks}>
          <span style={styles.link}>Features</span>
          <span style={styles.link}>Pricing</span>
          <Link to="/practice" style={styles.ctaButtonSmall}>Start Coding</Link>
        </div>
      </nav>

      {/* --- HERO SECTION (На весь екран) --- */}
      <div style={styles.heroSection}>
        {/* Затінення фото, щоб текст читався */}
        <div style={styles.overlay}></div>
        
        <div style={styles.content}>
          <h1 style={styles.title}>
            Don't just learn English.<br />
            <span style={{ color: '#61dafb' }}>Debug it.</span>
          </h1>
          <p style={styles.subtitle}>
            The first English learning platform designed like your favorite IDE. 
            Master technical vocabulary, Git commands, and soft skills simulations.
          </p>
          
          <Link to="/practice" style={styles.mainButton}>
            Launch Terminal_ 
          </Link>
        </div>
      </div>

    </div>
  );
}

// --- СТИЛІ ---
const styles = {
  container: { fontFamily: "'Inter', sans-serif", color: 'white', margin: 0, padding: 0 },
  navbar: {
    position: 'fixed', top: 0, width: '100%', height: '80px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '0 50px', boxSizing: 'border-box', zIndex: 100,
    background: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(10px)', // Ефект скла
    borderBottom: '1px solid rgba(255,255,255,0.1)'
  },
  logo: { fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '-1px' },
  navLinks: { display: 'flex', gap: '30px', alignItems: 'center' },
  link: { cursor: 'pointer', color: '#ccc', fontSize: '0.9rem' },
  ctaButtonSmall: {
    padding: '8px 20px', background: '#61dafb', color: '#000', textDecoration: 'none',
    fontWeight: 'bold', borderRadius: '4px', fontSize: '0.9rem'
  },
  heroSection: {
    height: '100vh', width: '100%',
    backgroundImage: 'url("https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2070&auto=format&fit=crop")', // Фото коду
    backgroundSize: 'cover', backgroundPosition: 'center',
    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative'
  },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)' },
  content: { position: 'relative', zIndex: 2, textAlign: 'center', maxWidth: '800px', padding: '20px' },
  title: { fontSize: '4rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '20px' },
  subtitle: { fontSize: '1.2rem', color: '#ccc', marginBottom: '40px', lineHeight: '1.6' },
  mainButton: {
    padding: '15px 40px', fontSize: '1.2rem', background: '#007acc', color: 'white',
    textDecoration: 'none', borderRadius: '5px', fontWeight: 'bold',
    boxShadow: '0 0 20px rgba(0, 122, 204, 0.5)', border: '1px solid #61dafb'
  }
};

export default HomePage;
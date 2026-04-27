import { useState, useEffect } from 'react';
import AvatarWorld from './AvatarWorld';

export default function App() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showGame, setShowGame] = useState(false);

  useEffect(() => {
    // Check if already running as an app
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
      setShowGame(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const enterFullScreenAndLock = () => {
    const element = document.documentElement;
    if (element.requestFullscreen) {
      element.requestFullscreen().then(() => {
        if (screen.orientation && screen.orientation.lock) {
          screen.orientation.lock('landscape').catch(err => console.log("Orientation lock blocked"));
        }
      });
    }
  };

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback if prompt isn't available but they clicked anyway
      setShowGame(true);
      enterFullScreenAndLock();
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowGame(true);
    }
  };

  // If they are already in the app, or they clicked "Start"
  if (showGame) {
    return <AvatarWorld />;
  }

  return (
    <div style={landingStyle}>
      <div style={containerStyle}>
        <h1 style={logoStyle}>DEAD-SECTOR</h1>
        <div style={dividerStyle} />
        <p style={taglineStyle}>URBAN COMBAT PROTOCOL v8.0</p>
        
        <div style={buttonGroup}>
          {deferredPrompt && (
            <button onClick={handleInstallClick} style={installBtnStyle}>
              INSTALL SECTOR
            </button>
          )}
          
          <button 
            onClick={() => { setShowGame(true); enterFullScreenAndLock(); }} 
            style={secondaryBtnStyle}
          >
            ENTER AS GUEST
          </button>
        </div>

        <p style={footerStyle}>OPTIMIZED FOR LANDSCAPE VIEWPORT</p>
      </div>
    </div>
  );
}

// ---------------- STYLES ----------------

const landingStyle = {
  width: '100vw',
  height: '100vh',
  background: 'radial-gradient(circle, #031a00 0%, #000000 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: '"Courier New", Courier, monospace',
  color: 'white',
  overflow: 'hidden'
};

const containerStyle = {
  textAlign: 'center',
  padding: '40px',
  border: '1px solid #300',
  background: 'rgba(0,0,0,0.8)',
  boxShadow: '0 0 50px rgba(255,0,0,0.1)'
};

const logoStyle = {
  color: '#ff0000',
  fontSize: '3.5rem',
  margin: 0,
  letterSpacing: '8px',
  textShadow: '3px 3px 0px #300'
};

const dividerStyle = {
  height: '2px',
  background: 'linear-gradient(90deg, transparent, red, transparent)',
  margin: '20px 0'
};

const taglineStyle = {
  fontSize: '0.9rem',
  letterSpacing: '3px',
  color: '#888',
  marginBottom: '40px'
};

const buttonGroup = {
  display: 'flex',
  flexDirection: 'column',
  gap: '15px',
  alignItems: 'center'
};

const installBtnStyle = {
  padding: '15px 40px',
  background: '#ff0000',
  color: 'white',
  border: 'none',
  fontWeight: 'bold',
  cursor: 'pointer',
  fontSize: '1rem',
  letterSpacing: '2px',
  width: '250px',
  clipPath: 'polygon(10% 0, 100% 0, 90% 100%, 0% 100%)' // Angled GTA-style button
};

const secondaryBtnStyle = {
  ...installBtnStyle,
  background: 'transparent',
  border: '1px solid #500',
  color: '#888'
};

const footerStyle = {
  marginTop: '40px',
  fontSize: '0.7rem',
  color: '#444',
  letterSpacing: '1px'
};
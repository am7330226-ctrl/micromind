/**
 * App.jsx — Root component. Manages auth gating and assembles all panels.
 */

import './index.css';
import { AppStateProvider, useAuth } from './store.jsx';
import { useToast } from './hooks/useToast.js';
import Header from './components/Header.jsx';
import BrainDump from './components/BrainDump.jsx';
import EisenhowerMatrix from './components/EisenhowerMatrix.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import AuthModal from './components/AuthModal.jsx';

function AppInner() {
  const { auth, login, logout } = useAuth();
  const { toasts, showToast } = useToast();

  // Show auth screen if no token
  if (!auth.token) {
    return <AuthModal onAuthSuccess={login} />;
  }

  return (
    <div className="app-wrapper">
      <Header userName={auth.name} onLogout={logout} />
      <main className="app-main">
        <div className="column-left">
          <BrainDump showToast={showToast} />
        </div>
        <EisenhowerMatrix showToast={showToast} />
      </main>
      <ToastContainer toasts={toasts} />
    </div>
  );
}

export default function App() {
  return (
    <AppStateProvider>
      <AppInner />
    </AppStateProvider>
  );
}

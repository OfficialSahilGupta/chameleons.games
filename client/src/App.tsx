import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import Lobby from './pages/Lobby';
import Admin from './pages/Admin';
import Room from './pages/Room';

function App() {
  const { token, user } = useAuthStore();

  return (
    <Routes>
      <Route 
        path="/" 
        element={token ? <Navigate to="/lobby" replace /> : <Login />} 
      />
      <Route 
        path="/lobby" 
        element={token ? <Lobby /> : <Navigate to="/" replace />} 
      />
      <Route 
        path="/admin" 
        element={token && user?.isAdmin ? <Admin /> : <Navigate to="/lobby" replace />} 
      />
      <Route 
        path="/room/:code" 
        element={token ? <Room /> : <Navigate to="/" replace />} 
      />
    </Routes>
  );
}

export default App;

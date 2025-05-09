import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import VoicePage from './pages/VoicePage';
import MemoryPage from './pages/MemoryPage'; // <-- Importar a nova página
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 font-sans flex flex-col">
      <AuthProvider className="flex-grow flex flex-col">
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatPage />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/voice"
            element={
              <ProtectedRoute>
                <VoicePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/memory"
            element={
              <ProtectedRoute>
                <MemoryPage /> {/* <-- Rota protegida para memória */}
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </div>
  );
}

export default App;

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ChatProvider } from './contexts/ChatContext';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import VoicePage from './pages/VoicePage';
import MemoryPage from './pages/MemoryPage';
import CreateProfilePage from './pages/CreateProfilePage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 font-sans flex flex-col">
      <AuthProvider>
        <ChatProvider>
          <Routes>
            {/* Quando o usuário acessa a raiz "/", mandamos para login */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<CreateProfilePage />} />

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
                  <MemoryPage />
                </ProtectedRoute>
              }
            />

            {/* fallback para rotas não existentes */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ChatProvider>
      </AuthProvider>
    </div>
  );
}

export default App;

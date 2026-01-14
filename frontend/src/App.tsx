import React, { useState, useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { stagecraftTheme } from './styles/theme';
import StagingPage from './pages/StagingPage';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import SimpleHeader from './components/SimpleHeader';
import NewProjectModal from './components/NewProjectModal';
import LandingPage from './pages/LandingPage';
import AuthSuccess from './pages/AuthSuccess';
import AuthError from './pages/AuthError';
import { authApi } from './services/api';
import { User } from './types';
import './styles/globals.css';
import '@mantine/core/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
});

const AppShell: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newProjectModalOpen, setNewProjectModalOpen] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<File | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string | undefined>(undefined);
  const navigate = useNavigate();

  // Restore session on app load
  useEffect(() => {
    const restoreSession = async () => {
      const existingToken = localStorage.getItem('authToken');
      if (!existingToken) return;

      // Try to restore user from localStorage first (faster initial render)
      const cachedUser = localStorage.getItem('user');
      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch (e) {
          // Invalid cached user, continue to fetch from API
        }
      }

      // Validate token with backend
      try {
        const userData = await authApi.me();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (err) {
        // Token is invalid or expired
        console.log('Session expired, clearing auth data');
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
      }
    };

    restoreSession();
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setAuthModalOpen(false);

    // Navigate to staging page after login
    navigate('/staging');

    // If there was a pending generation, proceed with it
    if (pendingGeneration) {
      setPendingGeneration(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    authApi.logout();
    setSidebarOpen(false);
  };

  const handleGenerationRequest = (imageFile: File) => {
    if (!user) {
      // Save the pending generation and show auth modal
      setPendingGeneration(imageFile);
      setAuthModalOpen(true);
      return false; // Don't proceed with generation
    }
    return true; // Proceed with generation
  };

  const handleNewProject = () => {
    // Open the new project modal
    setNewProjectModalOpen(true);
  };

  const handleProjectCreated = (projectId: string) => {
    setCurrentProjectId(projectId);
    setSidebarOpen(false);
  };

  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    setSidebarOpen(false);
  };

  return (
    <>
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              user={user}
              onLoginClick={() => setAuthModalOpen(true)}
              onSignupClick={() => setAuthModalOpen(true)}
              onLaunchClick={() => navigate('/staging')}
            />
          }
        />
        <Route
          path="/staging"
          element={
            <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <SimpleHeader
                user={user}
                onLogin={() => setAuthModalOpen(true)}
                onLogout={handleLogout}
                onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
              />

              <main style={{ flex: 1 }}>
                <StagingPage
                  onGenerationRequest={handleGenerationRequest}
                  user={user}
                  currentProjectId={currentProjectId}
                />
              </main>

              <Sidebar
                opened={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
                user={user}
                onNewProject={handleNewProject}
                currentProjectId={currentProjectId}
                onSelectProject={handleSelectProject}
              />
            </div>
          }
        />
        <Route path="/auth/success" element={<AuthSuccess onLogin={handleLogin} />} />
        <Route path="/auth/error" element={<AuthError />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <AuthModal
        opened={authModalOpen}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingGeneration(null);
        }}
        onLogin={handleLogin}
      />

      <NewProjectModal
        opened={newProjectModalOpen}
        onClose={() => setNewProjectModalOpen(false)}
        onProjectCreated={handleProjectCreated}
      />
    </>
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={stagecraftTheme}>
        <Notifications position="top-right" />
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { stagecraftTheme } from './styles/theme';
import StagingPage from './pages/StagingPage';
import AuthModal from './components/AuthModal';
import Sidebar from './components/Sidebar';
import SimpleHeader from './components/SimpleHeader';
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

// Mock user state
interface User {
  id: string;
  name: string;
  email: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState<File | null>(null);
  const [currentProjectId, setCurrentProjectId] = useState<string>('current');

  // Handle OAuth callback on app load
  useEffect(() => {
    const handleAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const error = urlParams.get('error');
      
      if (token) {
        // Store token and fetch user data
        localStorage.setItem('authToken', token);
        
        try {
          const response = await fetch('http://localhost:8000/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
            // Clear URL params
            window.history.replaceState({}, document.title, '/');
          }
        } catch (err) {
          console.error('Failed to fetch user data:', err);
          localStorage.removeItem('authToken');
        }
      } else if (error) {
        console.error('OAuth error:', error);
        // Clear URL params
        window.history.replaceState({}, document.title, '/');
      }

      // Check for existing token on app load
      const existingToken = localStorage.getItem('authToken');
      if (existingToken && !user) {
        try {
          const response = await fetch('http://localhost:8000/auth/me', {
            headers: {
              'Authorization': `Bearer ${existingToken}`
            }
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            localStorage.removeItem('authToken');
          }
        } catch (err) {
          localStorage.removeItem('authToken');
        }
      }
    };

    handleAuthCallback();
  }, []);


  const handleLogin = (userData: User) => {
    setUser(userData);
    setAuthModalOpen(false);
    
    // If there was a pending generation, proceed with it
    if (pendingGeneration) {
      setPendingGeneration(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
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
    // Auto-create a new project context
    const newProjectId = `proj-${Date.now()}`;
    setCurrentProjectId(newProjectId);
    setSidebarOpen(false);
  };

  const handleSelectProject = (projectId: string) => {
    setCurrentProjectId(projectId);
    setSidebarOpen(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <MantineProvider theme={stagecraftTheme}>
        <Notifications position="top-right" />
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
          
          <AuthModal
            opened={authModalOpen}
            onClose={() => {
              setAuthModalOpen(false);
              setPendingGeneration(null);
            }}
            onLogin={handleLogin}
          />
        </div>
      </MantineProvider>
    </QueryClientProvider>
  );
}

export default App;
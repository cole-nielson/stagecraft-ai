import React, { useEffect } from 'react';
import { Container, Center, Stack, Text, Loader } from '@mantine/core';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface AuthSuccessProps {
  onLogin: (user: any) => void;
}

const AuthSuccess: React.FC<AuthSuccessProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const token = searchParams.get('token');
    
    if (token) {
      // Store token
      localStorage.setItem('authToken', token);
      
      // Fetch user info with the token
      fetch('http://localhost:8000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => response.json())
      .then(userData => {
        onLogin(userData);
        navigate('/staging');
      })
      .catch(error => {
        console.error('Failed to fetch user data:', error);
        navigate('/auth/error?error=Failed to fetch user data');
      });
    } else {
      navigate('/auth/error?error=No token provided');
    }
  }, [searchParams, onLogin, navigate]);

  return (
    <Container size="sm" py="xl">
      <Center style={{ minHeight: '60vh' }}>
        <Stack align="center" gap="lg">
          <Loader size="lg" color="warmGold" />
          <Text size="lg" fw={500} c="charcoal">
            Completing sign in...
          </Text>
          <Text size="sm" c="dimmed" ta="center">
            Please wait while we redirect you to your dashboard.
          </Text>
        </Stack>
      </Center>
    </Container>
  );
};

export default AuthSuccess;
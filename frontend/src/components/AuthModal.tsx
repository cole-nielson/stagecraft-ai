import React, { useState } from 'react';
import { Modal, Text, Button, TextInput, Stack, Group, Tabs, Alert, Divider } from '@mantine/core';
import { IconMail, IconLock, IconUser, IconInfoCircle, IconBrandGoogle, IconAlertCircle } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { authApi, API_BASE_URL } from '../services/api';
import { User } from '../types';

interface AuthModalProps {
  opened: boolean;
  onClose: () => void;
  onLogin: (user: User) => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ opened, onClose, onLogin }) => {
  const [activeTab, setActiveTab] = useState<string | null>('signin');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setName('');
    setError(null);
  };

  const handleSignIn = async () => {
    if (!email || !password) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.login(email, password);

      // Store token and user in localStorage
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      onLogin(response.user);
      resetForm();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Login failed. Please check your credentials.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!email || !password || !name) return;

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authApi.register(email, password, name);

      // Store token and user in localStorage
      localStorage.setItem('authToken', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      onLogin(response.user);
      resetForm();
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Registration failed. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setError(null);
    // Redirect to backend Google OAuth endpoint
    window.location.href = authApi.getGoogleAuthUrl();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <div>
          <Text size="xl" fw={600} c="charcoal">
            Welcome to StageCraft
          </Text>
          <Text size="sm" c="dimmed" mt="xs">
            Sign in to save your projects and access your staging library
          </Text>
        </div>
      }
      size="md"
      centered
      padding="xl"
    >
      <Stack gap="lg">
        {/* Error Alert */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            title="Error"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Google OAuth Button */}
        <Button
          onClick={handleGoogleLogin}
          loading={isLoading}
          size="md"
          fullWidth
          variant="outline"
          leftSection={<IconBrandGoogle size={20} />}
          style={{
            borderColor: '#4285f4',
            color: '#4285f4',
          }}
        >
          Continue with Google
        </Button>

        <Divider label="or" labelPosition="center" />

        {/* Auth Tabs */}
        <Tabs value={activeTab} onChange={setActiveTab}>
          <Tabs.List grow>
            <Tabs.Tab value="signin">Sign In</Tabs.Tab>
            <Tabs.Tab value="signup">Sign Up</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="signin" pt="lg">
            <Stack gap="md">
              <TextInput
                label="Email"
                placeholder="your@email.com"
                leftSection={<IconMail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
              />
              
              <TextInput
                label="Password"
                placeholder="••••••••"
                type="password"
                leftSection={<IconLock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
              />

              <Button
                onClick={handleSignIn}
                loading={isLoading}
                disabled={!email || !password}
                size="md"
                fullWidth
                style={{
                  background: 'linear-gradient(135deg, var(--warm-gold) 0%, #D4AF37 100%)',
                  border: 'none',
                }}
              >
                Sign In
              </Button>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="signup" pt="lg">
            <Stack gap="md">
              <TextInput
                label="Full Name"
                placeholder="John Doe"
                leftSection={<IconUser size={16} />}
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                required
              />

              <TextInput
                label="Email"
                placeholder="your@email.com"
                leftSection={<IconMail size={16} />}
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
              />
              
              <TextInput
                label="Password"
                placeholder="••••••••"
                type="password"
                leftSection={<IconLock size={16} />}
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
              />

              <Button
                onClick={handleSignUp}
                loading={isLoading}
                disabled={!email || !password || !name}
                size="md"
                fullWidth
                style={{
                  background: 'linear-gradient(135deg, var(--warm-gold) 0%, #D4AF37 100%)',
                  border: 'none',
                }}
              >
                Create Account
              </Button>

              <Text size="xs" c="dimmed" ta="center">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </Text>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Modal>
  );
};

export default AuthModal;
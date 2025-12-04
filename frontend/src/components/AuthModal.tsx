import React, { useState } from 'react';
import { Modal, Text, Button, TextInput, Stack, Group, Tabs, Alert, Divider } from '@mantine/core';
import { IconMail, IconLock, IconUser, IconInfoCircle, IconBrandGoogle } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string;
  email: string;
}

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

  const handleDemoLogin = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const demoUser: User = {
        id: 'demo-user-1',
        name: 'Demo User',
        email: 'demo@stagecraft.ai'
      };
      
      onLogin(demoUser);
      setIsLoading(false);
      
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
    }, 1000);
  };

  const handleSignIn = () => {
    if (!email || !password) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const user: User = {
        id: 'user-' + Date.now(),
        name: email.split('@')[0],
        email: email
      };
      
      onLogin(user);
      setIsLoading(false);
      
      // Reset form
      setEmail('');
      setPassword('');
    }, 1000);
  };

  const handleSignUp = () => {
    if (!email || !password || !name) return;
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const user: User = {
        id: 'user-' + Date.now(),
        name: name,
        email: email
      };
      
      onLogin(user);
      setIsLoading(false);
      
      // Reset form
      setEmail('');
      setPassword('');
      setName('');
    }, 1000);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Redirect to backend Google OAuth endpoint
    window.location.href = 'http://localhost:8000/auth/google';
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
        {/* Demo Login CTA */}
        <Alert
          icon={<IconInfoCircle size={16} />}
          color="blue"
          variant="light"
          title="Try it now!"
        >
          <Text size="sm" mb="sm">
            Use our demo account to explore all features instantly
          </Text>
          <Button
            variant="light"
            color="blue"
            size="sm"
            onClick={handleDemoLogin}
            loading={isLoading}
            fullWidth
          >
            Continue with Demo Account
          </Button>
        </Alert>

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
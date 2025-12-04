import React from 'react';
import { Container, Center, Stack, Text, Button, Alert } from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthError: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const error = searchParams.get('error') || 'An unknown error occurred';

  return (
    <Container size="sm" py="xl">
      <Center style={{ minHeight: '60vh' }}>
        <Stack align="center" gap="lg" maw={400}>
          <Alert
            icon={<IconAlertTriangle size={24} />}
            title="Authentication Failed"
            color="red"
            variant="light"
            style={{ width: '100%' }}
          >
            <Text size="sm">
              {error}
            </Text>
          </Alert>
          
          <Text size="sm" c="dimmed" ta="center">
            There was a problem signing you in. Please try again or contact support if the issue persists.
          </Text>

          <Button
            onClick={() => navigate('/')}
            size="md"
            style={{
              background: 'linear-gradient(135deg, var(--warm-gold) 0%, #D4AF37 100%)',
              border: 'none',
            }}
          >
            Return to Homepage
          </Button>
        </Stack>
      </Center>
    </Container>
  );
};

export default AuthError;
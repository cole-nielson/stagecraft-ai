import React from 'react';
import { Group, Button, Text, Menu, Avatar, UnstyledButton, ActionIcon } from '@mantine/core';
import { IconUser, IconLogout, IconMenu2 } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  name: string;
  email: string;
}

interface SimpleHeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onToggleSidebar: () => void;
}

const SimpleHeader: React.FC<SimpleHeaderProps> = ({
  user,
  onLogin,
  onLogout,
  onToggleSidebar,
}) => {
  return (
    <header
      style={{
        background: 'var(--pure-white)',
        borderBottom: '1px solid var(--light-gray)',
        padding: '12px 24px',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(10px)',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
      }}
    >
      <Group justify="space-between" align="center">
        {/* Left side - Sidebar toggle and Logo */}
        <Group gap="md">
          <ActionIcon
            variant="subtle"
            color="gray"
            size="lg"
            onClick={() => {
              console.log('Sidebar toggle clicked!');
              onToggleSidebar();
            }}
            style={{ 
              borderRadius: '8px',
              background: 'rgba(255, 0, 0, 0.1)', // Temporary red background for visibility
            }}
          >
            <IconMenu2 size={20} />
          </ActionIcon>

          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Group gap="xs">
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, var(--warm-gold) 0%, #D4AF37 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: 600,
                }}
              >
                ✨
              </div>
              <div>
                <Text
                  size="lg"
                  fw={700}
                  c="charcoal"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    background: 'linear-gradient(135deg, var(--sage-navy) 0%, var(--warm-gold) 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  StageCraft
                </Text>
              </div>
            </Group>
          </motion.div>
        </Group>

        {/* User Actions */}
        <Group gap="md">
          {user ? (
            /* User Menu */
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <UnstyledButton
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: 'rgba(201, 169, 97, 0.1)',
                    border: '1px solid rgba(201, 169, 97, 0.3)',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Group gap="xs">
                    <Avatar size="sm" color="warmGold" radius="sm">
                      {user.name.charAt(0).toUpperCase()}
                    </Avatar>
                    <div>
                      <Text size="sm" fw={500} c="charcoal">
                        {user.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {user.email}
                      </Text>
                    </div>
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconLogout size={16} />}
                  onClick={onLogout}
                  color="red"
                >
                  Sign Out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          ) : (
            /* Guest Actions */
            <Group gap="sm">
              <Button
                variant="subtle"
                onClick={onLogin}
                size="sm"
                color="sageNavy"
              >
                Sign In
              </Button>
              <Button
                variant="filled"
                onClick={onLogin}
                size="sm"
                style={{
                  background: 'linear-gradient(135deg, var(--warm-gold) 0%, #D4AF37 100%)',
                  border: 'none',
                }}
              >
                Sign Up Free
              </Button>
            </Group>
          )}
        </Group>
      </Group>
    </header>
  );
};

export default SimpleHeader;
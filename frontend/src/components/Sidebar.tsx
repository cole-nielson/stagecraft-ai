import React, { useState } from 'react';
import { Drawer, Stack, Text, Button, Card, Group, ActionIcon, Badge, ScrollArea, UnstyledButton, Menu, Divider } from '@mantine/core';
import { IconPlus, IconFolder, IconTrash, IconEdit, IconDotsVertical, IconCalendar, IconPhoto, IconX, IconChevronRight } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

interface User {
  id: string;
  name: string;
  email: string;
}

interface Generation {
  id: string;
  name: string;
  originalImage?: string;
  stagedImage?: string;
  createdAt: Date;
  status: 'processing' | 'completed' | 'failed';
}

interface Project {
  id: string;
  name: string;
  generations: Generation[];
  createdAt: Date;
  updatedAt: Date;
}

interface SidebarProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
  onNewProject: () => void;
  currentProjectId?: string;
  onSelectProject: (projectId: string) => void;
}

// Mock data
const getMockProjects = (): Project[] => [
  {
    id: 'current',
    name: 'Current Project',
    generations: [
      {
        id: 'gen-1',
        name: 'Living Room Staging',
        originalImage: 'https://picsum.photos/400/300?random=1',
        stagedImage: 'https://picsum.photos/400/300?random=2',
        createdAt: new Date('2024-01-15T10:30:00'),
        status: 'completed',
      },
      {
        id: 'gen-2',
        name: 'Kitchen Update',
        originalImage: 'https://picsum.photos/400/300?random=3',
        createdAt: new Date('2024-01-15T11:15:00'),
        status: 'processing',
      }
    ],
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: 'proj-1',
    name: 'Downtown Condo',
    generations: [
      {
        id: 'gen-3',
        name: 'Master Bedroom',
        originalImage: 'https://picsum.photos/400/300?random=4',
        stagedImage: 'https://picsum.photos/400/300?random=5',
        createdAt: new Date('2024-01-14T14:20:00'),
        status: 'completed',
      },
      {
        id: 'gen-4',
        name: 'Guest Room',
        originalImage: 'https://picsum.photos/400/300?random=6',
        stagedImage: 'https://picsum.photos/400/300?random=7',
        createdAt: new Date('2024-01-14T15:45:00'),
        status: 'completed',
      }
    ],
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
  },
  {
    id: 'proj-2',
    name: 'Luxury Villa',
    generations: [
      {
        id: 'gen-5',
        name: 'Main Living Area',
        originalImage: 'https://picsum.photos/400/300?random=8',
        stagedImage: 'https://picsum.photos/400/300?random=9',
        createdAt: new Date('2024-01-13T09:30:00'),
        status: 'completed',
      }
    ],
    createdAt: new Date('2024-01-13'),
    updatedAt: new Date('2024-01-13'),
  }
];

const Sidebar: React.FC<SidebarProps> = ({ 
  opened, 
  onClose, 
  user, 
  onNewProject, 
  currentProjectId = 'current',
  onSelectProject 
}) => {
  const [projects, setProjects] = useState<Project[]>(getMockProjects());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set(['current']));

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const createNewProject = () => {
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: `New Project ${projects.length}`,
      generations: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setProjects([newProject, ...projects]);
    onSelectProject(newProject.id);
    onNewProject();
  };

  const deleteProject = (projectId: string) => {
    setProjects(projects.filter(p => p.id !== projectId));
  };

  if (!user) {
    return (
      <Drawer
        opened={opened}
        onClose={onClose}
        size="320px"
        position="left"
        title={null}
        withCloseButton={false}
        styles={{
          content: {
            background: 'var(--off-white)',
          }
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            textAlign: 'center',
          }}
        >
          <Stack gap="lg">
            <Text size="lg" fw={500} c="dimmed">
              Sign in to save your projects
            </Text>
            <Text size="sm" c="dimmed">
              Create an account to access your staging history and organize projects
            </Text>
          </Stack>
        </div>
      </Drawer>
    );
  }

  return (
    <Drawer
      opened={opened}
      onClose={onClose}
      size="320px"
      position="left"
      title={null}
      withCloseButton={false}
      styles={{
        content: {
          background: 'var(--off-white)',
        }
      }}
    >
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--light-gray)',
            background: 'var(--pure-white)',
          }}
        >
          <Group justify="space-between">
            <div>
              <Text size="lg" fw={600} c="charcoal">
                My Projects
              </Text>
              <Text size="xs" c="dimmed">
                {user.name}
              </Text>
            </div>
            <ActionIcon
              variant="subtle"
              color="gray"
              onClick={onClose}
              size="sm"
            >
              <IconX size={16} />
            </ActionIcon>
          </Group>
        </div>

        {/* New Project Button */}
        <div style={{ padding: '16px 20px', background: 'var(--pure-white)' }}>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={createNewProject}
            fullWidth
            size="sm"
            style={{
              background: 'linear-gradient(135deg, var(--warm-gold) 0%, #D4AF37 100%)',
              border: 'none',
            }}
          >
            New Project
          </Button>
        </div>

        {/* Projects List */}
        <ScrollArea style={{ flex: 1, padding: '0 20px' }}>
          <Stack gap="xs" py="md">
            {projects.map((project) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  padding="sm"
                  radius="md"
                  style={{
                    background: currentProjectId === project.id 
                      ? 'rgba(201, 169, 97, 0.1)' 
                      : 'var(--pure-white)',
                    border: currentProjectId === project.id 
                      ? '1px solid rgba(201, 169, 97, 0.3)'
                      : '1px solid var(--light-gray)',
                    cursor: 'pointer',
                  }}
                >
                  <Stack gap="xs">
                    {/* Project Header */}
                    <Group justify="space-between" align="flex-start">
                      <UnstyledButton
                        onClick={() => toggleProject(project.id)}
                        style={{ flex: 1, textAlign: 'left' }}
                      >
                        <Group gap="xs">
                          <motion.div
                            animate={{ rotate: expandedProjects.has(project.id) ? 90 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <IconChevronRight size={14} color="var(--warm-gray)" />
                          </motion.div>
                          <div style={{ flex: 1 }}>
                            <Text size="sm" fw={500} c="charcoal" lineClamp={1}>
                              {project.name}
                            </Text>
                            <Group gap="xs" mt="2px">
                              <Text size="xs" c="dimmed">
                                {project.generations.length} generation{project.generations.length !== 1 ? 's' : ''}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {formatTime(project.updatedAt)}
                              </Text>
                            </Group>
                          </div>
                        </Group>
                      </UnstyledButton>

                      {project.id !== 'current' && (
                        <Menu shadow="md" width={160}>
                          <Menu.Target>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="xs"
                            >
                              <IconDotsVertical size={12} />
                            </ActionIcon>
                          </Menu.Target>

                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => onSelectProject(project.id)}
                            >
                              Open
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => deleteProject(project.id)}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      )}
                    </Group>

                    {/* Generations List */}
                    <AnimatePresence>
                      {expandedProjects.has(project.id) && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Stack gap="xs" pl="lg">
                            {project.generations.length > 0 ? (
                              project.generations.map((generation) => (
                                <div
                                  key={generation.id}
                                  style={{
                                    padding: '8px',
                                    background: 'rgba(201, 169, 97, 0.05)',
                                    borderRadius: '6px',
                                    border: '1px solid rgba(201, 169, 97, 0.1)',
                                  }}
                                >
                                  <Group gap="xs" align="flex-start">
                                    <div
                                      style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '4px',
                                        background: generation.originalImage 
                                          ? `url(${generation.originalImage}) center/cover`
                                          : 'var(--light-gray)',
                                        flexShrink: 0,
                                      }}
                                    />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <Text size="xs" fw={500} c="charcoal" lineClamp={1}>
                                        {generation.name}
                                      </Text>
                                      <Group gap="xs" mt="2px">
                                        <Badge
                                          size="xs"
                                          color={
                                            generation.status === 'completed' ? 'green' :
                                            generation.status === 'processing' ? 'blue' : 'red'
                                          }
                                          variant="light"
                                        >
                                          {generation.status}
                                        </Badge>
                                        <Text size="xs" c="dimmed">
                                          {formatTime(generation.createdAt)}
                                        </Text>
                                      </Group>
                                    </div>
                                  </Group>
                                </div>
                              ))
                            ) : (
                              <div
                                style={{
                                  padding: '12px',
                                  textAlign: 'center',
                                  color: 'var(--warm-gray)',
                                  fontSize: '12px',
                                  background: 'rgba(201, 169, 97, 0.05)',
                                  borderRadius: '6px',
                                  border: '2px dashed rgba(201, 169, 97, 0.2)',
                                }}
                              >
                                No generations yet
                              </div>
                            )}
                          </Stack>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Stack>
                </Card>
              </motion.div>
            ))}
          </Stack>
        </ScrollArea>
      </div>
    </Drawer>
  );
};

export default Sidebar;
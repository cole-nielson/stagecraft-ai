import React, { useState } from 'react';
import { Drawer, Stack, Text, Button, Card, Group, ActionIcon, Badge, ScrollArea, UnstyledButton, Menu, Loader, Center } from '@mantine/core';
import { IconPlus, IconTrash, IconEdit, IconDotsVertical, IconX, IconChevronRight, IconInbox } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjects, useUnsortedStagings, useDeleteProject } from '../hooks/useProjects';
import { User, Project, Staging } from '../types';
import { stagingApi } from '../services/api';

interface SidebarProps {
  opened: boolean;
  onClose: () => void;
  user: User | null;
  onNewProject: () => void;
  currentProjectId?: string;
  onSelectProject: (projectId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  opened,
  onClose,
  user,
  onNewProject,
  currentProjectId,
  onSelectProject
}) => {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Fetch projects and unsorted stagings only when user is logged in
  const { data: projects, isLoading: projectsLoading } = useProjects(!!user);
  const { data: unsortedStagings, isLoading: unsortedLoading } = useUnsortedStagings(!!user);
  const deleteProjectMutation = useDeleteProject();

  const toggleProject = (projectId: string) => {
    const newExpanded = new Set(expandedProjects);
    if (newExpanded.has(projectId)) {
      newExpanded.delete(projectId);
    } else {
      newExpanded.add(projectId);
    }
    setExpandedProjects(newExpanded);
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
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

  const handleDeleteProject = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project? All stagings in this project will be deleted.')) {
      await deleteProjectMutation.mutateAsync(projectId);
    }
  };

  // Unauthenticated state
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

  const isLoading = projectsLoading || unsortedLoading;

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
                {user.name || user.email}
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
            onClick={onNewProject}
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
          {isLoading ? (
            <Center py="xl">
              <Loader size="sm" color="var(--warm-gold)" />
            </Center>
          ) : (
            <Stack gap="xs" py="md">
              {/* Projects */}
              {projects && projects.length > 0 ? (
                projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    isSelected={currentProjectId === project.id}
                    isExpanded={expandedProjects.has(project.id)}
                    onToggle={() => toggleProject(project.id)}
                    onSelect={() => onSelectProject(project.id)}
                    onDelete={() => handleDeleteProject(project.id)}
                    formatTime={formatTime}
                  />
                ))
              ) : (
                <div
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--warm-gray)',
                  }}
                >
                  <IconInbox size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <Text size="sm" c="dimmed">
                    No projects yet
                  </Text>
                  <Text size="xs" c="dimmed">
                    Create your first project to organize your stagings
                  </Text>
                </div>
              )}

              {/* Unsorted Stagings Section */}
              {unsortedStagings && unsortedStagings.length > 0 && (
                <>
                  <Text size="xs" fw={600} c="dimmed" mt="md" mb="xs">
                    UNSORTED STAGINGS
                  </Text>
                  <Card
                    padding="sm"
                    radius="md"
                    style={{
                      background: 'var(--pure-white)',
                      border: '1px solid var(--light-gray)',
                    }}
                  >
                    <Stack gap="xs">
                      {unsortedStagings.slice(0, 5).map((staging) => (
                        <StagingItem
                          key={staging.id}
                          staging={staging}
                          formatTime={formatTime}
                        />
                      ))}
                      {unsortedStagings.length > 5 && (
                        <Text size="xs" c="dimmed" ta="center">
                          +{unsortedStagings.length - 5} more
                        </Text>
                      )}
                    </Stack>
                  </Card>
                </>
              )}
            </Stack>
          )}
        </ScrollArea>
      </div>
    </Drawer>
  );
};

// Project Card Component
interface ProjectCardProps {
  project: Project;
  isSelected: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onDelete: () => void;
  formatTime: (date?: string) => string;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isSelected,
  isExpanded,
  onToggle,
  onSelect,
  onDelete,
  formatTime,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        padding="sm"
        radius="md"
        style={{
          background: isSelected
            ? 'rgba(201, 169, 97, 0.1)'
            : 'var(--pure-white)',
          border: isSelected
            ? '1px solid rgba(201, 169, 97, 0.3)'
            : '1px solid var(--light-gray)',
          cursor: 'pointer',
        }}
      >
        <Stack gap="xs">
          {/* Project Header */}
          <Group justify="space-between" align="flex-start">
            <UnstyledButton
              onClick={onToggle}
              style={{ flex: 1, textAlign: 'left' }}
            >
              <Group gap="xs">
                <motion.div
                  animate={{ rotate: isExpanded ? 90 : 0 }}
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
                      {project.staging_count} staging{project.staging_count !== 1 ? 's' : ''}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatTime(project.updated_at)}
                    </Text>
                  </Group>
                </div>
              </Group>
            </UnstyledButton>

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
                  onClick={onSelect}
                >
                  Open
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconTrash size={14} />}
                  color="red"
                  onClick={onDelete}
                >
                  Delete
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>

          {/* Expanded content placeholder */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Stack gap="xs" pl="lg">
                  {project.staging_count > 0 ? (
                    <Text size="xs" c="dimmed">
                      Click "Open" to view stagings
                    </Text>
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
                      No stagings yet
                    </div>
                  )}
                </Stack>
              </motion.div>
            )}
          </AnimatePresence>
        </Stack>
      </Card>
    </motion.div>
  );
};

// Staging Item Component
interface StagingItemProps {
  staging: Staging;
  formatTime: (date?: string) => string;
}

const StagingItem: React.FC<StagingItemProps> = ({ staging, formatTime }) => {
  const imageUrl = staging.original_image_url
    ? stagingApi.buildImageUrl(staging.original_image_url)
    : undefined;

  return (
    <div
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
            background: imageUrl
              ? `url(${imageUrl}) center/cover`
              : 'var(--light-gray)',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text size="xs" fw={500} c="charcoal" lineClamp={1}>
            {staging.room_type || 'Room'}
          </Text>
          <Group gap="xs" mt="2px">
            <Badge
              size="xs"
              color={
                staging.status === 'completed' ? 'green' :
                staging.status === 'processing' ? 'blue' : 'red'
              }
              variant="light"
            >
              {staging.status}
            </Badge>
            <Text size="xs" c="dimmed">
              {formatTime(staging.created_at)}
            </Text>
          </Group>
        </div>
      </Group>
    </div>
  );
};

export default Sidebar;

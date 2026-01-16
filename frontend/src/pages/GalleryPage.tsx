import React, { useState } from 'react';
import { Container, Stack, Text, Card, Group, Badge, SimpleGrid, Image, Modal, Center, Button, Loader, Select, Menu } from '@mantine/core';
import { IconArrowLeft, IconDownload, IconPhoto, IconFilter, IconChevronDown, IconFolder, IconInbox, IconDotsVertical, IconFolderPlus, IconFolderOff } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUnsortedStagings, useProjects, useProject, useMoveStaging } from '../hooks/useProjects';
import { stagingApi } from '../services/api';
import { Staging, User } from '../types';

interface GalleryPageProps {
  user: User | null;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectId = searchParams.get('project');
  const [selectedStaging, setSelectedStaging] = useState<Staging | null>(null);
  const [moveStagingTarget, setMoveStagingTarget] = useState<Staging | null>(null);

  // Fetch all projects for the filter dropdown
  const { data: projects } = useProjects(!!user);

  // Fetch project details when filtering by project
  const { data: projectData, isLoading: projectLoading } = useProject(projectId);

  // Fetch unsorted stagings when no project filter
  const { data: unsortedStagings, isLoading: unsortedLoading } = useUnsortedStagings(!!user && !projectId);

  // Move staging mutation
  const moveStagingMutation = useMoveStaging();

  // Determine which stagings to show
  const stagings = projectId ? projectData?.stagings : unsortedStagings;
  const isLoading = projectId ? projectLoading : unsortedLoading;

  // Handle filter change
  const handleFilterChange = (value: string | null) => {
    if (value === 'unsorted' || !value) {
      searchParams.delete('project');
      setSearchParams(searchParams);
    } else {
      setSearchParams({ project: value });
    }
  };

  // Handle moving a staging to a project
  const handleMoveStaging = async (stagingId: string, targetProjectId: string | null) => {
    await moveStagingMutation.mutateAsync({ stagingId, projectId: targetProjectId });
    setMoveStagingTarget(null);
  };

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  if (!user) {
    return (
      <Container size="lg" py="xl">
        <Center py="xl">
          <Stack align="center" gap="md">
            <IconPhoto size={48} color="var(--warm-gray)" />
            <Text size="lg" c="dimmed">Sign in to view your staging gallery</Text>
            <Button variant="outline" onClick={() => navigate('/staging')}>
              Go to Staging
            </Button>
          </Stack>
        </Center>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Group justify="space-between" align="flex-start">
            <div>
              <Group gap="md" align="center">
                <Button
                  variant="subtle"
                  color="gray"
                  leftSection={<IconArrowLeft size={18} />}
                  onClick={() => navigate('/staging')}
                >
                  Back
                </Button>
                <div>
                  <Text
                    size="xl"
                    fw={600}
                    c="charcoal"
                    style={{ fontFamily: 'var(--font-heading)' }}
                  >
                    {projectData ? projectData.name : 'My Stagings'}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {stagings?.length || 0} staging{(stagings?.length || 0) !== 1 ? 's' : ''}{' '}
                    {projectData ? 'in this project' : 'in your gallery'}
                  </Text>
                </div>
              </Group>
            </div>

            {/* Filter Dropdown */}
            {projects && projects.length > 0 && (
              <Menu shadow="md" width={220}>
                <Menu.Target>
                  <Button
                    variant="light"
                    color="gray"
                    rightSection={<IconChevronDown size={16} />}
                    leftSection={<IconFilter size={16} />}
                  >
                    {projectData ? projectData.name : 'Unsorted'}
                  </Button>
                </Menu.Target>

                <Menu.Dropdown>
                  <Menu.Label>Filter by</Menu.Label>
                  <Menu.Item
                    leftSection={<IconInbox size={16} />}
                    onClick={() => handleFilterChange('unsorted')}
                    style={{
                      background: !projectId ? 'rgba(201, 169, 97, 0.1)' : undefined,
                    }}
                  >
                    Unsorted Stagings
                  </Menu.Item>
                  <Menu.Divider />
                  <Menu.Label>Projects</Menu.Label>
                  {projects.map((project) => (
                    <Menu.Item
                      key={project.id}
                      leftSection={<IconFolder size={16} />}
                      onClick={() => handleFilterChange(project.id)}
                      style={{
                        background: projectId === project.id ? 'rgba(201, 169, 97, 0.1)' : undefined,
                      }}
                    >
                      <Group justify="space-between" w="100%">
                        <Text size="sm" lineClamp={1}>{project.name}</Text>
                        <Badge size="xs" color="gray" variant="light">
                          {project.staging_count}
                        </Badge>
                      </Group>
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            )}
          </Group>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <Center py="xl">
            <Loader size="lg" color="var(--warm-gold)" />
          </Center>
        )}

        {/* Empty State */}
        {!isLoading && (!stagings || stagings.length === 0) && (
          <Center py="xl">
            <Stack align="center" gap="md">
              <IconPhoto size={64} color="var(--warm-gray)" style={{ opacity: 0.5 }} />
              <Text size="lg" c="dimmed">No stagings yet</Text>
              <Text size="sm" c="dimmed">Upload a room photo to create your first staging</Text>
              <Button
                variant="filled"
                style={{
                  background: 'linear-gradient(135deg, var(--warm-gold) 0%, #D4AF37 100%)',
                }}
                onClick={() => navigate('/staging')}
              >
                Create Staging
              </Button>
            </Stack>
          </Center>
        )}

        {/* Gallery Grid */}
        {!isLoading && stagings && stagings.length > 0 && (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
            {stagings.map((staging, index) => (
              <motion.div
                key={staging.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <GalleryCard
                  staging={staging}
                  onClick={() => setSelectedStaging(staging)}
                  onMoveToProject={() => setMoveStagingTarget(staging)}
                />
              </motion.div>
            ))}
          </SimpleGrid>
        )}
      </Stack>

      {/* Staging Detail Modal */}
      <Modal
        opened={!!selectedStaging}
        onClose={() => setSelectedStaging(null)}
        size="90%"
        centered
        title={
          <Text fw={600} size="lg">
            {selectedStaging?.room_type || 'Room'} - {selectedStaging?.style || 'Staged'}
          </Text>
        }
      >
        {selectedStaging && (
          <StagingDetail
            staging={selectedStaging}
            onDownload={handleDownload}
          />
        )}
      </Modal>

      {/* Move to Project Modal */}
      <Modal
        opened={!!moveStagingTarget}
        onClose={() => setMoveStagingTarget(null)}
        size="sm"
        centered
        title={
          <Text fw={600} size="lg">
            Move to Project
          </Text>
        }
      >
        {moveStagingTarget && (
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              Select a project to move this staging to:
            </Text>

            {/* Unsorted option */}
            <Button
              variant="light"
              color="gray"
              fullWidth
              justify="flex-start"
              leftSection={<IconInbox size={18} />}
              onClick={() => handleMoveStaging(moveStagingTarget.id, null)}
              disabled={moveStagingMutation.isPending}
            >
              Unsorted (No Project)
            </Button>

            {/* Project options */}
            {projects && projects.length > 0 && (
              <>
                <Text size="xs" c="dimmed" fw={500} mt="xs">
                  Projects
                </Text>
                {projects.map((project) => (
                  <Button
                    key={project.id}
                    variant="light"
                    color="yellow"
                    fullWidth
                    justify="flex-start"
                    leftSection={<IconFolder size={18} />}
                    onClick={() => handleMoveStaging(moveStagingTarget.id, project.id)}
                    disabled={moveStagingMutation.isPending}
                  >
                    <Group justify="space-between" w="100%" style={{ flex: 1 }}>
                      <Text size="sm" lineClamp={1}>{project.name}</Text>
                      <Badge size="xs" color="gray" variant="light">
                        {project.staging_count}
                      </Badge>
                    </Group>
                  </Button>
                ))}
              </>
            )}

            {moveStagingMutation.isPending && (
              <Center>
                <Loader size="sm" color="var(--warm-gold)" />
              </Center>
            )}
          </Stack>
        )}
      </Modal>
    </Container>
  );
};

// Gallery Card Component
interface GalleryCardProps {
  staging: Staging;
  onClick: () => void;
  onMoveToProject: () => void;
}

const GalleryCard: React.FC<GalleryCardProps> = ({ staging, onClick, onMoveToProject }) => {
  // Use the staged image as thumbnail if available, otherwise original
  const thumbnailUrl = staging.staged_image_url
    ? stagingApi.buildImageUrl(staging.staged_image_url)
    : staging.original_image_url
      ? stagingApi.buildImageUrl(staging.original_image_url)
      : undefined;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <Card
      padding="sm"
      radius="md"
      style={{
        cursor: 'pointer',
        border: '1px solid var(--light-gray)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Stack gap="sm">
        {/* Thumbnail */}
        <div
          style={{
            aspectRatio: '4/3',
            borderRadius: '8px',
            overflow: 'hidden',
            background: 'var(--light-gray)',
            position: 'relative',
          }}
          onClick={onClick}
        >
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={staging.room_type || 'Staged room'}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <Center style={{ height: '100%' }}>
              <IconPhoto size={32} color="var(--warm-gray)" />
            </Center>
          )}
        </div>

        {/* Info */}
        <div onClick={onClick}>
          <Group justify="space-between" align="flex-start">
            <div style={{ flex: 1, minWidth: 0 }}>
              <Text size="sm" fw={500} c="charcoal" lineClamp={1}>
                {staging.room_type || 'Room'}
              </Text>
              {staging.style && (
                <Text size="xs" c="dimmed" lineClamp={1}>
                  {staging.style}
                </Text>
              )}
            </div>
            <Group gap="xs">
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
              <Menu shadow="md" width={180} position="bottom-end">
                <Menu.Target>
                  <Button
                    variant="subtle"
                    color="gray"
                    size="compact-xs"
                    onClick={(e) => e.stopPropagation()}
                    p={4}
                  >
                    <IconDotsVertical size={14} />
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item
                    leftSection={<IconFolderPlus size={14} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveToProject();
                    }}
                  >
                    Move to Project
                  </Menu.Item>
                </Menu.Dropdown>
              </Menu>
            </Group>
          </Group>
          <Text size="xs" c="dimmed" mt="xs">
            {formatDate(staging.created_at)}
          </Text>
        </div>
      </Stack>
    </Card>
  );
};

// Staging Detail Component (for modal)
interface StagingDetailProps {
  staging: Staging;
  onDownload: (url: string, filename: string) => void;
}

const StagingDetail: React.FC<StagingDetailProps> = ({ staging, onDownload }) => {
  const originalUrl = staging.original_image_url
    ? stagingApi.buildImageUrl(staging.original_image_url)
    : '';
  const stagedUrl = staging.staged_image_url
    ? stagingApi.buildImageUrl(staging.staged_image_url)
    : '';

  if (staging.status !== 'completed') {
    return (
      <Center py="xl">
        <Stack align="center" gap="md">
          <Badge
            size="lg"
            color={
              staging.status === 'processing' ? 'blue' :
              staging.status === 'failed' ? 'red' : 'gray'
            }
          >
            {staging.status}
          </Badge>
          <Text c="dimmed">
            {staging.status === 'processing'
              ? 'This staging is still processing...'
              : staging.status === 'failed'
                ? staging.error || 'This staging failed to process'
                : 'Staging pending'}
          </Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {/* Before & After Grid */}
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Original Image */}
        <Card
          padding="md"
          radius="md"
          style={{ border: '1px solid var(--light-gray)' }}
        >
          <Stack gap="sm">
            <Text size="md" fw={600} c="charcoal" ta="center">
              Before
            </Text>
            <div
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--light-gray)',
              }}
            >
              {originalUrl ? (
                <Image
                  src={originalUrl}
                  alt="Original room"
                  style={{ width: '100%', height: 'auto' }}
                  fit="contain"
                />
              ) : (
                <Center py="xl">
                  <Text c="dimmed">No original image</Text>
                </Center>
              )}
            </div>
          </Stack>
        </Card>

        {/* Staged Image */}
        <Card
          padding="md"
          radius="md"
          style={{ border: '2px solid var(--warm-gold)' }}
        >
          <Stack gap="sm">
            <Group justify="center" gap="xs">
              <Text size="md" fw={600} c="charcoal">
                After
              </Text>
              {staging.architectural_integrity && (
                <Badge color="green" variant="light" size="sm">
                  Verified
                </Badge>
              )}
            </Group>
            <div
              style={{
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--warm-gold)',
              }}
            >
              {stagedUrl ? (
                <Image
                  src={stagedUrl}
                  alt="Staged room"
                  style={{ width: '100%', height: 'auto' }}
                  fit="contain"
                />
              ) : (
                <Center py="xl">
                  <Text c="dimmed">No staged image</Text>
                </Center>
              )}
            </div>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Metrics */}
      {(staging.quality_score || staging.processing_time_ms) && (
        <Card padding="md" radius="md" style={{ background: 'var(--off-white)' }}>
          <Group justify="center" gap="xl">
            {staging.quality_score && (
              <div style={{ textAlign: 'center' }}>
                <Text size="xl" fw={600} c="var(--warm-gold)">
                  {Math.round(staging.quality_score * 100)}%
                </Text>
                <Text size="xs" c="dimmed">Quality Score</Text>
              </div>
            )}
            {staging.processing_time_ms && (
              <div style={{ textAlign: 'center' }}>
                <Text size="xl" fw={600} c="var(--sage-navy)">
                  {Math.round(staging.processing_time_ms / 1000)}s
                </Text>
                <Text size="xs" c="dimmed">Processing Time</Text>
              </div>
            )}
          </Group>
        </Card>
      )}

      {/* Download Button */}
      {stagedUrl && (
        <Group justify="center">
          <Button
            leftSection={<IconDownload size={18} />}
            onClick={() => onDownload(stagedUrl, `staged-${staging.style || 'room'}-${Date.now()}.jpg`)}
            style={{
              background: 'linear-gradient(135deg, var(--warm-gold) 0%, #D4AF37 100%)',
            }}
          >
            Download Staged Image
          </Button>
        </Group>
      )}
    </Stack>
  );
};

export default GalleryPage;

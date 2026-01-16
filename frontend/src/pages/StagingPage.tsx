import React, { useState } from 'react';
import { Container, Stack, Text, Paper, Alert, Image, Card, Group, Badge, ActionIcon, Modal, SimpleGrid, Center, Button, ScrollArea } from '@mantine/core';
import { FileWithPath } from '@mantine/dropzone';
import { IconAlertCircle, IconX, IconFolder, IconPhoto, IconDownload, IconChevronRight } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PremiumUpload from '../components/PremiumUpload';
import ProcessingStates from '../components/ProcessingStates';
import ResultsDisplay from '../components/ResultsDisplay';
import { useStaging } from '../hooks/useStaging';
import { useProjects, useProject } from '../hooks/useProjects';
import { stagingApi } from '../services/api';
import type { User, Staging } from '../types';

interface StagingPageProps {
  onGenerationRequest: (imageFile: File) => boolean;
  user: User | null;
  currentProjectId?: string;
  onClearProject?: () => void;
}

const StagingPage: React.FC<StagingPageProps> = ({ onGenerationRequest, user, currentProjectId, onClearProject }) => {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState<FileWithPath | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageContainerHeight, setImageContainerHeight] = useState<number>(300);
  const [selectedStaging, setSelectedStaging] = useState<Staging | null>(null);

  const {
    startStaging,
    resetStaging,
    staging,
    isStaging,
    isCompleted,
    isFailed,
    error
  } = useStaging();

  // Fetch projects to get the current project name
  const { data: projects } = useProjects(!!user);
  const currentProject = projects?.find(p => p.id === currentProjectId);

  // Fetch project details with stagings when a project is selected
  const { data: projectWithStagings } = useProject(currentProjectId || null);
  

  const handleFileUpload = (files: FileWithPath[]) => {
    if (files.length > 0) {
      const file = files[0];
      setUploadedFile(file);
      
      // Create preview URL for the uploaded image
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      
      // Calculate optimal container height based on image aspect ratio
      const img = new window.Image();
      img.onload = () => {
        const containerWidth = 350;
        const aspectRatio = img.height / img.width;
        const calculatedHeight = Math.max(300, Math.min(500, containerWidth * aspectRatio));
        setImageContainerHeight(calculatedHeight);
      };
      img.src = url;
    }
  };


  const handleStartStaging = async () => {
    if (!uploadedFile) return;

    // Check if user is authenticated before proceeding
    const canProceed = onGenerationRequest(uploadedFile);
    if (!canProceed) {
      return; // User will be prompted to log in
    }

    try {
      await startStaging({
        image: uploadedFile,
        quality_mode: 'premium',
        project_id: currentProjectId,
      });
    } catch (error) {
      console.error('Failed to start staging:', error);
    }
  };

  const handleTryAgain = () => {
    resetStaging();
  };

  const handleStageAnother = () => {
    setUploadedFile(null);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setImageContainerHeight(300);
    resetStaging();
  };

  const canStartStaging = uploadedFile && !isStaging;

  // Download handler for staging images
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

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Simple Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
            <Text
              size="xl"
              fw={600}
              c="charcoal"
              ta="center"
              mb="xs"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              AI Room Staging
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Upload a room photo and get professional staging in seconds
            </Text>
          </div>
        </motion.div>

        {/* Active Project Banner */}
        {currentProject && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Paper
              p="sm"
              radius="md"
              style={{
                background: 'linear-gradient(135deg, rgba(201, 169, 97, 0.1) 0%, rgba(201, 169, 97, 0.05) 100%)',
                border: '1px solid rgba(201, 169, 97, 0.3)',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              <Group justify="space-between" align="center">
                <Group gap="sm">
                  <IconFolder size={18} color="var(--warm-gold)" />
                  <div>
                    <Text size="xs" c="dimmed">Staging for project:</Text>
                    <Text size="sm" fw={600} c="charcoal">
                      {currentProject.name}
                    </Text>
                  </div>
                </Group>
                <Group gap="xs">
                  <Badge size="sm" color="yellow" variant="light">
                    {currentProject.staging_count} staging{currentProject.staging_count !== 1 ? 's' : ''}
                  </Badge>
                  {onClearProject && (
                    <ActionIcon
                      variant="subtle"
                      color="gray"
                      size="sm"
                      onClick={onClearProject}
                      title="Clear project selection"
                    >
                      <IconX size={14} />
                    </ActionIcon>
                  )}
                </Group>
              </Group>
            </Paper>
          </motion.div>
        )}

        {/* Error Display */}
        {(error || isFailed) && (
          <Paper shadow="sm" radius="lg" p="xl" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <Alert
              icon={<IconAlertCircle size={16} />}
              title="Staging Failed"
              color="red"
              variant="light"
              mb="md"
            >
              {error?.message || staging?.error || 'An unexpected error occurred. Please try again.'}
            </Alert>
            <div style={{ textAlign: 'center' }}>
              <button
                className="btn-luxury-primary"
                onClick={handleStageAnother}
                style={{ padding: '12px 32px' }}
              >
                Try Again
              </button>
            </div>
          </Paper>
        )}

        {/* Results Display */}
        {isCompleted && staging && (
          <ResultsDisplay
            staging={staging}
            onTryAgain={handleTryAgain}
            onStageAnother={handleStageAnother}
          />
        )}

        {/* Processing States */}
        {isStaging && (
          <ProcessingStates
            isProcessing={isStaging}
            estimatedTimeSeconds={staging?.estimated_time_seconds || 30}
            progress={75}
            originalImageUrl={imagePreviewUrl ?? undefined}
            uploadedFileName={uploadedFile?.name}
            imageContainerHeight={imageContainerHeight}
          />
        )}

        {/* Main Staging Interface */}
        {!isCompleted && !isStaging && !isFailed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {!uploadedFile ? (
              /* Upload Section - Show when no image uploaded */
              <Paper
                shadow="sm"
                radius="lg"
                p="xl"
                style={{
                  background: 'var(--pure-white)',
                  border: '1px solid var(--light-gray)',
                  maxWidth: '600px',
                  margin: '0 auto',
                }}
              >
                <Stack gap="lg">
                  <div>
                    <Text
                      size="xl"
                      fw={600}
                      c="charcoal"
                      mb="xs"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      Upload Room Photo
                    </Text>
                    <Text size="sm" c="dimmed">
                      Choose a high-resolution photo of your empty room for professional staging
                    </Text>
                  </div>

                  <PremiumUpload
                    onDrop={handleFileUpload}
                    isLoading={isStaging}
                    multiple={false}
                    maxFiles={1}
                  />
                </Stack>
              </Paper>
            ) : (
              /* Single Image Preview - Show when image uploaded */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                  gap: 'var(--space-xl)',
                  alignItems: 'start',
                }}
              >
                {/* Original Image Preview */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card
                    shadow="sm"
                    radius="lg"
                    p="lg"
                    style={{
                      background: 'var(--pure-white)',
                      border: '1px solid var(--light-gray)',
                    }}
                  >
                    <Stack gap="md">
                      <div>
                        <Text
                          size="lg"
                          fw={600}
                          c="charcoal"
                          mb="xs"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          Your Original Image
                        </Text>
                        <Text size="sm" c="dimmed">
                          <strong>{uploadedFile?.name}</strong> ({Math.round((uploadedFile?.size ?? 0) / 1024)} KB)
                        </Text>
                      </div>

                      <div
                        style={{
                          position: 'relative',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          border: '2px solid var(--light-gray)',
                          height: `${imageContainerHeight}px`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Image
                          src={imagePreviewUrl}
                          alt="Original room"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                          }}
                        />
                      </div>
                    </Stack>
                  </Card>
                </motion.div>

                {/* AI Staging Preview */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card
                    shadow="sm"
                    radius="lg"
                    p="lg"
                    style={{
                      background: 'var(--pure-white)',
                      border: '2px solid var(--warm-gold)',
                    }}
                  >
                    <Stack gap="md">
                      <div>
                        <Text
                          size="lg"
                          fw={600}
                          c="charcoal"
                          mb="xs"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          Staged Result
                        </Text>
                        <Text size="sm" c="dimmed">
                          Click generate to see your professionally staged room
                        </Text>
                      </div>

                      <div
                        style={{
                          position: 'relative',
                          borderRadius: 'var(--radius-md)',
                          overflow: 'hidden',
                          height: `${imageContainerHeight}px`,
                          background: 'linear-gradient(135deg, rgba(201, 169, 97, 0.1) 0%, rgba(27, 54, 93, 0.1) 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '2px dashed var(--warm-gold)',
                        }}
                      >
                        <Stack align="center" gap="sm">
                          <Text size="xl" c="warmGold" fw={600}>
                            ✨
                          </Text>
                          <Text size="md" c="dimmed" ta="center">
                            Ready for staging
                          </Text>
                        </Stack>
                      </div>
                    </Stack>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Generate Button */}
            {canStartStaging && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div style={{ textAlign: 'center', marginTop: 'var(--space-xl)' }}>
                  <button
                    className="btn-luxury-primary"
                    onClick={handleStartStaging}
                    disabled={!canStartStaging}
                    style={{
                      padding: '16px 48px',
                      fontSize: '1.125rem',
                      fontWeight: 600,
                    }}
                  >
                    Generate Staging
                  </button>
                  <Text size="sm" c="dimmed" mt="sm">
                    High-quality results in ~30 seconds
                  </Text>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Project Stagings Section - Show when project has stagings */}
        {currentProject && projectWithStagings?.stagings && projectWithStagings.stagings.length > 0 && !isStaging && !isCompleted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div
              style={{
                maxWidth: '800px',
                margin: '0 auto',
                paddingTop: 'var(--space-xl)',
              }}
            >
              {/* Section header */}
              <Group justify="space-between" align="center" mb="md">
                <Text size="sm" c="dimmed" fw={500}>
                  Recent in this project
                </Text>
                {projectWithStagings.stagings.length > 4 && (
                  <Button
                    variant="subtle"
                    color="gray"
                    size="xs"
                    rightSection={<IconChevronRight size={14} />}
                    onClick={() => navigate(`/gallery?project=${currentProjectId}`)}
                  >
                    View all
                  </Button>
                )}
              </Group>

              {/* Horizontal scrolling thumbnails */}
              <ScrollArea type="hover" offsetScrollbars>
                <Group gap="md" wrap="nowrap" pb="xs">
                  {projectWithStagings.stagings.slice(0, 6).map((stg) => {
                    const thumbnailUrl = stg.staged_image_url
                      ? stagingApi.buildImageUrl(stg.staged_image_url)
                      : stg.original_image_url
                        ? stagingApi.buildImageUrl(stg.original_image_url)
                        : undefined;

                    return (
                      <div
                        key={stg.id}
                        onClick={() => setSelectedStaging(stg)}
                        style={{
                          width: '120px',
                          flexShrink: 0,
                          cursor: 'pointer',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid var(--light-gray)',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div
                          style={{
                            aspectRatio: '4/3',
                            background: 'var(--light-gray)',
                          }}
                        >
                          {thumbnailUrl ? (
                            <Image
                              src={thumbnailUrl}
                              alt={stg.room_type || 'Staged room'}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            <Center style={{ height: '100%' }}>
                              <IconPhoto size={24} color="var(--warm-gray)" />
                            </Center>
                          )}
                        </div>
                        <div style={{ padding: '6px 8px', background: 'var(--pure-white)' }}>
                          <Text size="xs" c="charcoal" lineClamp={1} fw={500}>
                            {stg.room_type || 'Room'}
                          </Text>
                        </div>
                      </div>
                    );
                  })}
                </Group>
              </ScrollArea>
            </div>
          </motion.div>
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
          <StagingDetailModal staging={selectedStaging} onDownload={handleDownload} />
        )}
      </Modal>
    </Container>
  );
};

// Staging Detail Modal Content
interface StagingDetailModalProps {
  staging: Staging;
  onDownload: (url: string, filename: string) => void;
}

const StagingDetailModal: React.FC<StagingDetailModalProps> = ({ staging, onDownload }) => {
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
      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
        {/* Original Image */}
        <Card padding="md" radius="md" style={{ border: '1px solid var(--light-gray)' }}>
          <Stack gap="sm">
            <Text size="md" fw={600} c="charcoal" ta="center">Before</Text>
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--light-gray)' }}>
              {originalUrl ? (
                <Image src={originalUrl} alt="Original room" style={{ width: '100%', height: 'auto' }} fit="contain" />
              ) : (
                <Center py="xl"><Text c="dimmed">No original image</Text></Center>
              )}
            </div>
          </Stack>
        </Card>

        {/* Staged Image */}
        <Card padding="md" radius="md" style={{ border: '2px solid var(--warm-gold)' }}>
          <Stack gap="sm">
            <Group justify="center" gap="xs">
              <Text size="md" fw={600} c="charcoal">After</Text>
              {staging.architectural_integrity && (
                <Badge color="green" variant="light" size="sm">Verified</Badge>
              )}
            </Group>
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--warm-gold)' }}>
              {stagedUrl ? (
                <Image src={stagedUrl} alt="Staged room" style={{ width: '100%', height: 'auto' }} fit="contain" />
              ) : (
                <Center py="xl"><Text c="dimmed">No staged image</Text></Center>
              )}
            </div>
          </Stack>
        </Card>
      </SimpleGrid>

      {/* Download Button */}
      {stagedUrl && (
        <Group justify="center">
          <Button
            leftSection={<IconDownload size={18} />}
            onClick={() => onDownload(stagedUrl, `staged-${staging.style || 'room'}-${Date.now()}.jpg`)}
            style={{ background: 'linear-gradient(135deg, var(--warm-gold) 0%, #D4AF37 100%)' }}
          >
            Download Staged Image
          </Button>
        </Group>
      )}
    </Stack>
  );
};

export default StagingPage;

import React, { useState } from 'react';
import { Container, Stack, Text, Paper, Alert, Image, Card, Group, Badge, ActionIcon } from '@mantine/core';
import { FileWithPath } from '@mantine/dropzone';
import { IconAlertCircle, IconX, IconFolder } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import PremiumUpload from '../components/PremiumUpload';
import ProcessingStates from '../components/ProcessingStates';
import ResultsDisplay from '../components/ResultsDisplay';
import { useStaging } from '../hooks/useStaging';
import { useProjects } from '../hooks/useProjects';
import type { User } from '../types';

interface StagingPageProps {
  onGenerationRequest: (imageFile: File) => boolean;
  user: User | null;
  currentProjectId?: string;
  onClearProject?: () => void;
}

const StagingPage: React.FC<StagingPageProps> = ({ onGenerationRequest, user, currentProjectId, onClearProject }) => {
  const [uploadedFile, setUploadedFile] = useState<FileWithPath | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageContainerHeight, setImageContainerHeight] = useState<number>(300);

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

      </Stack>
    </Container>
  );
};

export default StagingPage;

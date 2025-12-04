import React, { useState } from 'react';
import { Container, Stack, Text, Paper, Group, Alert, Image, Card, Switch, Button } from '@mantine/core';
import { FileWithPath } from '@mantine/dropzone';
import { IconAlertCircle, IconUpload } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import PremiumUpload from '../components/PremiumUpload';
import ProcessingStates from '../components/ProcessingStates';
import ResultsDisplay from '../components/ResultsDisplay';
import BatchResults from '../components/BatchResults';
import { useStaging } from '../hooks/useStaging';

interface User {
  id: string;
  name: string;
  email: string;
}

interface StagingPageProps {
  onGenerationRequest: (imageFile: File) => boolean;
  user: User | null;
  currentProjectId?: string;
}

const StagingPage: React.FC<StagingPageProps> = ({ onGenerationRequest, user, currentProjectId }) => {
  const [uploadedFile, setUploadedFile] = useState<FileWithPath | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<FileWithPath[]>([]);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageContainerHeight, setImageContainerHeight] = useState<number>(300);
  const [batchMode, setBatchMode] = useState<boolean>(false);
  
  const { 
    startStaging, 
    startBatchStaging,
    resetStaging,
    staging, 
    batchStaging,
    isStaging, 
    isBatchStaging,
    isCompleted, 
    isBatchCompleted,
    isFailed,
    isBatchFailed,
    isBatchPartial,
    error 
  } = useStaging();
  

  const handleFileUpload = (files: FileWithPath[]) => {
    if (batchMode) {
      setUploadedFiles(files);
      setUploadedFile(null);
      setImagePreviewUrl(null);
    } else if (files.length > 0) {
      const file = files[0];
      setUploadedFile(file);
      setUploadedFiles([]);
      
      // Create preview URL for the uploaded image
      const url = URL.createObjectURL(file);
      setImagePreviewUrl(url);
      
      // Calculate optimal container height based on image aspect ratio
      const img = new Image();
      img.onload = () => {
        const containerWidth = 350; // Approximate container width
        const aspectRatio = img.height / img.width;
        const calculatedHeight = Math.max(300, Math.min(500, containerWidth * aspectRatio));
        setImageContainerHeight(calculatedHeight);
      };
      img.src = url;
    }
  };


  const handleStartStaging = async () => {
    if (batchMode) {
      if (uploadedFiles.length === 0) return;

      // Check if user is authenticated before proceeding
      const canProceed = onGenerationRequest(uploadedFiles[0]);
      if (!canProceed) {
        return; // User will be prompted to log in
      }

      try {
        await startBatchStaging({
          images: uploadedFiles,
          quality_mode: 'premium',
        });
      } catch (error) {
        console.error('Failed to start batch staging:', error);
      }
    } else {
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
        });
      } catch (error) {
        console.error('Failed to start staging:', error);
      }
    }
  };

  const handleTryAgain = () => {
    resetStaging();
  };

  const handleStageAnother = () => {
    setUploadedFile(null);
    setUploadedFiles([]);
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
      setImagePreviewUrl(null);
    }
    setImageContainerHeight(300);
    resetStaging();
  };

  const canStartStaging = batchMode ? 
    (uploadedFiles.length > 0 && !isBatchStaging) : 
    (uploadedFile && !isStaging);

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
              {user && currentProjectId !== 'current' 
                ? `Project: ${currentProjectId?.includes('proj-') ? 'New Project' : 'Current Project'}`
                : 'Room Staging'
              }
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              Upload a room photo and get professional staging in seconds
            </Text>
          </div>
        </motion.div>

        {/* Error Display */}
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            title="Staging Error"
            color="red"
            variant="light"
            onClose={resetStaging}
            withCloseButton
          >
            {error.message || 'An unexpected error occurred. Please try again.'}
          </Alert>
        )}

        {/* Results Display */}
        {isCompleted && staging && !batchMode && (
          <ResultsDisplay
            staging={staging}
            onTryAgain={handleTryAgain}
            onStageAnother={handleStageAnother}
          />
        )}

        {/* Batch Results Display */}
        {(isBatchCompleted || isBatchPartial) && batchStaging && (
          <BatchResults
            batchStaging={batchStaging}
          />
        )}

        {/* Processing States */}
        {(isStaging || isBatchStaging) && (
          <ProcessingStates
            isProcessing={isStaging || isBatchStaging}
            estimatedTimeSeconds={
              batchMode 
                ? (batchStaging?.estimated_time_seconds || uploadedFiles.length * 25)
                : (staging?.estimated_time_seconds || 25)
            }
            progress={75} // This would come from real-time updates in production
            originalImageUrl={imagePreviewUrl}
            uploadedFileName={
              batchMode 
                ? `${uploadedFiles.length} images`
                : uploadedFile?.name
            }
            imageContainerHeight={imageContainerHeight}
          />
        )}

        {/* Main Staging Interface */}
        {!isCompleted && !isBatchCompleted && !isBatchPartial && !isStaging && !isBatchStaging && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Batch Mode Toggle */}
            <div style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
              <Group justify="center" gap="md">
                <Text size="sm" c="dimmed">Single Image</Text>
                <Switch
                  checked={batchMode}
                  onChange={(event) => {
                    setBatchMode(event.currentTarget.checked);
                    handleStageAnother(); // Reset all state when switching modes
                  }}
                  color="var(--warm-gold)"
                  size="md"
                />
                <Text size="sm" c="dimmed">Batch Mode (up to 10)</Text>
              </Group>
            </div>

            {(!uploadedFile && !batchMode) || (batchMode && uploadedFiles.length === 0) ? (
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
                      {batchMode ? 'Upload Room Photos' : 'Upload Room Photo'}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {batchMode 
                        ? 'Choose up to 10 high-resolution photos for batch staging' 
                        : 'Choose a high-resolution photo of your empty room for professional staging'
                      }
                    </Text>
                  </div>

                  <PremiumUpload
                    onDrop={handleFileUpload}
                    isLoading={isStaging || isBatchStaging}
                    multiple={batchMode}
                    maxFiles={batchMode ? 10 : 1}
                  />
                </Stack>
              </Paper>
            ) : batchMode ? (
              /* Batch Upload Preview - Show uploaded files */
              <Paper
                shadow="sm"
                radius="lg"
                p="xl"
                style={{
                  background: 'var(--pure-white)',
                  border: '1px solid var(--light-gray)',
                  maxWidth: '800px',
                  margin: '0 auto',
                }}
              >
                <Stack gap="lg">
                  <div>
                    <Text
                      size="lg"
                      fw={600}
                      c="charcoal"
                      mb="xs"
                      style={{ fontFamily: 'var(--font-heading)' }}
                    >
                      {uploadedFiles.length} Images Ready for Batch Staging
                    </Text>
                    <Text size="sm" c="dimmed">
                      All images will be processed simultaneously using professional staging
                    </Text>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                      gap: 'var(--space-md)',
                    }}
                  >
                    {uploadedFiles.map((file, index) => (
                      <Card key={index} withBorder padding="xs" radius="md">
                        <div
                          style={{
                            width: '100%',
                            height: '80px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            marginBottom: '8px',
                          }}
                        >
                          <Image
                            src={URL.createObjectURL(file)}
                            alt={`Upload ${index + 1}`}
                            fit="cover"
                            height={80}
                          />
                        </div>
                        <Text size="xs" c="dimmed" ta="center" truncate>
                          {file.name}
                        </Text>
                      </Card>
                    ))}
                  </div>

                  <Group justify="center" mt="md">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedFiles([])}
                    >
                      Clear All
                    </Button>
                  </Group>
                </Stack>
              </Paper>
            ) : (
              /* Single Image Preview - Show when single image uploaded */
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
                          <strong>{uploadedFile.name}</strong> ({Math.round(uploadedFile.size / 1024)} KB)
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
                    {batchMode 
                      ? `Generate Staging (${uploadedFiles.length} images)` 
                      : 'Generate Staging'
                    }
                  </button>
                  <Text size="sm" c="dimmed" mt="sm">
                    {batchMode 
                      ? `High-quality results in ~${uploadedFiles.length * 25} seconds`
                      : 'High-quality results in ~25 seconds'
                    }
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
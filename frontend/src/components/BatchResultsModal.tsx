import React, { useState, useMemo } from 'react';
import { Modal, Group, Text, Card, Stack, Progress, Button, Image, Center, ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight, IconX, IconDownload, IconCheck, IconClock, IconPhoto } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BatchStaging, Staging } from '../types';
import { stagingApi } from '../services/api';

interface BatchResultsModalProps {
  opened: boolean;
  onClose: () => void;
  batchStaging: BatchStaging;
  initialImageIndex?: number;
}

const BatchResultsModal: React.FC<BatchResultsModalProps> = ({
  opened,
  onClose,
  batchStaging,
  initialImageIndex = 0
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  
  // Memoize completed stagings to prevent unnecessary recalculations
  const completedStagings = useMemo(() => 
    batchStaging.stagings.filter(staging => 
      staging.status === 'completed' && staging.staged_image_url
    ),
    [batchStaging.stagings]
  );

  // Safely get current staging with bounds checking
  const currentStaging = completedStagings[currentImageIndex] || null;

  // Cache buster for images to prevent browser caching issues  
  const cacheBuster = React.useMemo(() => Date.now(), [opened]);

  const goToPrevious = () => {
    setCurrentImageIndex(prev => 
      prev > 0 ? prev - 1 : completedStagings.length - 1
    );
  };

  const goToNext = () => {
    setCurrentImageIndex(prev => 
      prev < completedStagings.length - 1 ? prev + 1 : 0
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <IconCheck size={16} color="var(--success-sage)" />;
      case 'failed':
        return <IconX size={16} color="var(--error-burgundy)" />;
      case 'processing':
        return <IconClock size={16} color="var(--warm-gold)" />;
      default:
        return <IconPhoto size={16} color="var(--charcoal)" />;
    }
  };

  React.useEffect(() => {
    setCurrentImageIndex(Math.min(initialImageIndex, completedStagings.length - 1));
  }, [initialImageIndex, completedStagings.length]);

  // Debug logging to trace image loading issues
  React.useEffect(() => {
    if (opened && currentStaging) {
      console.log('Modal opened with staging:', {
        id: currentStaging.id,
        originalUrl: stagingApi.buildImageUrl(currentStaging.original_image_url),
        stagedUrl: stagingApi.buildImageUrl(currentStaging.staged_image_url || ''),
        cacheBuster
      });
    }
  }, [opened, currentStaging, cacheBuster]);

  if (completedStagings.length === 0) {
    return (
      <Modal
        opened={opened}
        onClose={onClose}
        size="md"
        centered
        title="No Completed Images"
      >
        <Center p="xl">
          <Stack align="center" gap="md">
            <IconPhoto size={48} color="var(--mantine-color-gray-5)" />
            <Text size="md" c="dimmed" ta="center">
              No successfully processed images to display yet.
            </Text>
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </Stack>
        </Center>
      </Modal>
    );
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      size="95vw"
      centered
      withCloseButton={false}
      padding={0}
      styles={{
        content: {
          background: 'var(--pure-black)',
          border: 'none',
        },
        body: {
          padding: 0,
        }
      }}
    >
      {/* Header with navigation and close */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          background: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(8px)',
          padding: '16px 24px',
        }}
      >
        <Group justify="space-between" align="center">
          <Group gap="md">
            <Text size="lg" fw={600} c="white">
              Image {currentImageIndex + 1} of {completedStagings.length}
            </Text>
            {currentStaging && (
              <Group gap="xs">
                {getStatusIcon(currentStaging.status)}
                <Text size="sm" c="white" style={{ opacity: 0.8 }}>
                  {currentStaging.room_type || 'Auto-detected'}
                </Text>
                {currentStaging.quality_score && (
                  <Text size="sm" c="white" style={{ opacity: 0.8 }}>
                    • Quality: {(currentStaging.quality_score * 100).toFixed(0)}%
                  </Text>
                )}
              </Group>
            )}
          </Group>

          <Group gap="sm">
            <Text size="sm" c="white" style={{ opacity: 0.8 }}>
              {batchStaging.completed} completed • {batchStaging.failed} failed • {batchStaging.processing} processing
            </Text>
            <ActionIcon
              size="lg"
              variant="subtle"
              color="white"
              onClick={onClose}
            >
              <IconX size={20} />
            </ActionIcon>
          </Group>
        </Group>
      </div>

      {/* Main content area */}
      <div
        style={{
          /* Let content size naturally with sensible caps so images aren't dwarfed by a huge canvas */
          maxHeight: 'calc(100vh - 120px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '80px 20px 40px',
          background: 'var(--pure-black)',
          overflow: 'hidden',
        }}
      >
        <AnimatePresence mode="wait">
          {currentStaging && (
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              style={{
                width: '100%',
                maxWidth: '1600px',
                /* Grid height adapts to tallest image container but never exceeds viewport cap */
                maxHeight: 'calc(100vh - 160px)',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                alignItems: 'start',
                gap: '24px',
              }}
            >
              {/* Before Image */}
              <Card
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  flexDirection: 'column',
                  /* Card adapts to image; avoids forcing full panel height */
                  maxHeight: 'calc(100vh - 220px)',
                }}
              >
                <Stack gap="md" style={{ height: '100%' }}>
                  <Group justify="space-between" style={{ flexShrink: 0 }}>
                    <Text size="lg" fw={600} c="white">
                      Original
                    </Text>
                    <Button
                      size="xs"
                      variant="subtle"
                      color="white"
                      leftSection={<IconDownload size={14} />}
                      onClick={() => {
                        const fullUrl = stagingApi.buildImageUrl(currentStaging.original_image_url);
                        const link = document.createElement('a');
                        link.href = fullUrl;
                        link.download = `original_${currentImageIndex + 1}.jpg`;
                        link.click();
                      }}
                    >
                      Download
                    </Button>
                  </Group>

                  <div
                    style={{
                      flex: 1,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      /* Keep container constrained to viewport without stretching */
                      maxHeight: 'calc(100vh - 260px)',
                    }}
                  >
                    <img
                      key={`${currentStaging.id}-original-${cacheBuster}`}
                      src={`${stagingApi.buildImageUrl(currentStaging.original_image_url)}?v=${cacheBuster}`}
                      alt="Original room"
                      loading="eager"
                      crossOrigin="anonymous"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 'calc(100vh - 260px)',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                      }}
                      onLoad={() => console.log('Original image loaded successfully')}
                      onError={(e) => {
                        const url = stagingApi.buildImageUrl(currentStaging.original_image_url);
                        console.error('Failed to load original image:', url);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.style.background = 'rgba(255,0,0,0.1)';
                      }}
                    />
                  </div>
                </Stack>
              </Card>

              {/* After Image */}
              <Card
                style={{
                  background: 'rgba(201, 169, 97, 0.1)',
                  border: '2px solid var(--warm-gold)',
                  display: 'flex',
                  flexDirection: 'column',
                  maxHeight: 'calc(100vh - 220px)',
                }}
              >
                <Stack gap="md" style={{ height: '100%' }}>
                  <Group justify="space-between" style={{ flexShrink: 0 }}>
                    <Group gap="sm">
                      <Text size="lg" fw={600} c="white">
                        Staged
                      </Text>
                      <div
                        style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          background: 'var(--warm-gold)',
                          color: 'var(--pure-black)',
                        }}
                      >
                        <Text size="xs" fw={600}>
                          PREMIUM
                        </Text>
                      </div>
                    </Group>
                    
                    <Button
                      size="xs"
                      variant="filled"
                      color="var(--warm-gold)"
                      leftSection={<IconDownload size={14} />}
                      onClick={() => {
                        if (currentStaging.staged_image_url) {
                          const fullUrl = stagingApi.buildImageUrl(currentStaging.staged_image_url);
                          const link = document.createElement('a');
                          link.href = fullUrl;
                          link.download = `staged_${currentImageIndex + 1}.jpg`;
                          link.click();
                        }
                      }}
                    >
                      Download
                    </Button>
                  </Group>

                  <div
                    style={{
                      flex: 1,
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: 'rgba(255, 255, 255, 0.05)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      maxHeight: 'calc(100vh - 260px)',
                    }}
                  >
                    <img
                      key={`${currentStaging.id}-staged-${cacheBuster}`}
                      src={`${stagingApi.buildImageUrl(currentStaging.staged_image_url || '')}?v=${cacheBuster}`}
                      alt="Staged room"
                      loading="eager"
                      crossOrigin="anonymous"
                      style={{
                        maxWidth: '100%',
                        maxHeight: 'calc(100vh - 260px)',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                      }}
                      onLoad={() => console.log('Staged image loaded successfully')}
                      onError={(e) => {
                        const url = stagingApi.buildImageUrl(currentStaging.staged_image_url || '');
                        console.error('Failed to load staged image:', url);
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement!.style.background = 'rgba(255,0,0,0.1)';
                      }}
                    />
                  </div>
                </Stack>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation controls */}
      {completedStagings.length > 1 && (
        <>
          {/* Left arrow */}
          <ActionIcon
            size="xl"
            variant="filled"
            color="rgba(255, 255, 255, 0.9)"
            style={{
              position: 'absolute',
              left: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={goToPrevious}
          >
            <IconChevronLeft size={24} color="white" />
          </ActionIcon>

          {/* Right arrow */}
          <ActionIcon
            size="xl"
            variant="filled"
            color="rgba(255, 255, 255, 0.9)"
            style={{
              position: 'absolute',
              right: '20px',
              top: '50%',
              transform: 'translateY(-50%)',
              zIndex: 10,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
            }}
            onClick={goToNext}
          >
            <IconChevronRight size={24} color="white" />
          </ActionIcon>
        </>
      )}

      {/* Bottom thumbnail navigation */}
      {completedStagings.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            padding: '12px',
            borderRadius: '12px',
            display: 'flex',
            gap: '8px',
            maxWidth: '90vw',
            overflow: 'auto',
          }}
        >
          {completedStagings.map((staging, index) => (
            <div
              key={staging.id}
              onClick={() => setCurrentImageIndex(index)}
              style={{
                width: '60px',
                height: '40px',
                borderRadius: '6px',
                overflow: 'hidden',
                border: index === currentImageIndex 
                  ? '2px solid var(--warm-gold)' 
                  : '1px solid rgba(255, 255, 255, 0.2)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <img
                src={`${stagingApi.buildImageUrl(staging.staged_image_url || '')}?v=${cacheBuster}`}
                alt={`Thumbnail ${index + 1}`}
                loading="eager"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
                onError={(e) => {
                  console.error('Failed to load thumbnail:', staging.staged_image_url);
                  e.currentTarget.style.background = 'rgba(255,0,0,0.1)';
                }}
              />
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
};

export default BatchResultsModal;
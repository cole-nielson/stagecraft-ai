import React, { useState, useMemo } from 'react';
import { Group, Text, Card, Stack, Progress, Grid, Badge, Image, Box, Center, Button } from '@mantine/core';
import { IconCheck, IconX, IconClock, IconPhoto, IconEye } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { BatchStaging, Staging } from '../types';
import BatchResultsModal from './BatchResultsModal';
import { stagingApi } from '../services/api';

interface BatchResultsProps {
  batchStaging: BatchStaging;
}

const BatchResults: React.FC<BatchResultsProps> = ({ batchStaging }) => {
  const [modalOpened, setModalOpened] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  
  const progressPercentage = (batchStaging.completed + batchStaging.failed) / batchStaging.total * 100;
  
  // Memoize completed stagings for consistent reference
  const completedStagings = useMemo(() => 
    batchStaging.stagings.filter(staging => 
      staging.status === 'completed' && staging.staged_image_url
    ),
    [batchStaging.stagings]
  );

  const handleImageClick = (staging: Staging) => {
    const index = completedStagings.findIndex(s => s.id === staging.id);
    if (index !== -1) {
      setSelectedImageIndex(index);
      setModalOpened(true);
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'var(--success-sage)';
      case 'failed':
        return 'var(--error-burgundy)';
      case 'processing':
        return 'var(--warm-gold)';
      default:
        return 'var(--charcoal)';
    }
  };

  const getBatchStatusText = () => {
    if (batchStaging.status === 'completed') {
      return `All ${batchStaging.total} images processed successfully!`;
    } else if (batchStaging.status === 'failed') {
      return `All ${batchStaging.total} images failed to process.`;
    } else if (batchStaging.status === 'partial') {
      return `${batchStaging.completed} completed, ${batchStaging.failed} failed, ${batchStaging.processing} processing`;
    } else {
      return `Processing ${batchStaging.total} images...`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card shadow="lg" padding="xl" radius="md" withBorder>
        <Stack gap="lg">
          {/* Batch Overview */}
          <div>
            <Group justify="space-between" mb="sm">
              <Text size="lg" fw={600} c="charcoal">
                Batch Processing Results
              </Text>
              <Badge
                color={getStatusColor(batchStaging.status)}
                variant="light"
                size="lg"
              >
                {batchStaging.status.toUpperCase()}
              </Badge>
            </Group>
            
            <Text size="sm" c="dimmed" mb="md">
              {getBatchStatusText()}
            </Text>

            <Progress
              value={progressPercentage}
              size="lg"
              radius="xl"
              color="var(--warm-gold)"
              mb="md"
            />

            <Group gap="xl" justify="center">
              <div style={{ textAlign: 'center' }}>
                <Text size="xl" fw={700} c="var(--success-sage)">
                  {batchStaging.completed}
                </Text>
                <Text size="xs" c="dimmed">Completed</Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text size="xl" fw={700} c="var(--warm-gold)">
                  {batchStaging.processing}
                </Text>
                <Text size="xs" c="dimmed">Processing</Text>
              </div>
              <div style={{ textAlign: 'center' }}>
                <Text size="xl" fw={700} c="var(--error-burgundy)">
                  {batchStaging.failed}
                </Text>
                <Text size="xs" c="dimmed">Failed</Text>
              </div>
            </Group>

            {/* View All Results Button */}
            {completedStagings.length > 0 && (
              <Group justify="center" mt="md">
                <Button
                  size="md"
                  leftSection={<IconEye size={18} />}
                  onClick={() => {
                    setSelectedImageIndex(0);
                    setModalOpened(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, var(--warm-gold) 0%, #D4AF37 100%)',
                    border: 'none',
                    color: 'var(--pure-black)',
                    fontWeight: 600,
                  }}
                >
                  View All Results ({completedStagings.length})
                </Button>
              </Group>
            )}
          </div>

          {/* Individual Images */}
          <div>
            <Text size="md" fw={500} mb="md" c="charcoal">
              Individual Results
            </Text>
            
            <Grid>
              {batchStaging.stagings.map((staging, index) => (
                <Grid.Col span={{ base: 12, sm: 6, md: 4 }} key={staging.id}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1, duration: 0.3 }}
                  >
                    <Card 
                      withBorder 
                      padding="md" 
                      radius="md"
                      style={{
                        cursor: staging.status === 'completed' && staging.staged_image_url ? 'pointer' : 'default',
                        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (staging.status === 'completed' && staging.staged_image_url) {
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 8px 25px rgba(27, 54, 93, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '';
                      }}
                      onClick={() => {
                        if (staging.status === 'completed' && staging.staged_image_url) {
                          handleImageClick(staging);
                        }
                      }}
                    >
                      <Stack gap="sm">
                        {/* Status Header */}
                        <Group justify="space-between">
                          <Group gap="xs">
                            {getStatusIcon(staging.status)}
                            <Text size="sm" fw={500}>
                              Image {index + 1}
                            </Text>
                            {staging.status === 'completed' && staging.staged_image_url && (
                              <IconEye size={14} color="var(--warm-gold)" />
                            )}
                          </Group>
                          <Badge
                            size="xs"
                            color={getStatusColor(staging.status)}
                            variant="dot"
                          >
                            {staging.status === 'completed' && staging.staged_image_url ? 'Click to view' : staging.status}
                          </Badge>
                        </Group>

                        {/* Images */}
                        <div>
                          <Group gap="xs" mb="xs">
                            {/* Original Image */}
                            <Box style={{ flex: 1 }}>
                              <Text size="xs" c="dimmed" mb="xs">Original</Text>
                              <div
                                style={{
                                  width: '100%',
                                  height: '80px',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  border: '1px solid var(--mantine-color-gray-3)',
                                }}
                              >
                                <img
                                  src={`${stagingApi.buildImageUrl(staging.original_image_url)}?v=${Date.now()}`}
                                  alt="Original"
                                  loading="eager"
                                  style={{
                                    width: '100%',
                                    height: '80px',
                                    objectFit: 'cover',
                                  }}
                                />
                              </div>
                            </Box>

                            {/* Staged Image */}
                            <Box style={{ flex: 1 }}>
                              <Text size="xs" c="dimmed" mb="xs">Staged</Text>
                              <div
                                style={{
                                  width: '100%',
                                  height: '80px',
                                  borderRadius: '8px',
                                  overflow: 'hidden',
                                  border: '1px solid var(--mantine-color-gray-3)',
                                  background: 'var(--mantine-color-gray-1)',
                                }}
                              >
                                {staging.staged_image_url ? (
                                  <img
                                    src={`${stagingApi.buildImageUrl(staging.staged_image_url)}?v=${Date.now()}`}
                                    alt="Staged"
                                    loading="eager"
                                    style={{
                                      width: '100%',
                                      height: '80px',
                                      objectFit: 'cover',
                                    }}
                                  />
                                ) : (
                                  <Center h={80}>
                                    <IconPhoto size={24} color="var(--mantine-color-gray-5)" />
                                  </Center>
                                )}
                              </div>
                            </Box>
                          </Group>
                        </div>

                        {/* Additional Info */}
                        {staging.status === 'completed' && staging.quality_score && (
                          <Group justify="space-between">
                            <Text size="xs" c="dimmed">Quality Score</Text>
                            <Text size="xs" fw={500}>
                              {(staging.quality_score * 100).toFixed(0)}%
                            </Text>
                          </Group>
                        )}

                        {staging.status === 'failed' && staging.error && (
                          <Text size="xs" c="var(--error-burgundy)">
                            {staging.error}
                          </Text>
                        )}

                        {staging.room_type && (
                          <Group justify="space-between">
                            <Text size="xs" c="dimmed">Room Type</Text>
                            <Text size="xs" fw={500}>
                              {staging.room_type}
                            </Text>
                          </Group>
                        )}
                      </Stack>
                    </Card>
                  </motion.div>
                </Grid.Col>
              ))}
            </Grid>
          </div>
        </Stack>
      </Card>

      {/* Batch Results Modal */}
      <BatchResultsModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        batchStaging={batchStaging}
        initialImageIndex={selectedImageIndex}
      />
    </motion.div>
  );
};

export default BatchResults;
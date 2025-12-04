import React, { useState } from 'react';
import { Card, Text, Group, Button, Stack, Image, Badge, Modal, Center } from '@mantine/core';
import { IconDownload, IconRefresh, IconCheck, IconClock, IconZoomIn } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { Staging } from '../types';
import { stagingApi, getFilenameFromPath } from '../services/api';

interface ResultsDisplayProps {
  staging: Staging;
  onTryAgain?: () => void;
  onStageAnother?: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  staging,
  onTryAgain,
  onStageAnother,
}) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [activeImage, setActiveImage] = useState<'original' | 'staged'>('staged');

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

  const originalImageUrl = stagingApi.getImageUrl(getFilenameFromPath(staging.original_image_url));
  const stagedImageUrl = staging.staged_image_url 
    ? stagingApi.getImageUrl(getFilenameFromPath(staging.staged_image_url))
    : '';

  const openImageModal = (imageType: 'original' | 'staged') => {
    setActiveImage(imageType);
    setImageModalOpen(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Stack gap="lg">
        {/* Header */}
        <Card
          padding="lg"
          radius="lg"
          shadow="sm"
          style={{
            background: 'linear-gradient(135deg, #38A169 0%, #48BB78 100%)',
            color: 'white',
          }}
        >
          <Group justify="space-between" align="center">
            <Group>
              <IconCheck size={24} color="white" />
              <div>
                <Text size="lg" fw={600} c="white">
                  Staging Complete!
                </Text>
                <Text size="sm" c="white" style={{ opacity: 0.9 }}>
                  Your professional luxury staging is ready
                </Text>
              </div>
            </Group>

            {staging.processing_time_ms && (
              <Group gap="xs">
                <IconClock size={16} color="white" />
                <Text size="sm" c="white">
                  {Math.round(staging.processing_time_ms / 1000)}s
                </Text>
              </Group>
            )}
          </Group>
        </Card>

        {/* Before & After Images */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: 'var(--space-xl)',
            alignItems: 'start',
          }}
        >
          {/* Original Image */}
          <Card
            padding="lg"
            radius="lg"
            shadow="sm"
            style={{ 
              position: 'relative', 
              cursor: 'pointer',
              border: '1px solid var(--light-gray)',
            }}
            onClick={() => openImageModal('original')}
          >
            <Stack gap="md">
              <Text size="lg" fw={600} c="charcoal" ta="center">
                Before
              </Text>
              <div 
                style={{ 
                  position: 'relative',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '2px solid var(--light-gray)',
                }}
              >
                <Image
                  src={originalImageUrl}
                  alt="Original room"
                  style={{
                    width: '100%',
                    height: 'auto',
                    minHeight: '300px',
                    transition: 'transform 0.3s ease',
                  }}
                  fit="contain"
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(0,0,0,0.7)',
                    borderRadius: '50%',
                    padding: '8px',
                    color: 'white',
                  }}
                >
                  <IconZoomIn size={18} />
                </div>
              </div>
            </Stack>
          </Card>

          {/* Staged Image */}
          <Card
            padding="lg"
            radius="lg"
            shadow="md"
            style={{ 
              position: 'relative', 
              cursor: 'pointer',
              border: '2px solid var(--warm-gold)',
            }}
            onClick={() => openImageModal('staged')}
          >
            <Stack gap="md">
              <Group justify="space-between" align="center">
                <Text size="lg" fw={600} c="charcoal">
                  After: AI Staged
                </Text>
                {staging.architectural_integrity && (
                  <Badge
                    color="sage"
                    variant="light"
                    size="sm"
                    leftSection={<IconCheck size={12} />}
                  >
                    Integrity Verified
                  </Badge>
                )}
              </Group>
              
              <div 
                style={{ 
                  position: 'relative',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  border: '2px solid var(--warm-gold)',
                }}
              >
                <Image
                  src={stagedImageUrl}
                  alt="Staged room"
                  style={{
                    width: '100%',
                    height: 'auto',
                    minHeight: '300px',
                    transition: 'transform 0.3s ease',
                    boxShadow: '0 8px 25px rgba(201, 169, 97, 0.2)',
                  }}
                  fit="contain"
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(201, 169, 97, 0.9)',
                    borderRadius: '50%',
                    padding: '8px',
                    color: 'white',
                  }}
                >
                  <IconZoomIn size={18} />
                </div>
              </div>
            </Stack>
          </Card>
        </div>

        {/* Quality Metrics */}
        {(staging.quality_score || staging.processing_time_ms) && (
          <Card padding="md" radius="md" shadow="sm">
            <Group justify="space-around">
              {staging.quality_score && (
                <div style={{ textAlign: 'center' }}>
                  <Text size="xl" fw={600} c="warmGold">
                    {Math.round(staging.quality_score * 100)}%
                  </Text>
                  <Text size="xs" c="dimmed">Quality Score</Text>
                </div>
              )}
              
              {staging.processing_time_ms && (
                <div style={{ textAlign: 'center' }}>
                  <Text size="xl" fw={600} c="sageNavy">
                    {Math.round(staging.processing_time_ms / 1000)}s
                  </Text>
                  <Text size="xs" c="dimmed">Processing Time</Text>
                </div>
              )}

              {staging.architectural_integrity !== undefined && (
                <div style={{ textAlign: 'center' }}>
                  <Text 
                    size="xl" 
                    fw={600} 
                    c={staging.architectural_integrity ? "sage" : "red"}
                  >
                    {staging.architectural_integrity ? "✓" : "⚠"}
                  </Text>
                  <Text size="xs" c="dimmed">Architecture</Text>
                </div>
              )}
            </Group>
          </Card>
        )}

        {/* Action Buttons */}
        <Group justify="center" gap="md">
          <Button
            variant="luxuryPrimary"
            leftSection={<IconDownload size={18} />}
            onClick={() => handleDownload(
              stagedImageUrl,
              `staged-${staging.style}-${Date.now()}.jpg`
            )}
            size="md"
          >
            Download Staging
          </Button>

          {onTryAgain && (
            <Button
              variant="luxurySecondary"
              leftSection={<IconRefresh size={18} />}
              onClick={onTryAgain}
              size="md"
            >
              Try Again
            </Button>
          )}

          {onStageAnother && (
            <Button
              variant="outline"
              onClick={onStageAnother}
              size="md"
              color="sageNavy"
            >
              Stage Another Room
            </Button>
          )}
        </Group>
      </Stack>

      {/* Image Modal */}
      <Modal
        opened={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
        size="xl"
        title={activeImage === 'original' ? 'Original Room' : 'Staged Room'}
        centered
      >
        <Center>
          <Image
            src={activeImage === 'original' ? originalImageUrl : stagedImageUrl}
            alt={activeImage === 'original' ? 'Original room' : 'Staged room'}
            radius="md"
            style={{ maxHeight: '70vh' }}
            fit="contain"
          />
        </Center>
      </Modal>
    </motion.div>
  );
};

export default ResultsDisplay;
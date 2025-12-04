import React from 'react';
import { Card, Text, Progress, Group, Stack, Center, Loader, Image } from '@mantine/core';
import { IconCheck, IconClock, IconWand } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProcessingStatesProps {
  isProcessing: boolean;
  estimatedTimeSeconds?: number;
  currentStage?: string;
  progress?: number;
  originalImageUrl?: string;
  uploadedFileName?: string;
  imageContainerHeight?: number;
}

const ProcessingIndicator: React.FC<{
  stage: string;
  isActive: boolean;
  isCompleted: boolean;
}> = ({ stage, isActive, isCompleted }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Group gap="md" align="center">
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isCompleted
              ? 'var(--success-sage)'
              : isActive
              ? 'var(--warm-gold)'
              : 'var(--light-gray)',
            transition: 'all 0.3s ease',
          }}
        >
          {isCompleted ? (
            <IconCheck size={14} color="white" />
          ) : isActive ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            >
              <IconWand size={14} color="white" />
            </motion.div>
          ) : (
            <div
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--warm-gray)',
              }}
            />
          )}
        </div>
        
        <Text
          size="sm"
          fw={isActive ? 600 : 400}
          c={isCompleted ? 'sage' : isActive ? 'charcoal' : 'dimmed'}
          style={{
            transition: 'all 0.3s ease',
          }}
        >
          {stage}
        </Text>
      </Group>
    </motion.div>
  );
};

const ProcessingStates: React.FC<ProcessingStatesProps> = ({
  isProcessing,
  estimatedTimeSeconds = 25,
  currentStage = 'Processing your luxury staging...',
  progress = 0,
  originalImageUrl,
  uploadedFileName,
  imageContainerHeight = 300,
}) => {
  const stages = [
    'Analyzing room layout and architecture...',
    'Selecting luxury furnishings and decor...',
    'Applying professional staging techniques...',
    'Finalizing high-resolution output...',
  ];

  const getCurrentStageIndex = () => {
    if (progress < 25) return 0;
    if (progress < 50) return 1;
    if (progress < 85) return 2;
    return 3;
  };

  const currentStageIndex = getCurrentStageIndex();

  if (!isProcessing) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        <Stack gap="lg">
          {/* Header */}
          <Card
            shadow="sm"
            padding="lg"
            radius="lg"
            style={{
              background: 'linear-gradient(135deg, #FEFDF8 0%, #F7FAFC 100%)',
              border: '1px solid rgba(201, 169, 97, 0.2)',
              textAlign: 'center',
            }}
          >
            <Group justify="center" mb="sm">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              >
                <IconWand size={32} color="var(--warm-gold)" />
              </motion.div>
              <div>
                <Text
                  size="xl"
                  fw={600}
                  c="charcoal"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Creating Your Staging
                </Text>
                <Text size="sm" c="dimmed">
                  Professional quality takes a moment...
                </Text>
              </div>
            </Group>

            {/* Progress Bar */}
            <div>
              <Group justify="space-between" mb="xs">
                <Text size="sm" c="dimmed">Progress</Text>
                <Group gap="xs">
                  <IconClock size={14} color="var(--warm-gray)" />
                  <Text size="sm" c="dimmed">
                    ~{Math.max(0, Math.ceil((estimatedTimeSeconds * (100 - progress)) / 100))}s remaining
                  </Text>
                </Group>
              </Group>
              
              <Progress
                value={progress}
                size="md"
                radius="md"
                styles={{
                  root: {
                    background: 'var(--light-gray)',
                  },
                  section: {
                    background: 'linear-gradient(90deg, var(--warm-gold) 0%, #D4AF37 100%)',
                    transition: 'width 0.5s ease',
                  },
                }}
              />
            </div>
          </Card>

          {/* Before & After Layout During Processing */}
          {originalImageUrl && (
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
                shadow="sm"
                padding="lg"
                radius="lg"
                style={{
                  background: 'var(--pure-white)',
                  border: '1px solid var(--light-gray)',
                }}
              >
                <Stack gap="md">
                  <div>
                    <Text size="lg" fw={600} c="charcoal" ta="center">
                      Your Original Image
                    </Text>
                    {uploadedFileName && (
                      <Text size="sm" c="dimmed" ta="center">
                        {uploadedFileName}
                      </Text>
                    )}
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
                      src={originalImageUrl}
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

              {/* Processing Staging */}
              <Card
                shadow="md"
                padding="lg"
                radius="lg"
                style={{
                  background: 'var(--pure-white)',
                  border: '2px solid var(--warm-gold)',
                }}
              >
                <Stack gap="md">
                  <div>
                    <Text size="lg" fw={600} c="charcoal" ta="center">
                      Staging in Progress
                    </Text>
                    <Text size="sm" c="dimmed" ta="center">
                      {stages[currentStageIndex]}
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
                    <Stack align="center" gap="lg">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      >
                        <IconWand size={48} color="var(--warm-gold)" />
                      </motion.div>
                      <div style={{ textAlign: 'center' }}>
                        <Text size="lg" c="warmGold" fw={600} mb="xs">
                          Generating Magic ✨
                        </Text>
                        <Text size="sm" c="dimmed" maw={250} ta="center">
                          Our technology is carefully placing furniture and decor to create the perfect staging
                        </Text>
                      </div>
                    </Stack>
                  </div>
                </Stack>
              </Card>
            </div>
          )}

          {/* Processing Stages - Compact Version */}
          <Card
            shadow="sm"
            padding="md"
            radius="lg"
            style={{
              background: 'var(--pure-white)',
              border: '1px solid var(--light-gray)',
            }}
          >
            <Stack gap="sm">
              {stages.map((stage, index) => (
                <ProcessingIndicator
                  key={stage}
                  stage={stage}
                  isActive={index === currentStageIndex}
                  isCompleted={index < currentStageIndex}
                />
              ))}
            </Stack>
          </Card>

          {/* Quality Guarantee */}
          <Card
            padding="md"
            radius="md"
            style={{
              background: 'rgba(56, 161, 105, 0.1)',
              border: '1px solid rgba(56, 161, 105, 0.2)',
            }}
          >
            <Group justify="center">
              <IconCheck size={18} color="var(--success-sage)" />
              <div>
                <Text size="sm" fw={500} c="charcoal">
                  Architectural Integrity Guaranteed
                </Text>
                <Text size="xs" c="dimmed">
                  We preserve all structural elements while adding staging
                </Text>
              </div>
            </Group>
          </Card>
        </Stack>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProcessingStates;
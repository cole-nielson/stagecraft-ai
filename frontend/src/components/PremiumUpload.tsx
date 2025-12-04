import React from 'react';
import { Dropzone, DropzoneProps, FileWithPath } from '@mantine/dropzone';
import { Group, Text, rem, Center, Stack } from '@mantine/core';
import { IconUpload, IconPhoto, IconX } from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface PremiumUploadProps extends Partial<DropzoneProps> {
  onDrop: (files: FileWithPath[]) => void;
  isLoading?: boolean;
  maxFiles?: number;
  multiple?: boolean;
}

const PremiumUpload: React.FC<PremiumUploadProps> = ({ 
  onDrop, 
  isLoading = false, 
  maxFiles = 1,
  multiple = false,
  ...props 
}) => {
  const iconSize = rem(50);
  const maxSize = 10 * 1024 * 1024; // 10MB

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Dropzone
        onDrop={onDrop}
        onReject={(files) => console.log('rejected files', files)}
        maxSize={maxSize}
        maxFiles={maxFiles}
        multiple={multiple}
        accept={{
          'image/*': ['.jpg', '.jpeg', '.png', '.webp'],
        }}
        disabled={isLoading}
        styles={{
          root: {
            background: 'linear-gradient(135deg, #FEFDF8 0%, #F7FAFC 100%)',
            border: '2px dashed #C9A961',
            borderRadius: '16px',
            padding: '3rem 2rem',
            transition: 'all 0.3s ease',
            cursor: 'pointer',
            minHeight: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            '&:hover': {
              borderColor: '#D4AF37',
              background: 'linear-gradient(135deg, #FEFDF8 0%, #F0F4F8 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 25px rgba(27, 54, 93, 0.15)',
            },
          },
          inner: {
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }
        }}
        {...props}
      >
        <Group justify="center" style={{ pointerEvents: 'none' }}>
          <Dropzone.Accept>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <IconUpload
                style={{ 
                  width: iconSize, 
                  height: iconSize, 
                  color: 'var(--success-sage)' 
                }}
                stroke={1.5}
              />
            </motion.div>
          </Dropzone.Accept>
          
          <Dropzone.Reject>
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <IconX
                style={{ 
                  width: iconSize, 
                  height: iconSize, 
                  color: 'var(--error-burgundy)' 
                }}
                stroke={1.5}
              />
            </motion.div>
          </Dropzone.Reject>
          
          <Dropzone.Idle>
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{ 
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <IconPhoto
                style={{ 
                  width: iconSize, 
                  height: iconSize, 
                  color: 'var(--warm-gold)' 
                }}
                stroke={1.5}
              />
            </motion.div>
          </Dropzone.Idle>

          <div>
            <Center>
              <Stack align="center" gap="xs">
                <Text 
                  size="xl" 
                  fw={600}
                  c="charcoal"
                  style={{ 
                    fontFamily: 'var(--font-heading)',
                    textAlign: 'center'
                  }}
                >
                  <Dropzone.Accept>Perfect! Drop your room photo{multiple ? 's' : ''} here</Dropzone.Accept>
                  <Dropzone.Reject>Please select valid image file{multiple ? 's' : ''}</Dropzone.Reject>
                  <Dropzone.Idle>Drop your room photo{multiple ? 's' : ''} here</Dropzone.Idle>
                </Text>
                
                <Text 
                  size="md" 
                  c="dimmed"
                  style={{ textAlign: 'center' }}
                >
                  <Dropzone.Idle>or click to browse your files</Dropzone.Idle>
                </Text>

                {!isLoading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <Group gap="xl" mt="md" justify="center">
                      <div style={{ textAlign: 'center' }}>
                        <Text size="sm" c="dimmed">💡</Text>
                        <Text size="xs" c="dimmed">High resolution preferred</Text>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Text size="sm" c="dimmed">🏠</Text>
                        <Text size="xs" c="dimmed">Empty rooms work best</Text>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <Text size="sm" c="dimmed">{multiple ? '📋' : '☀️'}</Text>
                        <Text size="xs" c="dimmed">{multiple ? `Up to ${maxFiles} images` : 'Natural lighting optimal'}</Text>
                      </div>
                    </Group>
                  </motion.div>
                )}
              </Stack>
            </Center>
          </div>
        </Group>

        {/* Subtle background pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `
              radial-gradient(circle at 20% 20%, rgba(201, 169, 97, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(27, 54, 93, 0.05) 0%, transparent 50%)
            `,
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />
      </Dropzone>
    </motion.div>
  );
};

export default PremiumUpload;
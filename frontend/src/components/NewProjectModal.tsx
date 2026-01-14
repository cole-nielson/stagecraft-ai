import React, { useState } from 'react';
import { Modal, TextInput, Textarea, Button, Stack, Text, Alert } from '@mantine/core';
import { IconFolder, IconAlertCircle } from '@tabler/icons-react';
import { useCreateProject } from '../hooks/useProjects';

interface NewProjectModalProps {
  opened: boolean;
  onClose: () => void;
  onProjectCreated: (projectId: string) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ opened, onClose, onProjectCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createProject = useCreateProject();

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setError(null);

    try {
      const project = await createProject.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
      });

      // Reset form and close modal
      setName('');
      setDescription('');
      onProjectCreated(project.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create project');
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError(null);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <IconFolder size={20} color="var(--warm-gold)" />
          <Text size="lg" fw={600} c="charcoal">
            Create New Project
          </Text>
        </div>
      }
      size="md"
      centered
      padding="xl"
    >
      <Stack gap="md">
        {error && (
          <Alert
            icon={<IconAlertCircle size={16} />}
            color="red"
            variant="light"
            withCloseButton
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        <TextInput
          label="Project Name"
          placeholder="e.g., Downtown Condo, Luxury Villa"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          required
          autoFocus
        />

        <Textarea
          label="Description (optional)"
          placeholder="Add notes about this project..."
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          minRows={2}
          maxRows={4}
        />

        <Button
          onClick={handleSubmit}
          loading={createProject.isPending}
          disabled={!name.trim()}
          fullWidth
          size="md"
          style={{
            background: 'linear-gradient(135deg, var(--warm-gold) 0%, #D4AF37 100%)',
            border: 'none',
          }}
        >
          Create Project
        </Button>
      </Stack>
    </Modal>
  );
};

export default NewProjectModal;

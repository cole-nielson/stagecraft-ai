import React from 'react';
import {
  Badge,
  Button,
  Card,
  Container,
  Divider,
  Grid,
  Group,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
} from '@mantine/core';
import {
  IconArrowRight,
  IconClockBolt,
  IconGauge,
  IconHome,
  IconLogin,
  IconShieldCheck,
  IconSparkles,
  IconUsers,
  IconWand,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

interface LandingPageProps {
  onLoginClick: () => void;
  onSignupClick: () => void;
  onLaunchClick: () => void;
  user?: { name?: string | null } | null;
}

const LandingPage: React.FC<LandingPageProps> = ({
  onLoginClick,
  onSignupClick,
  onLaunchClick,
  user,
}) => {
  const stats = [
    { label: 'Avg. turnaround', value: '25s', detail: 'per room with parallel workers' },
    { label: 'Cost reduction', value: '92%', detail: 'vs traditional staging crews' },
    { label: 'Image fidelity', value: '4K', detail: 'marketing-ready exports' },
    { label: 'Daily capacity', value: '10+', detail: 'batch images processed at once' },
  ];

  const differentiators = [
    {
      icon: <IconShieldCheck size={22} />,
      title: 'Architecture-safe output',
      copy: 'Walls, windows, and fixtures stay untouched—only premium furniture is added.',
    },
    {
      icon: <IconClockBolt size={22} />,
      title: 'Built for fast turnarounds',
      copy: 'Celery workers and Redis-backed storage keep results flowing in real time.',
    },
    {
      icon: <IconGauge size={22} />,
      title: 'Operational control',
      copy: 'Rate limits, health checks, and clear statuses make demos reliable and predictable.',
    },
  ];

  const steps = [
    {
      title: 'Upload any empty room',
      description: 'Drag & drop up to 10 spaces at once. We validate resolution and prep files automatically.',
    },
    {
      title: 'AI staging with integrity',
      description: 'Gemini renders luxury-grade furnishings while preserving the original shell and perspective.',
    },
    {
      title: 'Share instantly',
      description: 'Poll for progress, download staged images, and ship listings the same day.',
    },
  ];

  return (
    <div
      style={{
        background: 'radial-gradient(circle at 20% 20%, rgba(201, 169, 97, 0.12), transparent 32%), radial-gradient(circle at 80% 10%, rgba(27, 54, 93, 0.18), transparent 30%), linear-gradient(145deg, #0f172a 0%, #0f1f35 22%, #0f243d 40%, #fefcf6 100%)',
        minHeight: '100vh',
        color: 'var(--pure-white)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: 'radial-gradient(circle at 60% 40%, rgba(255,255,255,0.05), transparent 45%)',
        }}
      />

      <Container size="xl" py={48} style={{ position: 'relative', zIndex: 1 }}>
        {/* Top navigation */}
        <Group justify="space-between" align="center" mb={48}>
          <Group gap="xs">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                background: 'linear-gradient(135deg, var(--warm-gold) 0%, #d5b563 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0f172a',
                fontWeight: 700,
              }}
            >
              ✨
            </div>
            <div>
              <Text
                fw={700}
                size="lg"
                style={{
                  fontFamily: 'var(--font-heading)',
                  background: 'linear-gradient(135deg, #f2e3c6 0%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                StageCraft AI
              </Text>
              <Text size="xs" c="rgba(255,255,255,0.7)">
                Virtual staging for luxury listings
              </Text>
            </div>
          </Group>

          <Group gap="sm">
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconLogin size={16} />}
              onClick={onLoginClick}
              styles={{
                root: { color: '#e2e8f0' },
              }}
            >
              {user ? 'Go to app' : 'Log in'}
            </Button>
            <Button
              variant="filled"
              onClick={onSignupClick}
              rightSection={<IconArrowRight size={16} />}
              styles={{
                root: {
                  background: 'linear-gradient(135deg, var(--warm-gold) 0%, #d4b26a 100%)',
                  color: '#0f172a',
                  border: 'none',
                },
              }}
            >
              Sign up free
            </Button>
          </Group>
        </Group>

        {/* Hero */}
        <Grid gutter="xl" align="center">
          <Grid.Col span={{ base: 12, md: 6 }}>
            <Stack gap="lg">
              <Badge
                size="lg"
                variant="light"
                radius="md"
                color="gray"
                leftSection={<IconSparkles size={16} />}
                styles={{
                  root: { background: 'rgba(255,255,255,0.08)', color: '#f8fafc', border: '1px solid rgba(255,255,255,0.12)' },
                }}
              >
                AI staging built for real estate teams
              </Badge>

              <Text
                className="heading-xl"
                style={{
                  color: '#fefcf6',
                  lineHeight: 1.05,
                  letterSpacing: '-0.02em',
                  fontSize: '3.25rem',
                }}
              >
                Dress every empty room with photoreal luxury in seconds.
              </Text>

              <Text size="lg" c="rgba(255,255,255,0.72)" maw={560}>
                StageCraft blends premium furnishings into your raw photos while preserving architecture, perspective, and lighting. Built for listings that need to look move-in ready today.
              </Text>

              <Group gap="md">
                <Button
                  size="lg"
                  onClick={onLaunchClick}
                  rightSection={<IconArrowRight size={18} />}
                  styles={{
                    root: {
                      background: 'linear-gradient(135deg, var(--warm-gold) 0%, #dcbf7a 100%)',
                      color: '#0f172a',
                      border: 'none',
                      paddingInline: 28,
                    },
                  }}
                >
                  Launch staging
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  color="gray"
                  onClick={onLoginClick}
                  styles={{
                    root: {
                      color: '#e2e8f0',
                      borderColor: 'rgba(255,255,255,0.2)',
                      background: 'rgba(255,255,255,0.04)',
                    },
                  }}
                >
                  View my library
                </Button>
              </Group>

              <Group gap="xl" mt="sm">
                <Group gap="xs">
                  <ThemeIcon size="sm" radius="xl" color="green" variant="light">
                    <IconSparkles size={14} />
                  </ThemeIcon>
                  <Text size="sm" c="rgba(255,255,255,0.72)">
                    No credit card needed
                  </Text>
                </Group>
                <Group gap="xs">
                  <ThemeIcon size="sm" radius="xl" color="blue" variant="light">
                    <IconHome size={14} />
                  </ThemeIcon>
                  <Text size="sm" c="rgba(255,255,255,0.72)">
                    Optimized for $1M+ listings
                  </Text>
                </Group>
              </Group>
            </Stack>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 6 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card
                padding="lg"
                radius="lg"
                withBorder
                shadow="xl"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(16px)',
                }}
              >
                <Stack gap="lg">
                  <Group justify="space-between" align="center">
                    <Group gap="xs">
                      <ThemeIcon size="lg" radius="md" color="yellow" variant="light">
                        <IconWand size={20} />
                      </ThemeIcon>
                      <div>
                        <Text fw={600} c="#f8fafc">
                          StageCraft preview
                        </Text>
                        <Text size="sm" c="rgba(255,255,255,0.6)">
                          Architecture-safe AI overlays
                        </Text>
                      </div>
                    </Group>
                    <Badge
                      color="yellow"
                      variant="light"
                      styles={{ root: { background: 'rgba(233, 196, 106, 0.16)', color: '#fef3c7' } }}
                    >
                      Live demo
                    </Badge>
                  </Group>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                    }}
                  >
                    <Paper
                      radius="md"
                      style={{
                        background: 'linear-gradient(160deg, #101828 0%, #0f2137 60%, #1f2937 100%)',
                        padding: 12,
                        border: '1px solid rgba(255,255,255,0.05)',
                        minHeight: 220,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Text size="sm" fw={600} c="#e2e8f0">
                        Before
                      </Text>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.08), transparent 40%), linear-gradient(145deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)',
                        }}
                      />
                    </Paper>

                    <Paper
                      radius="md"
                      style={{
                        background: 'linear-gradient(160deg, #0f1f35 0%, #163252 60%, #1e4066 100%)',
                        padding: 12,
                        border: '1px solid rgba(255,255,255,0.08)',
                        minHeight: 220,
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <Text size="sm" fw={600} c="#e2e8f0">
                        After with StageCraft
                      </Text>
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'radial-gradient(circle at 70% 40%, rgba(201,169,97,0.26), transparent 45%), linear-gradient(135deg, rgba(201,169,97,0.35), rgba(255,255,255,0.05))',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 12,
                          right: 12,
                          background: 'rgba(255,255,255,0.1)',
                          padding: '8px 12px',
                          borderRadius: 12,
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255,255,255,0.18)',
                        }}
                      >
                        <Group gap="xs">
                          <ThemeIcon size="sm" radius="xl" color="yellow" variant="light">
                            <IconHome size={14} />
                          </ThemeIcon>
                          <Text size="xs" c="#fefcf6">
                            Modern lounge layout
                          </Text>
                        </Group>
                      </div>
                    </Paper>
                  </div>

                  <Divider color="rgba(255,255,255,0.1)" />

                  <Group justify="space-between">
                    <Group gap="md">
                      <Group gap="xs">
                        <ThemeIcon size="md" radius="xl" color="green" variant="light">
                          <IconClockBolt size={16} />
                        </ThemeIcon>
                        <div>
                          <Text size="sm" fw={600} c="#f8fafc">
                            25 seconds
                          </Text>
                          <Text size="xs" c="rgba(255,255,255,0.6)">
                            Avg. render time per room
                          </Text>
                        </div>
                      </Group>
                      <Group gap="xs">
                        <ThemeIcon size="md" radius="xl" color="blue" variant="light">
                          <IconUsers size={16} />
                        </ThemeIcon>
                        <div>
                          <Text size="sm" fw={600} c="#f8fafc">
                            Team ready
                          </Text>
                          <Text size="xs" c="rgba(255,255,255,0.6)">
                            OAuth and usage controls baked in
                          </Text>
                        </div>
                      </Group>
                    </Group>
                    <Button
                      variant="white"
                      size="sm"
                      onClick={onLaunchClick}
                      rightSection={<IconArrowRight size={14} />}
                    >
                      See it in action
                    </Button>
                  </Group>
                </Stack>
              </Card>
            </motion.div>
          </Grid.Col>
        </Grid>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} spacing="lg" mt={56}>
          {stats.map((stat) => (
            <Card
              key={stat.label}
              padding="lg"
              radius="lg"
              withBorder
              style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.08)' }}
            >
              <Stack gap="xs">
                <Text size="xs" c="rgba(255,255,255,0.65)">
                  {stat.label}
                </Text>
                <Text
                  fw={700}
                  size="xl"
                  style={{
                    color: '#fefcf6',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {stat.value}
                </Text>
                <Text size="sm" c="rgba(255,255,255,0.65)">
                  {stat.detail}
                </Text>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>

        {/* Differentiators */}
        <Stack gap="lg" mt={72}>
          <Group justify="space-between" align="flex-end">
            <Stack gap={4}>
              <Text
                className="heading-lg"
                style={{ color: '#fefcf6', fontSize: '2.25rem', letterSpacing: '-0.01em' }}
              >
                Why StageCraft stands out
              </Text>
              <Text size="md" c="rgba(255,255,255,0.75)">
                Enterprise-grade controls with boutique design sensibilities.
              </Text>
            </Stack>
            <Button
              variant="outline"
              color="gray"
              size="md"
              onClick={onSignupClick}
              styles={{
                root: {
                  color: '#e2e8f0',
                  borderColor: 'rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.04)',
                },
              }}
            >
              Create an account
            </Button>
          </Group>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="lg">
            {differentiators.map((item) => (
              <Card
                key={item.title}
                padding="lg"
                radius="lg"
                withBorder
                style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.08)' }}
              >
                <Stack gap="sm">
                  <ThemeIcon size="lg" radius="md" color="yellow" variant="light">
                    {item.icon}
                  </ThemeIcon>
                  <Text fw={600} size="lg" c="#fefcf6" style={{ fontFamily: 'var(--font-heading)' }}>
                    {item.title}
                  </Text>
                  <Text size="sm" c="rgba(255,255,255,0.7)">
                    {item.copy}
                  </Text>
                </Stack>
              </Card>
            ))}
          </SimpleGrid>
        </Stack>

        {/* Workflow */}
        <Stack gap="lg" mt={80}>
          <Stack gap={4}>
            <Text
              className="heading-lg"
              style={{ color: '#fefcf6', fontSize: '2rem', letterSpacing: '-0.01em' }}
            >
              How it works
            </Text>
            <Text size="md" c="rgba(255,255,255,0.7)">
              A guided, transparent flow from upload to download.
            </Text>
          </Stack>

          <Grid gutter="lg" align="stretch">
            {steps.map((step, index) => (
              <Grid.Col key={step.title} span={{ base: 12, md: 4 }}>
                <Card
                  padding="lg"
                  radius="lg"
                  withBorder
                  style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.08)', height: '100%' }}
                >
                  <Stack gap="sm">
                    <Badge
                      variant="light"
                      color="yellow"
                      styles={{ root: { background: 'rgba(233, 196, 106, 0.16)', color: '#fef3c7' } }}
                    >
                      Step {index + 1}
                    </Badge>
                    <Text fw={600} size="lg" c="#fefcf6" style={{ fontFamily: 'var(--font-heading)' }}>
                      {step.title}
                    </Text>
                    <Text size="sm" c="rgba(255,255,255,0.7)">
                      {step.description}
                    </Text>
                  </Stack>
                </Card>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>

        {/* Closing CTA */}
        <Card
          radius="lg"
          padding="xl"
          shadow="xl"
          mt={96}
          style={{
            background: 'linear-gradient(135deg, var(--warm-gold) 0%, #d4b26a 100%)',
            color: '#0f172a',
            border: 'none',
          }}
        >
          <Grid align="center">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="sm">
                <Text
                  className="heading-lg"
                  style={{ color: '#0f172a', fontSize: '2rem', letterSpacing: '-0.01em' }}
                >
                  Ready to see your listings fully staged?
                </Text>
                <Text size="md" c="#1f2937">
                  Launch the staging workspace, or create an account to save every render.
                </Text>
              </Stack>
            </Grid.Col>
            <Grid.Col span={{ base: 12, md: 4 }}>
              <Group justify="flex-end" gap="md">
                <Button
                  size="md"
                  variant="white"
                  onClick={onLaunchClick}
                  rightSection={<IconArrowRight size={16} />}
                >
                  Open workspace
                </Button>
                <Button
                  size="md"
                  variant="outline"
                  color="dark"
                  onClick={onSignupClick}
                  styles={{ root: { borderColor: '#0f172a', color: '#0f172a' } }}
                >
                  Sign up
                </Button>
              </Group>
            </Grid.Col>
          </Grid>
        </Card>
      </Container>
    </div>
  );
};

export default LandingPage;

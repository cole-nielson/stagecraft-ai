import React from 'react';
import { Container, Stack, Text, Group, Button, Card, Grid, Center } from '@mantine/core';
import { IconArrowRight, IconCheck, IconWand, IconHome, IconTrendingUp } from '@tabler/icons-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const LandingPage: React.FC = () => {
  const features = [
    {
      icon: <IconWand size={32} />,
      title: 'Advanced Staging',
      description: 'Advanced technology transforms empty rooms into beautifully staged spaces in seconds',
    },
    {
      icon: <IconHome size={32} />,
      title: 'Architectural Integrity',
      description: 'Never modifies structural elements - only adds luxury furnishings and decor',
    },
    {
      icon: <IconTrendingUp size={32} />,
      title: 'Luxury Focus',
      description: 'Specifically designed for high-end properties and real estate professionals',
    },
  ];

  const benefits = [
    'Professional-quality results in under 30 seconds',
    '4K marketing-ready resolution',
    'Architectural preservation guaranteed',
    'Three sophisticated staging styles',
    'Perfect for $1M+ property listings',
    'No subscription required',
  ];

  return (
    <div style={{ 
      background: 'linear-gradient(135deg, #FEFDF8 0%, #F7FAFC 100%)',
      minHeight: '100vh'
    }}>
      {/* Hero Section */}
      <Container size="xl" py={80}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Center>
            <Stack align="center" gap="xl" maw={800}>
              <div style={{ textAlign: 'center' }}>
                <Text
                  className="heading-xl"
                  ta="center"
                  mb="lg"
                  style={{
                    background: 'linear-gradient(135deg, var(--sage-navy) 0%, var(--warm-gold) 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  StageCraft
                </Text>
                
                <Text
                  size="xl"
                  c="charcoal"
                  ta="center"
                  mb="lg"
                  style={{ 
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.5rem',
                    lineHeight: 1.3
                  }}
                >
                  The most sophisticated staging tool for luxury real estate professionals
                </Text>

                <Text
                  size="lg"
                  c="dimmed"
                  ta="center"
                  mb="xl"
                  maw={600}
                  mx="auto"
                >
                  Transform empty properties into beautifully staged spaces that sell faster 
                  and for higher prices. Built specifically for real estate agents who demand premium results.
                </Text>
              </div>

              <Group justify="center" gap="md">
                <Button
                  component={Link}
                  to="/staging"
                  variant="luxuryPrimary"
                  size="lg"
                  rightSection={<IconArrowRight size={18} />}
                  style={{
                    fontSize: '1.125rem',
                    padding: '16px 32px',
                  }}
                >
                  Start Staging
                </Button>

                <Button
                  variant="luxurySecondary"
                  size="lg"
                  onClick={() => {
                    document.getElementById('examples')?.scrollIntoView({ 
                      behavior: 'smooth' 
                    });
                  }}
                  style={{
                    fontSize: '1.125rem',
                    padding: '16px 32px',
                  }}
                >
                  View Examples
                </Button>
              </Group>

              {/* Trust Indicators */}
              <Text size="sm" c="dimmed" ta="center" mt="lg">
                Trusted by top real estate professionals
              </Text>
            </Stack>
          </Center>
        </motion.div>
      </Container>

      {/* Features Section */}
      <Container size="xl" py={80}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Stack align="center" gap="xl">
            <div style={{ textAlign: 'center' }}>
              <Text
                className="heading-lg"
                ta="center"
                mb="md"
                c="charcoal"
              >
                Professional Staging Made Simple
              </Text>
              <Text size="lg" c="dimmed" ta="center" maw={600} mx="auto">
                Our technology understands luxury real estate and creates staging that enhances property value
              </Text>
            </div>

            <Grid gutter="xl" style={{ width: '100%' }}>
              {features.map((feature, index) => (
                <Grid.Col key={feature.title} span={{ base: 12, md: 4 }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <Card
                      shadow="md"
                      padding="xl"
                      radius="lg"
                      h="100%"
                      className="luxury-card"
                      style={{
                        textAlign: 'center',
                        background: 'var(--pure-white)',
                      }}
                    >
                      <Stack align="center" gap="md">
                        <div
                          style={{
                            color: 'var(--warm-gold)',
                            padding: 'var(--space-md)',
                            borderRadius: '50%',
                            background: 'rgba(201, 169, 97, 0.1)',
                          }}
                        >
                          {feature.icon}
                        </div>
                        
                        <Text
                          size="lg"
                          fw={600}
                          c="charcoal"
                          style={{ fontFamily: 'var(--font-heading)' }}
                        >
                          {feature.title}
                        </Text>
                        
                        <Text size="sm" c="dimmed" ta="center" lh={1.6}>
                          {feature.description}
                        </Text>
                      </Stack>
                    </Card>
                  </motion.div>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </motion.div>
      </Container>

      {/* Benefits Section */}
      <Container size="xl" py={80}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: 'var(--space-3xl)',
              alignItems: 'center',
            }}
          >
            <div>
              <Text
                className="heading-lg"
                mb="lg"
                c="charcoal"
              >
                Why Choose StageCraft?
              </Text>
              
              <Stack gap="md">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={benefit}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * index }}
                  >
                    <Group gap="md" align="flex-start">
                      <div
                        style={{
                          marginTop: '2px',
                          color: 'var(--success-sage)',
                        }}
                      >
                        <IconCheck size={18} />
                      </div>
                      <Text size="md" c="charcoal" style={{ flex: 1 }}>
                        {benefit}
                      </Text>
                    </Group>
                  </motion.div>
                ))}
              </Stack>
            </div>

            <Card
              shadow="xl"
              padding="xl"
              radius="lg"
              style={{
                background: 'linear-gradient(135deg, var(--sage-navy) 0%, #2D3748 100%)',
                color: 'white',
              }}
            >
              <Stack gap="lg" align="center" ta="center">
                <Text
                  size="xl"
                  fw={600}
                  c="white"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  Ready to Transform Your Listings?
                </Text>
                
                <Text size="md" c="white" style={{ opacity: 0.9 }}>
                  Join real estate professionals who trust StageCraft to create 
                  stunning property presentations that close deals faster.
                </Text>
                
                <Button
                  component={Link}
                  to="/staging"
                  variant="luxuryPrimary"
                  size="lg"
                  rightSection={<IconArrowRight size={18} />}
                  style={{ marginTop: 'var(--space-md)' }}
                >
                  Start Your First Staging
                </Button>
              </Stack>
            </Card>
          </div>
        </motion.div>
      </Container>

      {/* Examples Placeholder */}
      <Container size="xl" py={80} id="examples">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Stack align="center" gap="xl">
            <div style={{ textAlign: 'center' }}>
              <Text
                className="heading-lg"
                ta="center"
                mb="md"
                c="charcoal"
              >
                See the Transformation
              </Text>
              <Text size="lg" c="dimmed" ta="center" maw={600} mx="auto">
                Before and after examples of our luxury staging in action
              </Text>
            </div>

            <Card
              shadow="md"
              padding="xl"
              radius="lg"
              style={{
                background: 'var(--pure-white)',
                textAlign: 'center',
                minHeight: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px dashed var(--light-gray)',
              }}
            >
              <Stack align="center" gap="md">
                <IconHome size={64} color="var(--warm-gray)" />
                <Text size="lg" c="dimmed">
                  Example gallery coming soon
                </Text>
                <Text size="sm" c="dimmed">
                  Upload your first room to see StageCraft in action
                </Text>
                <Button
                  component={Link}
                  to="/staging"
                  variant="luxuryPrimary"
                  mt="md"
                >
                  Try It Now
                </Button>
              </Stack>
            </Card>
          </Stack>
        </motion.div>
      </Container>
    </div>
  );
};

export default LandingPage;
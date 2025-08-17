'use client';

import { useState } from 'react';
import {
  Stack,
  Title,
  Text,
  Group,
  Button,
  Modal,
  Alert,
} from '@mantine/core';
import {
  IconArrowLeft,
  IconPlus,
  IconAlertTriangle,
} from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import TemplateGallery from '@/components/areas/TemplateGallery';
import type { AreaTemplate, TemplateCustomizations } from '@/types/area-template';
import { getParaColor } from '@/lib/theme';

export default function AreaTemplatesPage() {
  const router = useRouter();
  const [selectedTemplate, setSelectedTemplate] = useState<AreaTemplate | null>(null);
  const [customizations, setCustomizations] = useState<TemplateCustomizations>({});
  const [applyModalOpened, { open: openApplyModal, close: closeApplyModal }] = useDisclosure(false);
  const [applying, setApplying] = useState(false);

  const handleTemplateSelect = async (template: AreaTemplate, templateCustomizations?: TemplateCustomizations) => {
    setSelectedTemplate(template);
    setCustomizations(templateCustomizations || {});
    openApplyModal();
  };

  const handleApplyTemplate = async () => {
    if (!selectedTemplate) return;

    setApplying(true);
    try {
      // First, apply the template to get the area data
      const templateResponse = await fetch('/api/areas/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          customizations,
        }),
      });

      if (!templateResponse.ok) {
        throw new Error('Failed to process template');
      }

      const templateData = await templateResponse.json();
      const areaData = templateData.data.areaData;

      // Create the area
      const createResponse = await fetch('/api/areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...areaData,
          // Apply customizations
          ...customizations.area,
        }),
      });

      if (!createResponse.ok) {
        throw new Error('Failed to create area');
      }

      const createData = await createResponse.json();
      const newAreaId = createData.data.area.id;

      // If template includes standards, create them
      if (selectedTemplate.template.standards.length > 0 && customizations.includeStandards !== false) {
        try {
          await fetch(`/api/areas/${newAreaId}/standards`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              standards: selectedTemplate.template.standards,
            }),
          });
        } catch (error) {
          console.warn('Failed to create standards:', error);
        }
      }

      // If template includes sub-interests, create them
      if (selectedTemplate.template.subInterests.length > 0 && customizations.includeSubInterests !== false) {
        try {
          for (const subInterest of selectedTemplate.template.subInterests) {
            await fetch(`/api/areas/${newAreaId}/sub-interests`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                title: subInterest.title,
                description: subInterest.description,
                tags: subInterest.tags,
              }),
            });
          }
        } catch (error) {
          console.warn('Failed to create sub-interests:', error);
        }
      }

      // If template includes initial content, create it
      if (selectedTemplate.template.initialContent && customizations.includeInitialContent !== false) {
        const { projects, resources, notes } = selectedTemplate.template.initialContent;

        // Create projects
        if (projects.length > 0) {
          try {
            for (const project of projects) {
              await fetch('/api/projects', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...project,
                  areaIds: [newAreaId],
                }),
              });
            }
          } catch (error) {
            console.warn('Failed to create template projects:', error);
          }
        }

        // Create resources
        if (resources.length > 0) {
          try {
            for (const resource of resources) {
              await fetch('/api/resources', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...resource,
                  areaIds: [newAreaId],
                }),
              });
            }
          } catch (error) {
            console.warn('Failed to create template resources:', error);
          }
        }

        // Create notes
        if (notes.length > 0) {
          try {
            for (const note of notes) {
              await fetch('/api/notes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  ...note,
                  areaIds: [newAreaId],
                }),
              });
            }
          } catch (error) {
            console.warn('Failed to create template notes:', error);
          }
        }
      }

      notifications.show({
        title: 'Area Created',
        message: `"${areaData.title}" has been created successfully from template`,
        color: 'green',
      });

      closeApplyModal();
      router.push(`/areas/${newAreaId}`);

    } catch (error) {
      console.error('Error applying template:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to create area from template. Please try again.',
        color: 'red',
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <Stack gap="lg">
      {/* Header */}
      <Group justify="space-between">
        <Stack gap="xs">
          <Group gap="sm">
            <Button
              component={Link}
              href="/areas"
              variant="subtle"
              leftSection={<IconArrowLeft size="1rem" />}
              size="sm"
            >
              Back to Areas
            </Button>
          </Group>
          <Title order={1} c={getParaColor('areas')}>
            Area Templates
          </Title>
          <Text c="dimmed" size="sm">
            Choose from predefined templates to quickly set up new areas with standards, structure, and initial content
          </Text>
        </Stack>
        
        <Button
          component={Link}
          href="/areas/new"
          leftSection={<IconPlus size="1rem" />}
          variant="outline"
          color={getParaColor('areas')}
        >
          Create Custom Area
        </Button>
      </Group>

      {/* Template Gallery */}
      <TemplateGallery
        onTemplateSelect={handleTemplateSelect}
      />

      {/* Apply Template Modal */}
      <Modal
        opened={applyModalOpened}
        onClose={closeApplyModal}
        title={`Apply Template: ${selectedTemplate?.name}`}
        size="md"
        centered
      >
        <Stack gap="md">
          {selectedTemplate && (
            <>
              <Text size="sm" c="dimmed">
                {selectedTemplate.description}
              </Text>
              
              <Alert color="blue" icon={<IconAlertTriangle size="1rem" />}>
                This will create a new area with the template's structure, standards, and initial content.
              </Alert>

              <Group justify="flex-end">
                <Button variant="outline" onClick={closeApplyModal}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleApplyTemplate}
                  loading={applying}
                  color={getParaColor('areas')}
                >
                  Create Area
                </Button>
              </Group>
            </>
          )}
        </Stack>
      </Modal>
    </Stack>
  );
}

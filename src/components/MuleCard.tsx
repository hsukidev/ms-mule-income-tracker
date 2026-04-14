import { useState } from 'react';
import {
  Card,
  Text,
  Group,
  TextInput,
  NumberInput,
  ActionIcon,
  Badge,
  Button,
  Divider,
  Alert,
  Stack,
} from '@mantine/core';
import { useMantineColorScheme } from '@mantine/core';
import { IconTrash, IconChevronDown, IconChevronUp, IconGripVertical } from '@tabler/icons-react';
import type { Mule } from '../types';
import { calculatePotentialIncome, bosses } from '../data/bosses';
import { formatMeso } from '../utils/meso';
import { BossChecklist } from './BossChecklist';

interface MuleCardProps {
  mule: Mule;
  expanded: boolean;
  onExpandChange: (expanded: boolean) => void;
  onUpdate: (id: string, updates: Partial<Omit<Mule, 'id'>>) => void;
  onDelete: (id: string) => void;
  dragHandleProps?: Record<string, unknown>;
}

export function MuleCard({ mule, expanded, onExpandChange, onUpdate, onDelete, dragHandleProps }: MuleCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { colorScheme } = useMantineColorScheme();
  const potentialIncome = calculatePotentialIncome(mule.selectedBosses);

  const selectedBossNames = mule.selectedBosses
    .map((id) => bosses.find((b) => b.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <Card shadow="sm" radius="md" withBorder>
      <Group justify="space-between" wrap="nowrap">
        <Group gap="xs" style={{ cursor: 'grab' }} {...(dragHandleProps as React.HTMLAttributes<HTMLDivElement>)}>
          <IconGripVertical size={16} style={{ color: 'var(--mantine-color-dimmed)' }} />
        </Group>
        <Group
          gap="sm"
          style={{ cursor: 'pointer', flex: 1, minWidth: 0 }}
          onClick={() => onExpandChange(!expanded)}
        >
          <div style={{ minWidth: 0 }}>
            <Text fw={600} size="lg" truncate>
              {mule.name || 'Unnamed Mule'}
            </Text>
            <Group gap="xs">
              {mule.muleClass && (
                <Badge variant="light" size="sm">{mule.muleClass}</Badge>
              )}
              {mule.level > 0 && (
                <Badge variant="outline" size="sm">Lv. {mule.level}</Badge>
              )}
              <Text size="sm" fw={700} c={colorScheme === 'dark' ? 'yellow' : 'orange'}>
                {formatMeso(potentialIncome)}/week
              </Text>
            </Group>
          </div>
        </Group>
        <ActionIcon
          variant="subtle"
          onClick={() => onExpandChange(!expanded)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
        </ActionIcon>
      </Group>

      {!expanded && selectedBossNames.length > 0 && (
        <Group gap={4} mt="xs" wrap="wrap">
          {selectedBossNames.map((name) => (
            <Badge key={name} size="xs" variant="dot">{name}</Badge>
          ))}
        </Group>
      )}

      {expanded && (
        <>
          <Divider my="sm" />
          <Stack gap="md">
            <Group grow>
              <TextInput
                label="Character Name"
                placeholder="Enter name"
                value={mule.name}
                onChange={(e) => onUpdate(mule.id, { name: e.currentTarget.value })}
              />
              <NumberInput
                label="Level"
                placeholder="Level"
                value={mule.level || undefined}
                onChange={(val) => onUpdate(mule.id, { level: typeof val === 'number' ? val : 0 })}
                min={0}
              />
              <TextInput
                label="Class"
                placeholder="Enter class"
                value={mule.muleClass}
                onChange={(e) => onUpdate(mule.id, { muleClass: e.currentTarget.value })}
              />
            </Group>

            <Text size="sm" fw={600}>
              Bosses ({selectedBossNames.length} selected — {formatMeso(potentialIncome)}/week)
            </Text>

            <BossChecklist
              selectedBosses={mule.selectedBosses}
              onChange={(selectedBosses) => onUpdate(mule.id, { selectedBosses })}
            />

            {confirmDelete ? (
              <Alert color="red">
                <Group justify="space-between">
                  <Text size="sm">Delete this mule?</Text>
                  <Group gap="xs">
                    <Button size="xs" color="red" onClick={() => onDelete(mule.id)}>
                      Yes, delete
                    </Button>
                    <Button size="xs" variant="outline" onClick={() => setConfirmDelete(false)}>
                      Cancel
                    </Button>
                  </Group>
                </Group>
              </Alert>
            ) : (
              <Group justify="flex-end">
                <ActionIcon
                  color="red"
                  variant="subtle"
                  onClick={() => setConfirmDelete(true)}
                  aria-label="Delete mule"
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Group>
            )}
          </Stack>
        </>
      )}
    </Card>
  );
}
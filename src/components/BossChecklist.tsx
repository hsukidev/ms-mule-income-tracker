import { useState } from 'react';
import { TextInput, Radio, Stack, Group, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { bossFamilies, getBossById } from '../data/bosses';
import { formatMeso } from '../utils/meso';

interface BossChecklistProps {
  selectedBosses: string[];
  onChange: (selectedBosses: string[]) => void;
}

export function BossChecklist({ selectedBosses, onChange }: BossChecklistProps) {
  const [search, setSearch] = useState('');

  const filteredFamilies = bossFamilies.filter((family) =>
    family.family.toLowerCase().includes(search.toLowerCase()) ||
    family.bosses.some((b) => b.name.toLowerCase().includes(search.toLowerCase())),
  );

  function handleSelect(family: string, bossId: string) {
    const existingId = selectedBosses.find((id) => {
      const boss = getBossById(id);
      return boss?.family === family;
    });

    if (existingId === bossId) {
      onChange(selectedBosses.filter((id) => id !== bossId));
    } else if (existingId) {
      onChange(selectedBosses.filter((id) => id !== existingId).concat(bossId));
    } else {
      onChange([...selectedBosses, bossId]);
    }
  }

  return (
    <Stack gap="sm">
      <TextInput
        placeholder="Search bosses..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
      />
      {filteredFamilies.map((family) => {
        const selectedInFamily = family.bosses.find((b) =>
          selectedBosses.includes(b.id),
        );
        return (
          <BossFamilyGroup
            key={family.family}
            family={family}
            selectedBossId={selectedInFamily?.id}
            onSelect={handleSelect}
          />
        );
      })}
      {filteredFamilies.length === 0 && (
        <Text c="dimmed" ta="center">No bosses found</Text>
      )}
    </Stack>
  );
}

function BossFamilyGroup({
  family,
  selectedBossId,
  onSelect,
}: {
  family: typeof bossFamilies[number];
  selectedBossId: string | undefined;
  onSelect: (family: string, bossId: string) => void;
}) {
  const displayName = family.bosses[0].name.replace(/^(Extreme|Chaos|Hard|Normal|Easy) /, '');

  return (
    <div style={{
      border: '1px solid var(--mantine-color-default-border)',
      borderRadius: 'var(--mantine-radius-sm)',
      padding: 'var(--mantine-spacing-xs) var(--mantine-spacing-sm)',
    }}>
      <Radio.Group
        label={displayName}
        value={selectedBossId ?? ''}
        onChange={(value) => onSelect(family.family, value)}
      >
        <Group mt={4} gap="xs" wrap="wrap">
          {family.bosses.map((boss) => (
            <Radio
              key={boss.id}
              value={boss.id}
              label={`${boss.name} (${formatMeso(boss.crystalValue)})`}
              size="sm"
            />
          ))}
        </Group>
      </Radio.Group>
    </div>
  );
}
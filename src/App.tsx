import '@mantine/core/styles.css';
import '@mantine/charts/styles.css';

import {
  MantineProvider,
  createTheme,
  Container,
  Stack,
  Button,
  Paper,
  Group,
  Text,
} from '@mantine/core';
import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { IconPlus } from '@tabler/icons-react';
import { useState, useCallback } from 'react';
import { useMules } from './hooks/useMules';
import { calculateMuleIncome } from './data/bosses';
import { formatMeso } from './utils/meso';
import { SortableMuleCard } from './components/SortableMuleCard';
import { Header } from './components/Header';
import { IncomePieChart } from './components/IncomePieChart';

const theme = createTheme({});

function AppContent() {
  const { mules, addMule, updateMule, deleteMule, reorderMules } = useMules();
  const [abbreviated, setAbbreviated] = useState(true);
  const [expandedMuleId, setExpandedMuleId] = useState<string | null>(null);

  const totalIncome = mules.reduce(
    (sum, m) => sum + calculateMuleIncome(m.selectedBosses),
    0,
  );

  const sortedMules = [...mules].sort((a, b) => {
    const aIncome = calculateMuleIncome(a.selectedBosses);
    const bIncome = calculateMuleIncome(b.selectedBosses);
    return bIncome - aIncome;
  });

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = mules.findIndex((m) => m.id === active.id);
        const newIndex = mules.findIndex((m) => m.id === over.id);
        reorderMules(oldIndex, newIndex);
      }
    },
    [mules, reorderMules],
  );

  function handleAddMule() {
    const id = addMule();
    setExpandedMuleId(id);
  }

  function handleSliceClick(muleId: string) {
    setExpandedMuleId(muleId === expandedMuleId ? null : muleId);
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--mantine-color-body)' }}>
      <Header totalIncome={totalIncome} muleCount={mules.length} />
      <Container size="lg" py="md">
        <Stack gap="md">
          <Paper p="md" radius="md" withBorder>
            <Group justify="space-between" align="center">
              <div>
                <Text size="sm" c="dimmed">Total Weekly Income</Text>
                <Text
                  size="xl"
                  fw={700}
                  style={{ cursor: 'pointer' }}
                  onClick={() => setAbbreviated(!abbreviated)}
                >
                  {formatMeso(totalIncome, abbreviated)} mesos
                </Text>
              </div>
            </Group>
            <IncomePieChart
              mules={sortedMules}
              abbreviated={abbreviated}
              onSliceClick={handleSliceClick}
            />
          </Paper>

          <Group justify="flex-end">
            <Button leftSection={<IconPlus size={16} />} onClick={handleAddMule}>
              Add Mule
            </Button>
          </Group>

          <DndContext
            collisionDetection={closestCenter}
            modifiers={[restrictToVerticalAxis]}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortedMules.map((m) => m.id)}
              strategy={verticalListSortingStrategy}
            >
              <Stack gap="sm">
                {sortedMules.map((mule) => (
                  <SortableMuleCard
                    key={mule.id}
                    mule={mule}
                    expanded={mule.id === expandedMuleId}
                    onExpandChange={(expanded) =>
                      setExpandedMuleId(expanded ? mule.id : null)
                    }
                    onUpdate={updateMule}
                    onDelete={deleteMule}
                  />
                ))}
              </Stack>
            </SortableContext>
          </DndContext>
        </Stack>
      </Container>
    </div>
  );
}

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <AppContent />
    </MantineProvider>
  );
}

export default App;
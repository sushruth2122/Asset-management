import { memo, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { ArrowRight, Calendar, User, Plus, PackagePlus, Settings, Wrench, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAssetLifecycleEvents, useLifecycleRealtime } from '@/hooks/useAsset360';
import LifecycleEventModal from './LifecycleEventModal';

interface Props {
  assetId: string;
}

const stageBadge: Record<string, string> = {
  planning: 'bg-purple-500/20 text-purple-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  maintenance: 'bg-amber-500/20 text-amber-400',
  inactive: 'bg-slate-500/20 text-slate-400',
  retired: 'bg-red-500/20 text-red-400',
  disposed: 'bg-gray-500/20 text-gray-400',
};

const quickActions = [
  { label: 'Acquisition', icon: PackagePlus, group: 'Acquisition' },
  { label: 'Operation', icon: Settings, group: 'Operation' },
  { label: 'Maintenance', icon: Wrench, group: 'Maintenance' },
  { label: 'Decommission', icon: XCircle, group: 'Decommission' },
] as const;

function LifecycleTab({ assetId }: Props) {
  const { data: events, isLoading } = useAssetLifecycleEvents(assetId);
  useLifecycleRealtime(assetId);

  const [modalOpen, setModalOpen] = useState(false);
  const [presetGroup, setPresetGroup] = useState<string | undefined>(undefined);

  const openModal = useCallback((group?: string) => {
    setPresetGroup(group);
    setModalOpen(true);
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-wrap gap-2">
        {quickActions.map(({ label, icon: Icon, group }) => (
          <Button key={group} variant="outline" size="sm" onClick={() => openModal(group)}>
            <Icon className="h-4 w-4 mr-1" />
            {label}
          </Button>
        ))}
        <Button variant="default" size="sm" onClick={() => openModal()}>
          <Plus className="h-4 w-4 mr-1" />
          Custom Event
        </Button>
      </div>

      {/* Timeline */}
      {events && events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative border-l border-border ml-3 space-y-6">
              {events.slice(0, 10).map((evt) => (
                <li key={evt.id} className="ml-6">
                  <span className="absolute -left-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary ring-4 ring-background" />
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="text-sm font-medium capitalize">{evt.title || evt.event_type.replace(/_/g, ' ')}</span>
                    {evt.from_stage && evt.to_stage && (
                      <span className="flex items-center gap-1 text-xs">
                        <Badge variant="outline" className={stageBadge[evt.from_stage] ?? ''}>
                          {evt.from_stage}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <Badge variant="outline" className={stageBadge[evt.to_stage] ?? ''}>
                          {evt.to_stage}
                        </Badge>
                      </span>
                    )}
                  </div>
                  {evt.description && (
                    <p className="text-sm text-muted-foreground mb-1">{evt.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(evt.event_date), 'dd MMM yyyy HH:mm')}
                    </span>
                    {evt.performed_by && (
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {evt.performed_by}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}

      {/* History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event History ({events?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {!events?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              No lifecycle events recorded yet. Use the buttons above to add one.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Transition</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((evt) => (
                  <TableRow key={evt.id}>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {format(new Date(evt.event_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs capitalize">
                        {evt.event_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-sm">
                      {evt.title || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {evt.description || '-'}
                    </TableCell>
                    <TableCell>
                      {evt.from_stage && evt.to_stage ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Badge variant="outline" className={`${stageBadge[evt.from_stage] ?? ''} text-xs`}>{evt.from_stage}</Badge>
                          <ArrowRight className="h-3 w-3" />
                          <Badge variant="outline" className={`${stageBadge[evt.to_stage] ?? ''} text-xs`}>{evt.to_stage}</Badge>
                        </span>
                      ) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <LifecycleEventModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        assetId={assetId}
        presetGroup={presetGroup}
      />
    </div>
  );
}

export default memo(LifecycleTab);

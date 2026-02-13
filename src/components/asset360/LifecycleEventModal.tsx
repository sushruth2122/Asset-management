import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateLifecycleEvent, type LifecycleEventType } from '@/hooks/useAsset360';

const EVENT_TYPES: { value: LifecycleEventType; label: string; group: string }[] = [
  { value: 'acquired', label: 'Acquired', group: 'Acquisition' },
  { value: 'commissioned', label: 'Commissioned', group: 'Acquisition' },
  { value: 'deployed', label: 'Deployed', group: 'Operation' },
  { value: 'relocated', label: 'Relocated', group: 'Operation' },
  { value: 'transferred', label: 'Transferred', group: 'Operation' },
  { value: 'maintenance_start', label: 'Maintenance Start', group: 'Maintenance' },
  { value: 'maintenance_end', label: 'Maintenance End', group: 'Maintenance' },
  { value: 'repair', label: 'Repair', group: 'Maintenance' },
  { value: 'inspected', label: 'Inspected', group: 'Maintenance' },
  { value: 'deactivated', label: 'Deactivated', group: 'Decommission' },
  { value: 'retired', label: 'Retired', group: 'Decommission' },
  { value: 'disposed', label: 'Disposed', group: 'Decommission' },
  { value: 'decommissioned', label: 'Decommissioned', group: 'Decommission' },
];

const schema = z.object({
  event_type: z.string().min(1, 'Event type is required'),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetId: string;
  presetGroup?: string;
}

export default function LifecycleEventModal({ open, onOpenChange, assetId, presetGroup }: Props) {
  const createEvent = useCreateLifecycleEvent();

  const filtered = presetGroup
    ? EVENT_TYPES.filter((e) => e.group === presetGroup)
    : EVENT_TYPES;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      event_type: filtered[0]?.value ?? '',
      title: '',
      description: '',
    },
  });

  const handleSubmit = useCallback((data: FormData) => {
    createEvent.mutate(
      {
        asset_id: assetId,
        event_type: data.event_type,
        title: data.title,
        description: data.description ?? null,
        from_stage: null,
        to_stage: null,
        performed_by: null,
        event_date: new Date().toISOString(),
        metadata: {},
      },
      {
        onSuccess: () => {
          form.reset();
          onOpenChange(false);
        },
      },
    );
  }, [assetId, createEvent, form, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {presetGroup ? `Record ${presetGroup} Event` : 'Record Lifecycle Event'}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="event_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select event type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filtered.map((e) => (
                        <SelectItem key={e.value} value={e.value}>
                          {e.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief event title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Details about this event..." rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createEvent.isPending}>
                {createEvent.isPending ? 'Saving...' : 'Record Event'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

import React from 'react';
import { Asset } from '@/hooks/useAssets';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Eye, Pencil, Trash2, MoreHorizontal, ArrowUpDown, PackageOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AssetTableProps {
  assets: Asset[];
  onView: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

const statusStyles: Record<string, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30',
  maintenance: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30',
  inactive: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30',
  retired: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/15 dark:text-violet-400 dark:border-violet-500/30',
  disposed: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30',
};

export default function AssetTable({ assets, onView, onEdit, onDelete }: AssetTableProps) {
  const navigate = useNavigate();

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted mb-4">
          <PackageOpen className="h-7 w-7 text-muted-foreground" />
        </div>
        <h3 className="text-sm font-medium text-foreground mb-1">No assets found</h3>
        <p className="text-xs text-muted-foreground">Try adjusting your search or add a new asset.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40 hover:bg-muted/40">
            <TableHead className="w-10 px-3">
              <Checkbox />
            </TableHead>
            <TableHead className="min-w-[180px]">
              <div className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider">
                Name <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
              </div>
            </TableHead>
            <TableHead>
              <span className="text-xs font-medium uppercase tracking-wider">Serial #</span>
            </TableHead>
            <TableHead>
              <span className="text-xs font-medium uppercase tracking-wider">Code</span>
            </TableHead>
            <TableHead>
              <span className="text-xs font-medium uppercase tracking-wider">Custodian</span>
            </TableHead>
            <TableHead>
              <span className="text-xs font-medium uppercase tracking-wider">Location</span>
            </TableHead>
            <TableHead>
              <span className="text-xs font-medium uppercase tracking-wider">Status</span>
            </TableHead>
            <TableHead className="text-right w-24">
              <span className="text-xs font-medium uppercase tracking-wider">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((asset) => (
            <TableRow
              key={asset.id}
              className="group cursor-pointer transition-colors duration-100"
              onClick={() => navigate(`/assets/${asset.id}`)}
            >
              <TableCell className="px-3" onClick={(e) => e.stopPropagation()}>
                <Checkbox />
              </TableCell>
              <TableCell>
                <div>
                  <p className="text-sm font-medium text-foreground">{asset.asset_name}</p>
                  <p className="text-xs text-muted-foreground">{asset.manufacturer} {asset.model}</p>
                </div>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground font-mono text-xs">{asset.serial_number || '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground font-mono text-xs">{asset.asset_code}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{asset.custodian || '—'}</TableCell>
              <TableCell>
                <div>
                  <p className="text-sm text-foreground">{asset.location}</p>
                  {asset.building_no && (
                    <p className="text-xs text-muted-foreground">Bldg: {asset.building_no}</p>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant="outline"
                  className={`text-[11px] font-medium ${statusStyles[asset.status.toLowerCase()] ?? ''}`}
                >
                  {asset.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(asset)}>
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => onEdit(asset)}>
                        <Pencil className="mr-2 h-3.5 w-3.5" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(asset)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

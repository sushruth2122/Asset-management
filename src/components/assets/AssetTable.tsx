import React, { memo, useCallback } from 'react';
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
import { Eye, Pencil, Trash2, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AssetTableProps {
  assets: Asset[];
  onView: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onDelete: (asset: Asset) => void;
}

export default function AssetTable({ assets, onView, onEdit, onDelete }: AssetTableProps) {
  const navigate = useNavigate();

  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'default';
      case 'maintenance':
        return 'secondary';
      case 'inactive':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'maintenance':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'inactive':
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
      case 'retired':
        return 'bg-violet-500/20 text-violet-400 border-violet-500/30';
      case 'disposed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return '';
    }
  };

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/30 hover:bg-muted/30">
            <TableHead className="w-12">
              <Checkbox />
            </TableHead>
            <TableHead className="min-w-[200px]">
              <div className="flex items-center gap-1">
                Name <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Serial Number <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Asset Code <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Custodian <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Location <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Status <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                No assets found.
              </TableCell>
            </TableRow>
          ) : (
            assets.map((asset) => (
              <TableRow
                key={asset.id}
                className="group cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/assets/${asset.id}`)}
              >
                <TableCell>
                  <Checkbox />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium text-foreground">{asset.asset_name}</p>
                    <p className="text-sm text-muted-foreground">{asset.manufacturer} {asset.model}</p>
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">{asset.serial_number || '-'}</TableCell>
                <TableCell className="text-muted-foreground">{asset.asset_code}</TableCell>
                <TableCell className="text-muted-foreground">{asset.custodian || '-'}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-foreground">{asset.location}</p>
                    {asset.building_no && (
                      <p className="text-sm text-muted-foreground">Bldg: {asset.building_no}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={getStatusVariant(asset.status)}
                    className={getStatusClasses(asset.status)}
                  >
                    {asset.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onView(asset)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEdit(asset)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(asset)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

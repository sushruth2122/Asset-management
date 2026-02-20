import { SparePart } from '@/hooks/useSpareParts';
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
import { Eye, Pencil, Trash2, ArrowUpDown, Package, ShoppingCart, PackageOpen } from 'lucide-react';

interface SparePartsTableProps {
  parts: SparePart[];
  onView: (part: SparePart) => void;
  onEdit: (part: SparePart) => void;
  onDelete: (part: SparePart) => void;
  onUpdateStock: (part: SparePart) => void;
  onReorder: (part: SparePart) => void;
}

export default function SparePartsTable({ parts, onView, onEdit, onDelete, onUpdateStock, onReorder }: SparePartsTableProps) {

  const getStockStatus = (part: SparePart) => {
    if (part.quantity === 0) return 'Out of Stock';
    if (part.quantity <= part.minimum_threshold) return 'Low Stock';
    return 'In Stock';
  };

  const getStatusClasses = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in stock':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30';
      case 'low stock':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30';
      case 'out of stock':
        return 'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/15 dark:text-red-400 dark:border-red-500/30';
      case 'on order':
        return 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-cyan-500/15 dark:text-cyan-400 dark:border-cyan-500/30';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/15 dark:text-slate-400 dark:border-slate-500/30';
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
            <TableHead className="min-w-[180px]">
              <div className="flex items-center gap-1">
                Part Name <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Part Number <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Stock <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Supplier <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1">
                Location <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {parts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-40 text-center">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <PackageOpen className="h-8 w-8 opacity-40" />
                  <p className="text-sm font-medium">No spare parts found</p>
                  <p className="text-xs">Try adjusting your filters</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            parts.map((part) => {
              const stockStatus = getStockStatus(part);
              return (
                <TableRow key={part.id} className="group">
                  <TableCell>
                    <Checkbox />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{part.part_name}</p>
                      {part.description && (
                        <p className="text-sm text-muted-foreground line-clamp-1">{part.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">{part.part_number}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{part.quantity}</span>
                      <span className="text-xs text-muted-foreground">/ {part.minimum_threshold}</span>
                      {part.quantity === 0 && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">Critical</Badge>
                      )}
                      {part.quantity > 0 && part.quantity <= part.minimum_threshold && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30 text-[10px] px-1.5 py-0 h-4">Low</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusClasses(stockStatus)}>
                      {stockStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{part.supplier || '-'}</TableCell>
                  <TableCell className="text-muted-foreground">{part.storage_location || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Update Stock"
                        onClick={() => onUpdateStock(part)}
                      >
                        <Package className="h-3.5 w-3.5" />
                      </Button>
                      {part.quantity <= part.minimum_threshold && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-amber-600 dark:text-amber-400"
                          title="Reorder"
                          onClick={() => onReorder(part)}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onView(part)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => onEdit(part)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-red-500 dark:text-red-400 hover:text-red-600"
                        onClick={() => onDelete(part)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}

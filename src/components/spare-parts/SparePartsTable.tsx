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
import { Eye, Pencil, Trash2, ArrowUpDown, Package, ShoppingCart } from 'lucide-react';

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
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'low stock':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'out of stock':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'on order':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
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
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                No spare parts found.
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
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Critical</Badge>
                      )}
                      {part.quantity > 0 && part.quantity <= part.minimum_threshold && (
                        <Badge variant="outline" className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-[10px] px-1.5 py-0">Low</Badge>
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
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        title="Update Stock"
                        onClick={() => onUpdateStock(part)}
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                      {part.quantity <= part.minimum_threshold && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-amber-400"
                          title="Reorder"
                          onClick={() => onReorder(part)}
                        >
                          <ShoppingCart className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onView(part)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(part)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onDelete(part)}
                      >
                        <Trash2 className="h-4 w-4" />
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

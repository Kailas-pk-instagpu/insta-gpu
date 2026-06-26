import { Skeleton } from '@/components/ui/skeleton';
import { TableCell, TableRow } from '@/components/ui/table';

interface Props {
  rows?: number;
  columns: number;
  /** Optional per-column width hints in tailwind units, e.g. ['w-20', 'w-32', ...] */
  widths?: string[];
}

/**
 * Generic skeleton rows for tables — drop into <TableBody> while loading.
 */
export default function TableSkeletonRows({ rows = 6, columns, widths }: Props) {
  return (
    <>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <TableRow key={`sk-${rIdx}`} className="hover:bg-transparent">
          {Array.from({ length: columns }).map((_, cIdx) => (
            <TableCell key={cIdx} className="py-3">
              <Skeleton className={`h-3.5 ${widths?.[cIdx] ?? 'w-full max-w-[160px]'}`} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

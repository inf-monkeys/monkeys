import React, { useEffect, useMemo, useState } from 'react';

import { Download } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface PomMeasurement {
  name: string;
  size: number | null;
  unit: string;
}

interface PomMeasurementsTableData {
  garment_type?: string;
  measurements_table?: PomMeasurement[];
}

interface VinesAbstractPomTableProps {
  data: PomMeasurementsTableData;
}

export const VinesAbstractPomTable: React.FC<VinesAbstractPomTableProps> = ({ data }) => {
  const initial = data.measurements_table || [];
  const garmentType = data.garment_type || 'Unknown';

  // Local editable rows state
  const [rows, setRows] = useState<PomMeasurement[]>(initial);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  // Sync when incoming data changes
  useEffect(() => {
    setRows(initial);
  }, [data]);

  // Filter valid measurements
  const displayRows = useMemo(
    () => rows.map((r, i) => ({ ...r, __i: i })).filter((m) => m.size !== null && m.size !== undefined),
    [rows],
  ) as Array<PomMeasurement & { __i: number }>;
  const validMeasurements = displayRows;

  // Statistics
  const total = rows.length;
  const measured = validMeasurements.length;
  const unmeasured = total - measured;
  const completionRate = total > 0 ? Math.round((measured / total) * 100) : 0;

  // Export CSV
  const handleExport = () => {
    const headers = ['Name', 'Size', 'Unit'];
    const csvRows = validMeasurements.map((m) => [m.name, m.size !== null ? m.size.toString() : '', m.unit]);
    const csvContent = [headers.join(','), ...csvRows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `measurements_${garmentType}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (validMeasurements.length === 0) {
    return (
      <div className="flex items-center justify-center p-6">
        <div className="text-sm text-muted-foreground">No measurements available</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Toolbar: export at top-left to avoid crowding */}
      <div className="px-1 pt-0.5">
        <div className="flex items-center justify-start gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2.5 whitespace-nowrap"
            onClick={handleExport}
          >
            <Download className="mr-1 h-3.5 w-3.5" /> Export
          </Button>
          <span className="text-[11px] text-muted-foreground">{validMeasurements.length} items</span>
        </div>
      </div>

      {/* Measurements Table */}
      <div className="overflow-hidden rounded-md">
        <Table className="table-fixed w-full">
          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TableRow>
              <TableHead className="w-9 py-2 text-[13px]">#</TableHead>
              <TableHead className="w-[55%] py-2 text-[13px]">Name</TableHead>
              <TableHead className="w-32 lg:w-40 py-2 text-right text-[13px]">Size</TableHead>
              <TableHead className="w-16 py-2 text-[13px]">Unit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validMeasurements.map((measurement, index) => (
              <TableRow
                key={`${measurement.name}-${measurement.__i}`}
                className="odd:bg-muted/30"
              >
                <TableCell className="py-1.5 text-[11px] text-muted-foreground">{index + 1}</TableCell>
                <TableCell
                  className="py-1.5 text-[13px] leading-5 whitespace-normal break-words max-w-0"
                  title={measurement.name}
                  onDoubleClick={() => {
                    setEditingKey(`${measurement.__i}:name`);
                    setTempValue(measurement.name ?? '');
                  }}
                >
                  {editingKey === `${measurement.__i}:name` ? (
                    <Input
                      className="!h-7 px-2 py-1 text-sm"
                      value={tempValue}
                      onChange={setTempValue}
                      autoFocus
                      onEnterPress={() => {
                        const v = tempValue;
                        setRows((prev) => prev.map((r, i) => (i === measurement.__i ? { ...r, name: v } : r)));
                        setEditingKey(null);
                      }}
                      onBlur={() => {
                        const v = tempValue;
                        setRows((prev) => prev.map((r, i) => (i === measurement.__i ? { ...r, name: v } : r)));
                        setEditingKey(null);
                      }}
                    />
                  ) : (
                    measurement.name
                  )}
                </TableCell>
                <TableCell
                  className="py-1.5 text-right font-mono text-sm"
                  onDoubleClick={() => {
                    setEditingKey(`${measurement.__i}:size`);
                    setTempValue(measurement.size?.toString() ?? '');
                  }}
                >
                  {editingKey === `${measurement.__i}:size` ? (
                    <Input
                      type="number"
                      className="!h-7 !w-full px-2 py-1 text-sm text-right"
                      wrapperClassName="inline-block w-[9ch] sm:w-[10ch]"
                      value={tempValue}
                      onChange={setTempValue}
                      autoFocus
                      onEnterPress={() => {
                        const v = tempValue.trim();
                        const n = v === '' ? null : Number(v);
                        if (v !== '' && Number.isNaN(n)) return;
                        setRows((prev) => prev.map((r, i) => (i === measurement.__i ? { ...r, size: n } : r)));
                        setEditingKey(null);
                      }}
                      onBlur={() => {
                        const v = tempValue.trim();
                        const n = v === '' ? null : Number(v);
                        if (v !== '' && Number.isNaN(n)) {
                          setEditingKey(null);
                          return;
                        }
                        setRows((prev) => prev.map((r, i) => (i === measurement.__i ? { ...r, size: n } : r)));
                        setEditingKey(null);
                      }}
                    />
                  ) : (
                    measurement.size
                  )}
                </TableCell>
                <TableCell
                  className="py-1.5 text-[11px] text-muted-foreground"
                  onDoubleClick={() => {
                    setEditingKey(`${measurement.__i}:unit`);
                    setTempValue(measurement.unit ?? '');
                  }}
                >
                  {editingKey === `${measurement.__i}:unit` ? (
                    <Input
                      className="!h-7 !w-full px-2 py-1 text-xs"
                      wrapperClassName="inline-block w-[7ch]"
                      value={tempValue}
                      onChange={setTempValue}
                      autoFocus
                      onEnterPress={() => {
                        const v = tempValue;
                        setRows((prev) => prev.map((r, i) => (i === measurement.__i ? { ...r, unit: v } : r)));
                        setEditingKey(null);
                      }}
                      onBlur={() => {
                        const v = tempValue;
                        setRows((prev) => prev.map((r, i) => (i === measurement.__i ? { ...r, unit: v } : r)));
                        setEditingKey(null);
                      }}
                    />
                  ) : (
                    measurement.unit
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
        <span>
          Type: <span className="font-medium text-foreground">{garmentType}</span>
        </span>
        <span>{validMeasurements.length} measurements</span>
      </div>
    </div>
  );
};

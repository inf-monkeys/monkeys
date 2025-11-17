import React, { useEffect, useMemo, useState } from 'react';

import { Download } from 'lucide-react';

import { exportMeasurementsToCSV } from '@/apis/pom';
import { GarmentType, MeasurementTableRow } from '@/apis/pom/typings';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface MeasurementTableProps {
  measurements: MeasurementTableRow[];
  garmentType: GarmentType;
  loading?: boolean;
}

export const MeasurementTable: React.FC<MeasurementTableProps> = ({ measurements, garmentType, loading = false }) => {
  // 本地可编辑数据
  const [rows, setRows] = useState<MeasurementTableRow[]>(measurements);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  useEffect(() => {
    setRows(measurements);
  }, [measurements]);

  // 过滤掉没有值的测量项
  const displayMeasurements = useMemo(
    () => rows.map((r, i) => ({ ...r, __i: i })).filter((m) => m.size !== null && m.size !== undefined),
    [rows],
  ) as Array<MeasurementTableRow & { __i: number }>;

  const handleExport = () => {
    exportMeasurementsToCSV(
      displayMeasurements.map(({ name, size, unit }) => ({ name, size, unit })),
      garmentType,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">Loading measurements...</div>
      </div>
    );
  }

  if (displayMeasurements.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-sm text-muted-foreground">No measurements available</div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 工具栏：左上角导出 + 条数 */}
      <div className="px-1 pt-0.5">
        <div className="flex items-center justify-start gap-2">
          <Button variant="outline" size="small" className="h-7 whitespace-nowrap px-2.5" onClick={handleExport}>
            <Download className="mr-1 h-3.5 w-3.5" /> Export
          </Button>
          <span className="text-[11px] text-muted-foreground">{displayMeasurements.length} items</span>
        </div>
      </div>

      {/* 测量结果表格 */}
      <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden rounded-md">
        <Table className="w-full table-fixed">
          <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <TableRow>
              <TableHead className="w-9 py-2 text-[13px]">#</TableHead>
              <TableHead className="w-[65%] py-2 text-[13px]">Name</TableHead>
              <TableHead className="w-28 py-2 text-right text-[13px] lg:w-32">Size</TableHead>
              <TableHead className="w-14 py-2 text-[13px]">Unit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayMeasurements.map((measurement, index) => (
              <TableRow key={`${measurement.name}-${measurement.__i}`} className="odd:bg-muted/30">
                <TableCell className="py-1.5 text-[11px] text-muted-foreground">{index + 1}</TableCell>
                <TableCell
                  className="max-w-0 whitespace-normal break-words py-1.5 text-[13px] leading-5"
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
                  className="py-1.5 text-right font-mono text-sm md:text-base"
                  onDoubleClick={() => {
                    setEditingKey(`${measurement.__i}:size`);
                    setTempValue(measurement.size?.toString() ?? '');
                  }}
                >
                  {editingKey === `${measurement.__i}:size` ? (
                    <Input
                      type="number"
                      className="!h-7 !w-full px-2 py-1 text-right text-sm"
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

      {/* 服装类型标签 */}
      <div className="flex items-center justify-between px-1 text-[11px] text-muted-foreground">
        <span>
          Type: <span className="font-medium text-foreground">{garmentType}</span>
        </span>
        <span>{displayMeasurements.length} measurements</span>
      </div>
    </div>
  );
};

'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
} from 'lucide-react';
import { SearchInput } from './SearchInput';
import { EmptyState } from './EmptyState';
import { Skeleton } from './Skeleton';

// ============================================================================
// Types
// ============================================================================

export type SortDirection = 'asc' | 'desc' | null;

export interface ColumnDef<T> {
  /** Unique key for the column */
  key: string;
  /** Header label */
  label: string;
  /** Enable sorting */
  sortable?: boolean;
  /** Column width */
  width?: string | number;
  /** Text alignment */
  align?: 'left' | 'center' | 'right';
  /** Custom render function */
  render?: (value: unknown, row: T, index: number) => ReactNode;
  /** Custom sort function */
  sortFn?: (a: T, b: T) => number;
  /** Hide column on mobile */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Data array */
  data: T[];
  /** Unique key field */
  keyField?: keyof T;
  /** Loading state */
  loading?: boolean;
  /** Enable search */
  searchable?: boolean;
  /** Search placeholder */
  searchPlaceholder?: string;
  /** Search fields (keys to search in) */
  searchFields?: (keyof T)[];
  /** Enable pagination */
  pagination?: {
    pageSize: number;
    pageSizeOptions?: number[];
  };
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Custom empty state */
  emptyState?: ReactNode;
  /** Selectable rows */
  selectable?: boolean;
  /** Selected rows */
  selectedRows?: T[];
  /** Selection change handler */
  onSelectionChange?: (selected: T[]) => void;
  /** Additional class names */
  className?: string;
  /** Row class name getter */
  rowClassName?: (row: T, index: number) => string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Row actions */
  actions?: (row: T, index: number) => ReactNode;
}

// ============================================================================
// Helper Components
// ============================================================================

function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc') {
    return <ChevronUp className="w-4 h-4" />;
  }
  if (direction === 'desc') {
    return <ChevronDown className="w-4 h-4" />;
  }
  return <ChevronsUpDown className="w-4 h-4 opacity-30" />;
}

function Checkbox({
  checked,
  indeterminate,
  onChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onChange: () => void;
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate || false;
      }}
      onChange={onChange}
      className={cn(
        'w-4 h-4 rounded border-[var(--color-border)]',
        'bg-[var(--color-surface-2)]',
        'checked:bg-[#088395] checked:border-[#088395]',
        'focus:ring-2 focus:ring-[#088395]/50 focus:ring-offset-0',
        'cursor-pointer transition-colors'
      )}
    />
  );
}

// ============================================================================
// Pagination Component
// ============================================================================

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}

function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [10, 20, 50, 100],
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 border-t border-[var(--color-border)]">
      {/* Info */}
      <div className="text-sm text-[var(--color-muted-foreground)]">
        Menampilkan <span className="font-medium text-[var(--color-foreground)]">{startItem}</span>
        {' - '}
        <span className="font-medium text-[var(--color-foreground)]">{endItem}</span>
        {' dari '}
        <span className="font-medium text-[var(--color-foreground)]">{totalItems}</span> data
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-[var(--color-muted-foreground)]">Per halaman:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className={cn(
                'h-8 px-2 rounded-md text-sm',
                'bg-[var(--color-surface-2)] border border-[var(--color-border)]',
                'text-[var(--color-foreground)]',
                'focus:outline-none focus:ring-2 focus:ring-[#088395]/50'
              )}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Page navigation */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              'text-[var(--color-muted-foreground)]',
              'hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <button
                  key={pageNum}
                  onClick={() => onPageChange(pageNum)}
                  className={cn(
                    'w-8 h-8 rounded-md text-sm font-medium transition-colors',
                    currentPage === pageNum
                      ? 'bg-[#088395] text-white'
                      : 'text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]'
                  )}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              'p-1.5 rounded-md transition-colors',
              'text-[var(--color-muted-foreground)]',
              'hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-foreground)]',
              'disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent'
            )}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  keyField = 'id' as keyof T,
  loading = false,
  searchable = false,
  searchPlaceholder = 'Cari...',
  searchFields,
  pagination,
  onRowClick,
  emptyState,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  className,
  rowClassName,
  stickyHeader = false,
  striped = false,
  compact = false,
  actions,
}: DataTableProps<T>) {
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(pagination?.pageSize || 10);

  // Filter data by search
  const filteredData = useMemo(() => {
    if (!searchQuery) return data;

    const query = searchQuery.toLowerCase();
    const fields = searchFields || (columns.map((c) => c.key) as (keyof T)[]);

    return data.filter((row) =>
      fields.some((field) => {
        const value = row[field];
        if (value == null) return false;
        return String(value).toLowerCase().includes(query);
      })
    );
  }, [data, searchQuery, searchFields, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) return filteredData;

    const column = columns.find((c) => c.key === sortKey);
    if (!column) return filteredData;

    return [...filteredData].sort((a, b) => {
      if (column.sortFn) {
        return sortDirection === 'asc' ? column.sortFn(a, b) : column.sortFn(b, a);
      }

      const aVal = a[sortKey as keyof T];
      const bVal = b[sortKey as keyof T];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? 1 : -1;
      if (bVal == null) return sortDirection === 'asc' ? -1 : 1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      return sortDirection === 'asc' ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [filteredData, sortKey, sortDirection, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, pagination, currentPage, pageSize]);

  const totalPages = pagination ? Math.ceil(sortedData.length / pageSize) : 1;

  // Handlers
  const handleSort = useCallback((key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else if (sortDirection === 'desc') {
        setSortKey(null);
        setSortDirection(null);
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  }, [sortKey, sortDirection]);

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (selectedRows.length === paginatedData.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(paginatedData);
    }
  }, [paginatedData, selectedRows, onSelectionChange]);

  const handleSelectRow = useCallback((row: T) => {
    if (!onSelectionChange) return;
    const isSelected = selectedRows.some((r) => r[keyField] === row[keyField]);
    if (isSelected) {
      onSelectionChange(selectedRows.filter((r) => r[keyField] !== row[keyField]));
    } else {
      onSelectionChange([...selectedRows, row]);
    }
  }, [selectedRows, onSelectionChange, keyField]);

  const isRowSelected = useCallback((row: T) => {
    return selectedRows.some((r) => r[keyField] === row[keyField]);
  }, [selectedRows, keyField]);

  // Reset page when search changes
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={cn('rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] overflow-hidden', className)}>
        {searchable && (
          <div className="p-4 border-b border-[var(--color-border)]">
            <Skeleton height={40} rounded="md" />
          </div>
        )}
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {columns.map((col) => (
                <th key={col.key} className="p-3 text-left">
                  <Skeleton height={14} width="60%" rounded="sm" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="p-3">
                    <Skeleton height={16} width="70%" rounded="sm" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl bg-[var(--color-surface-1)] border border-[var(--color-border)] overflow-hidden', className)}>
      {/* Search */}
      {searchable && (
        <div className="p-4 border-b border-[var(--color-border)]">
          <SearchInput
            value={searchQuery}
            onChange={handleSearch}
            placeholder={searchPlaceholder}
            className="max-w-sm"
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={cn(stickyHeader && 'sticky top-0 z-10')}>
            <tr className="bg-[var(--color-surface-2)] border-b border-[var(--color-border)]">
              {/* Select all checkbox */}
              {selectable && (
                <th className={cn('w-12', compact ? 'p-2' : 'p-3')}>
                  <Checkbox
                    checked={selectedRows.length === paginatedData.length && paginatedData.length > 0}
                    indeterminate={selectedRows.length > 0 && selectedRows.length < paginatedData.length}
                    onChange={handleSelectAll}
                  />
                </th>
              )}

              {columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'text-left font-medium text-[var(--color-muted-foreground)]',
                    compact ? 'p-2 text-xs' : 'p-3 text-sm',
                    column.align === 'center' && 'text-center',
                    column.align === 'right' && 'text-right',
                    column.sortable && 'cursor-pointer select-none hover:text-[var(--color-foreground)]',
                    column.hideOnMobile && 'hidden sm:table-cell'
                  )}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className={cn('flex items-center gap-1.5', column.align === 'right' && 'justify-end')}>
                    <span>{column.label}</span>
                    {column.sortable && (
                      <SortIcon direction={sortKey === column.key ? sortDirection : null} />
                    )}
                  </div>
                </th>
              ))}

              {/* Actions column */}
              {actions && (
                <th className={cn('w-12', compact ? 'p-2' : 'p-3')} />
              )}
            </tr>
          </thead>

          <tbody>
            <AnimatePresence mode="popLayout">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + (selectable ? 1 : 0) + (actions ? 1 : 0)}>
                    {emptyState || (
                      <EmptyState
                        type={searchQuery ? 'no-results' : 'no-data'}
                        size="md"
                        className="py-12"
                      />
                    )}
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, index) => (
                  <motion.tr
                    key={String(row[keyField]) || index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className={cn(
                      'border-b border-[var(--color-border)] last:border-0',
                      'transition-colors',
                      striped && index % 2 === 1 && 'bg-[var(--color-surface-2)]/30',
                      onRowClick && 'cursor-pointer hover:bg-[var(--color-surface-hover)]',
                      isRowSelected(row) && 'bg-[#088395]/10',
                      rowClassName?.(row, index)
                    )}
                    onClick={() => onRowClick?.(row, index)}
                  >
                    {/* Row checkbox */}
                    {selectable && (
                      <td className={cn(compact ? 'p-2' : 'p-3')} onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isRowSelected(row)}
                          onChange={() => handleSelectRow(row)}
                        />
                      </td>
                    )}

                    {columns.map((column) => {
                      const value = row[column.key as keyof T];
                      const content = column.render
                        ? column.render(value, row, index)
                        : String(value ?? '-');

                      return (
                        <td
                          key={column.key}
                          className={cn(
                            'text-[var(--color-foreground)]',
                            compact ? 'p-2 text-xs' : 'p-3 text-sm',
                            column.align === 'center' && 'text-center',
                            column.align === 'right' && 'text-right',
                            column.hideOnMobile && 'hidden sm:table-cell'
                          )}
                        >
                          {content}
                        </td>
                      );
                    })}

                    {/* Row actions */}
                    {actions && (
                      <td className={cn(compact ? 'p-2' : 'p-3')} onClick={(e) => e.stopPropagation()}>
                        {actions(row, index)}
                      </td>
                    )}
                  </motion.tr>
                ))
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && sortedData.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={sortedData.length}
          pageSize={pageSize}
          pageSizeOptions={pagination.pageSizeOptions}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

// ============================================================================
// Export
// ============================================================================

export default DataTable;

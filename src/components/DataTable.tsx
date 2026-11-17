import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';

export interface ColumnDef<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  sortValue?: (row: T) => string | number;
  render: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  searchPlaceholder?: string;
  searchFilter?: (row: T, query: string) => boolean;
  toolbarExtra?: React.ReactNode;
  pageSize?: number;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  loading?: boolean;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchPlaceholder = 'Search records...',
  searchFilter,
  toolbarExtra,
  pageSize = 10,
  emptyTitle = 'No matching records found',
  emptyDescription = 'Try adjusting your search or filter criteria, or create a new record.',
  emptyAction,
  onRowClick,
  loading = false,
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!searchQuery.trim() || !searchFilter) return data;
    const q = searchQuery.trim().toLowerCase();
    return data.filter((row) => searchFilter(row, q));
  }, [data, searchQuery, searchFilter]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col || !col.sortValue) return filtered;
    const getter = col.sortValue;
    return [...filtered].sort((a, b) => {
      const va = getter(a);
      const vb = getter(b);
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va;
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const paginated = sorted.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setPage(1);
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.03)] overflow-hidden">
      {(searchFilter || toolbarExtra) && (
        <div className="px-4 py-3 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {searchFilter ? (
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-[#675BD3] transition-colors"
              />
            </div>
          ) : (
            <div />
          )}
          {toolbarExtra && <div className="flex items-center gap-2 flex-wrap">{toolbarExtra}</div>}
        </div>
      )}

      {loading ? (
        <div className="p-4 space-y-2.5">
          {Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="h-10 bg-slate-100 rounded-md animate-pulse" />
          ))}
        </div>
      ) : paginated.length === 0 ? (
        <div className="py-12 px-6 text-center">
          <p className="text-sm font-semibold text-slate-900">{emptyTitle}</p>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{emptyDescription}</p>
          {emptyAction && <div className="mt-4">{emptyAction}</div>}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 bg-slate-50/70">
                {columns.map((col) => {
                  const alignClass =
                    col.align === 'right'
                      ? 'text-right'
                      : col.align === 'center'
                      ? 'text-center'
                      : 'text-left';
                  return (
                    <th
                      key={col.key}
                      className={`px-4 py-2.5 text-xs font-semibold text-slate-600 whitespace-nowrap ${alignClass} ${col.className || ''}`}
                    >
                      {col.sortable && col.sortValue ? (
                        <button
                          type="button"
                          onClick={() => toggleSort(col.key)}
                          className="inline-flex items-center gap-1 hover:text-slate-900 transition-colors"
                        >
                          <span>{col.header}</span>
                          {sortKey === col.key ? (
                            sortDir === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#675BD3]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#675BD3]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3 h-3 text-slate-400" />
                          )}
                        </button>
                      ) : (
                        col.header
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginated.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`text-sm text-slate-700 transition-colors ${
                    onRowClick ? 'hover:bg-slate-50/90 cursor-pointer' : 'hover:bg-slate-50/60'
                  }`}
                >
                  {columns.map((col) => {
                    const alignClass =
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left';
                    return (
                      <td
                        key={col.key}
                        className={`px-4 py-2.5 align-middle ${alignClass} ${col.className || ''}`}
                      >
                        {col.render(row)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > pageSize && (
        <div className="px-4 py-2.5 border-t border-slate-200/80 bg-slate-50/40 flex items-center justify-between gap-4 text-xs text-slate-500">
          <span className="tabular-nums">
            Showing {(safePage - 1) * pageSize + 1}–{Math.min(safePage * pageSize, sorted.length)} of{' '}
            {sorted.length}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-medium text-slate-700 tabular-nums">
              {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

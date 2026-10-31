import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { Card, CardContent } from '../ui/card.tsx';
import { PriorityTag } from '../ui/tags.tsx';
import { Button } from '../ui/button.tsx';
import { Input } from '../ui/input.tsx';
import { EventDetailModal } from './EventDetailModal.tsx';
import { IngestAlertModal } from './IngestAlertModal.tsx';
import { Search, Filter, PlusCircle, RefreshCw, Eye, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Select } from '../ui/select.tsx';
import { Table } from '../ui/table.tsx';
import { PageHeader } from '../ui/page-header.tsx';

export const SecurityEventsView: React.FC = () => {
  const { token, user } = useAuth();

  // Events & Pagination State
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(20);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters State
  const [search, setSearch] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [protocolFilter, setProtocolFilter] = useState<string>('');
  const [sourceIpFilter, setSourceIpFilter] = useState<string>('');
  const [destinationIpFilter, setDestinationIpFilter] = useState<string>('');

  // Modals State
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [isIngestOpen, setIsIngestOpen] = useState<boolean>(false);

  const fetchEvents = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));

      if (search.trim()) params.append('search', search.trim());
      if (priorityFilter) params.append('priority', priorityFilter);
      if (protocolFilter) params.append('protocol', protocolFilter);
      if (sourceIpFilter.trim()) params.append('sourceIp', sourceIpFilter.trim());
      if (destinationIpFilter.trim()) params.append('destinationIp', destinationIpFilter.trim());

      const res = await fetch(`/api/events?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          setEvents(json.data || []);
          if (json.pagination) {
            setTotalCount(json.pagination.total);
            setTotalPages(json.pagination.totalPages);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    } finally {
      setLoading(false);
    }
  }, [token, page, limit, search, priorityFilter, protocolFilter, sourceIpFilter, destinationIpFilter]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleResetFilters = () => {
    setSearch('');
    setPriorityFilter('');
    setProtocolFilter('');
    setSourceIpFilter('');
    setDestinationIpFilter('');
    setPage(1);
  };

  const getPriorityBadge = (s: number) => <PriorityTag priority={s} />;

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        title="Security events"
        description={<>{totalCount} records from Snort</>}
        actions={<>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEvents}
            disabled={loading}
            className="text-body flex items-center gap-2 border-white/10"
            title="Refresh stream"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} strokeWidth={1.5} />
            <span>Refresh</span>
          </Button>

          {(user?.role === 'ADMIN' || user?.role === 'ANALYST') && (
            <Button
              size="sm"
              onClick={() => setIsIngestOpen(true)}
              className="text-body flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" strokeWidth={1.5} />
              <span>Ingest alert</span>
            </Button>
          )}
        </>}
      />

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
              <Input
                placeholder="Search signature message or classification"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 text-body font-mono"
              />
            </div>

            {/* Priority Selector */}
            <div>
              <Select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              >
                <option value="">All severities</option>
                <option value="1">Priority 1 (High)</option>
                <option value="2">Priority 2 (Medium)</option>
                <option value="3">Priority 3 (Low)</option>
                <option value="4">Priority 4 (Info)</option>
              </Select>
            </div>

            {/* Protocol Selector */}
            <div>
              <Select
                value={protocolFilter}
                onChange={(e) => {
                  setProtocolFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full"
              >
                <option value="">All protocols</option>
                <option value="TCP">Tcp</option>
                <option value="UDP">Udp</option>
                <option value="ICMP">Icmp</option>
                <option value="IP">Ip</option>
              </Select>
            </div>

            {/* Reset */}
            <div className="flex gap-2">
              <Input
                placeholder="Filter Source IP"
                value={sourceIpFilter}
                onChange={(e) => {
                  setSourceIpFilter(e.target.value);
                  setPage(1);
                }}
                className="text-body font-mono"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleResetFilters}
                className="shrink-0 h-9 w-9 text-zinc-400 hover:text-zinc-100"
                title="Reset filters"
              >
                <RotateCcw className="h-4 w-4" strokeWidth={1.5} />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <thead>
                <tr>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-3">SID</th>
                  <th className="py-3 px-4">Signature message</th>
                  <th className="py-3 px-3">Proto</th>
                  <th className="py-3 px-4">Source &rarr; destination</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono">
                      Querying security events database
                    </td>
                  </tr>
                ) : events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center space-y-2">
                      <p className="text-zinc-400">No security events match the current filter criteria.</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleResetFilters}
                        className="text-body"
                      >
                        Clear filters
                      </Button>
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr
                      key={ev.id}
                      className="hover:bg-zinc-900/50 transition-colors group"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        {getPriorityBadge(ev.priority)}
                      </td>
                      <td className="py-3 px-3 font-mono font-medium text-zinc-300 whitespace-nowrap">
                        {ev.signatureId}
                      </td>
                      <td className="py-3 px-4 max-w-xs sm:max-w-md">
                        <div className="font-medium text-zinc-200 truncate">
                          {ev.signatureMessage}
                        </div>
                        {ev.classification && (
                          <div className="text-xs text-zinc-500 truncate">
                            {ev.classification}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-sky-400 font-medium whitespace-nowrap">
                        {ev.protocol}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-400 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-300">
                            {ev.sourceIp}{ev.sourcePort !== null ? `:${ev.sourcePort}` : ''}
                          </span>
                          <span className="text-zinc-600">&rarr;</span>
                          <span className="text-zinc-300">
                            {ev.destinationIp}{ev.destinationPort !== null ? `:${ev.destinationPort}` : ''}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-500 whitespace-nowrap">
                        {new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                        <span className="text-zinc-600">{new Date(ev.timestamp).toISOString().split('T')[0]}</span>
                      </td>
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedEvent(ev)}
                          className="h-7 px-3 text-body text-zinc-400 hover:text-zinc-100 flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" strokeWidth={1.5} />
                          <span>Inspect</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination Controls */}
          <div className="p-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-body text-zinc-400">
            <div className="flex items-center gap-2">
              <span>Showing page {page} of {totalPages || 1}</span>
              <span className="text-zinc-600">&bull;</span>
              <span>{totalCount} total alerts</span>
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="h-8 rounded border border-zinc-800 bg-zinc-900 px-2 text-body font-mono text-zinc-300"
              >
                <option value="10">10 / page</option>
                <option value="20">20 / page</option>
                <option value="50">50 / page</option>
              </Select>

              <div className="flex items-center space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-2"
                >
                  <ChevronRight className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />

      <IngestAlertModal
        isOpen={isIngestOpen}
        onClose={() => setIsIngestOpen(false)}
        onSuccess={() => {
          fetchEvents();
        }}
      />
    </div>
  );
};

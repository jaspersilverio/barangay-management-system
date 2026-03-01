import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import {
  Search,
  RefreshCw,
  FileText,
  Calendar,
  MapPin,
  CheckCircle,
  Download
} from 'lucide-react';
import {
  type Blotter,
  type BlotterFilters,
  type BlotterStatistics,
  getBlottersListCached,
  setBlottersListCached,
  getBlotterStatsCached,
  setBlotterStatsCached,
  clearBlotterPageCache,
} from '../services/blotter.service';
import blotterService from '../services/blotter.service';
import AddBlotterModal from '../components/blotter/AddBlotterModal';
import EditBlotterModal from '../components/blotter/EditBlotterModal';
import ViewBlotterModal from '../components/blotter/ViewBlotterModal';
import DeleteConfirmModal from '../components/blotter/DeleteConfirmModal';
import { Button, Alert } from 'react-bootstrap';
import { exportBlottersToPdf } from '../services/pdf.service';
import { exportBlottersCsv } from '../services/reports.service';

const STATS_CACHE_KEY = 'blotter:stats';

function listCacheKey(f: BlotterFilters): string {
  return `blotter:list:${f.search ?? ''}:${f.status ?? ''}:${f.start_date ?? ''}:${f.end_date ?? ''}:${f.per_page ?? 15}:${f.page ?? 1}`;
}

const BlotterPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const { refreshData: refreshDashboard } = useDashboard();
  const canDelete = user?.role === 'admin' || user?.role === 'captain' || user?.role === 'purok_leader';
  const canResolve = user?.role === 'admin' || user?.role === 'captain';
  const [blotters, setBlotters] = useState<Blotter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlotter, setSelectedBlotter] = useState<Blotter | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBlotter, setDeleteBlotter] = useState<Blotter | null>(null);
  const [resolvingId, setResolvingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [filters, setFilters] = useState<BlotterFilters>({
    search: '',
    status: '',
    start_date: '',
    end_date: '',
    per_page: 15,
    page: 1
  });
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  const [statistics, setStatistics] = useState<BlotterStatistics>({
    total: 0,
    ongoing: 0,
    resolved: 0,
    this_month: 0,
    this_year: 0
  });

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setFilters(prev => ({ ...prev, search: searchInput, page: 1 }));
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const listKey = useMemo(() => listCacheKey(filters), [filters]);

  const loadBlotters = useCallback(
    async (showLoading = true, cacheKey?: string) => {
      const key = cacheKey ?? listKey;
      if (showLoading) setLoading(true);
      try {
        const response = await blotterService.getBlotters(filters);
        setBlotters(response.data);
        setPagination({
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total
        });
        setBlottersListCached(key, response);
      } catch {
        // Keep previous data on error
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [filters, listKey]
  );

  const loadStatistics = useCallback(async () => {
    try {
      const response = await blotterService.getStatistics();
      setStatistics(response);
      setBlotterStatsCached(STATS_CACHE_KEY, response);
    } catch {
      // Keep previous stats on error
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    const listCached = getBlottersListCached<{ data: Blotter[]; current_page: number; last_page: number; per_page: number; total: number }>(listKey);
    const statsCached = getBlotterStatsCached<BlotterStatistics>(STATS_CACHE_KEY);

    if (listCached) {
      setBlotters(listCached.data);
      setPagination({
        current_page: listCached.current_page,
        last_page: listCached.last_page,
        per_page: listCached.per_page,
        total: listCached.total
      });
      setLoading(false);
      loadBlotters(false, listKey).catch(() => {});
    } else {
      loadBlotters(true, listKey);
    }

    if (statsCached) {
      setStatistics(statsCached);
      loadStatistics().catch(() => {});
    } else {
      loadStatistics();
    }
  }, [isAuthenticated, listKey, loadBlotters, loadStatistics]);

  const handleFilterChange = (key: keyof BlotterFilters, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleAddBlotter = () => {
    setSelectedBlotter(null);
    setShowAddModal(true);
  };

  const handleEditBlotter = (blotter: Blotter) => {
    setSelectedBlotter(blotter);
    setShowEditModal(true);
  };

  const handleViewBlotter = (blotter: Blotter) => {
    setSelectedBlotter(blotter);
    setShowViewModal(true);
  };

  const handleDeleteBlotter = (blotter: Blotter) => {
    setDeleteBlotter(blotter);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteBlotter) return;
    const deletedId = deleteBlotter.id;
    const previousBlotters = [...blotters];
    const previousPagination = { ...pagination };

    try {
      // Optimistically remove the item from the list immediately
      setBlotters(prev => prev.filter(b => b.id !== deletedId));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setShowDeleteModal(false);
      setDeleteBlotter(null);
      
      // Delete from backend
      await blotterService.deleteBlotter(deletedId);
      
      // Refresh dashboard to update counts - await to ensure it completes
      await refreshDashboard();
      
      // Reload statistics silently (doesn't affect list)
      loadStatistics().catch(() => {});
      
      // Only reload list if we need to fix pagination (e.g. deleted last item on page)
      // Otherwise, optimistic update is sufficient - reloading too fast can restore deleted items
      const remainingOnPage = blotters.length - 1;
      if (remainingOnPage === 0 && pagination.current_page > 1) {
        // Deleted last item on page, go to previous page
        setFilters(prev => ({ ...prev, page: Math.max(1, (prev.page ?? 1) - 1) }));
      }
    } catch {
      setBlotters(previousBlotters);
      setPagination(previousPagination);
      loadBlotters(false);
      loadStatistics();
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedBlotter(null);
  };

  const handleModalSuccess = async () => {
    handleModalClose();
    await refreshDashboard();
    loadBlotters();
    loadStatistics();
  };

  const handleExport = async (type: 'pdf' | 'csv') => {
    setError(null);
    try {
      if (type === 'pdf') {
        const params: Record<string, string> = {};
        if (filters.status) params.status = filters.status;
        if (filters.start_date) params.start_date = filters.start_date;
        if (filters.end_date) params.end_date = filters.end_date;
        if (debouncedSearch) params.search = debouncedSearch;
        await exportBlottersToPdf(params);
      } else {
        await exportBlottersCsv({
          status: filters.status,
          start_date: filters.start_date,
          end_date: filters.end_date,
          search: debouncedSearch,
        });
      }
    } catch (err: unknown) {
      const msg = err && typeof err === 'object' && 'response' in err
        ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
        : null;
      setError(msg || `Failed to export ${type.toUpperCase()}`);
    }
  };

  const normalizeStatus = (status?: string) => (status || '').toLowerCase();

  const getStatusBadge = (status: string) => {
    const normalizedStatus = normalizeStatus(status);
    const isResolved = normalizedStatus === 'resolved';
    const Icon = isResolved ? CheckCircle : RefreshCw;
    const label = isResolved ? 'Resolved' : 'Ongoing';
    const variant = isResolved ? 'success' : 'warning';

    return (
      <span className={`badge bg-${variant} d-flex align-items-center gap-1`}>
        <Icon size={12} />
        {label}
      </span>
    );
  };

  const handleMarkResolved = async (blotter: Blotter) => {
    setResolvingId(blotter.id);
    setError(null);
    try {
      await blotterService.updateBlotter(blotter.id, { status: 'resolved' });
      await refreshDashboard();
      loadBlotters(false);
      loadStatistics();
    } catch {
      setError('Failed to mark blotter as resolved.');
    } finally {
      setResolvingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="container mt-4">
        <Alert variant="warning">
          Please log in to access the blotter system.
        </Alert>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2 className="mb-0 text-brand-primary">Blotter Cases</h2>
          <p className="text-brand-muted mb-0">Manage incident reports and case tracking</p>
        </div>
        <div className="page-actions">
          <Button
            variant="primary"
            size="lg"
            onClick={handleAddBlotter}
            className="btn-brand-primary"
          >
            <i className="fas fa-plus me-2"></i>
            Add New Case
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-2">
          <div className="card bg-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Total Cases</h6>
                  <h3 className="mb-0">{statistics.total}</h3>
                </div>
                <FileText size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-info text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Ongoing</h6>
                  <h3 className="mb-0">{statistics.ongoing}</h3>
                </div>
                <RefreshCw size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-success text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Resolved</h6>
                  <h3 className="mb-0">{statistics.resolved}</h3>
                </div>
                <CheckCircle size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-secondary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">This Month</h6>
                  <h3 className="mb-0">{statistics.this_month}</h3>
                </div>
                <Calendar size={24} />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-2">
          <div className="card bg-brand-primary text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">This Year</h6>
                  <h3 className="mb-0">{statistics.this_year}</h3>
                </div>
                <Calendar size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Search</label>
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Case number, location, or names..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-2">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="ongoing">Ongoing</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
            <div className="col-md-2">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">End Date</label>
              <input
                type="date"
                className="form-control"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="form-label">Per Page</label>
              <select
                className="form-select"
                value={filters.per_page}
                onChange={(e) => handleFilterChange('per_page', parseInt(e.target.value))}
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
            <div className="col-md-2 d-flex align-items-end gap-2">
              <Button variant="outline-secondary" onClick={() => loadBlotters(true)} title="Reload list">
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
          <div className="row g-3 mt-2">
            <div className="col-md-12 d-flex justify-content-end">
              <div className="btn-group">
                <Button
                  variant="outline-primary"
                  onClick={() => handleExport('pdf')}
                >
                  <Download size={16} className="me-2" />
                  Export PDF
                </Button>
                <Button
                  variant="outline-success"
                  onClick={() => handleExport('csv')}
                >
                  <Download size={16} className="me-2" />
                  Export CSV
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Blotter Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Case Number</th>
                  <th>Complainant</th>
                  <th>Respondent</th>
                  <th>Assigned Official</th>
                  <th>Incident Date</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <>
                    {[...Array(5)].map((_, index) => (
                      <tr key={index} className="table-row">
                        <td>
                          <div className="skeleton-line" style={{ width: '120px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '150px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-badge" style={{ width: '80px', height: '20px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '80px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="skeleton-line" style={{ width: '100px', height: '16px' }}></div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <div className="skeleton-button" style={{ width: '50px', height: '28px', marginRight: '5px' }}></div>
                            <div className="skeleton-button" style={{ width: '50px', height: '28px', marginRight: '5px' }}></div>
                            <div className="skeleton-button" style={{ width: '50px', height: '28px' }}></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                ) : blotters.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-4 text-brand-muted">
                      No blotter cases found.
                    </td>
                  </tr>
                ) : (
                  blotters.map((blotter) => (
                    <tr key={blotter.id}>
                      <td>
                        <strong>{blotter.case_number}</strong>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">
                            {blotter.complainant_name || 'N/A'}
                          </div>
                          <small className="text-brand-muted">
                            {blotter.complainant_type}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">
                            {blotter.respondent_name || 'N/A'}
                          </div>
                          <small className="text-brand-muted">
                            {blotter.respondent_type}
                          </small>
                        </div>
                      </td>
                      <td>{blotter.assigned_official_display || 'Unassigned'}</td>
                      <td>
                        <div>
                          <div>{formatDate(blotter.incident_date)}</div>
                          <small className="text-brand-muted">
                            {formatTime(blotter.incident_time)}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <MapPin size={14} className="me-1 text-brand-muted" />
                          <span className="text-truncate" style={{ maxWidth: '150px' }}>
                            {blotter.incident_location}
                          </span>
                        </div>
                      </td>
                      <td>
                        {getStatusBadge(blotter.status)}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            size="sm"
                            onClick={() => handleViewBlotter(blotter)}
                            className="btn-action btn-action-view"
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                            View
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleEditBlotter(blotter)}
                            className="btn-action btn-action-edit"
                            title="Edit Case"
                          >
                            <i className="fas fa-edit"></i>
                            Edit
                          </Button>
                          {canResolve && normalizeStatus(blotter.status) === 'ongoing' && (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => handleMarkResolved(blotter)}
                              disabled={resolvingId === blotter.id}
                              className="btn-action btn-action-success"
                              title="Mark as Resolved"
                            >
                              {resolvingId === blotter.id ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
                                  Resolving...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-check-circle"></i>
                                  Mark as Resolved
                                </>
                              )}
                            </Button>
                          )}
                          {canDelete && (
                            <Button
                              size="sm"
                              onClick={() => handleDeleteBlotter(blotter)}
                              className="btn-action btn-action-delete"
                              title="Delete Case"
                            >
                              <i className="fas fa-trash"></i>
                              Delete
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.last_page > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3">
              <div className="text-brand-muted">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} entries
              </div>
              <nav>
                <ul className="pagination pagination-sm mb-0">
                  <li className={`page-item ${pagination.current_page === 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={pagination.current_page === 1}
                    >
                      Previous
                    </button>
                  </li>
                  {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                    <li key={page} className={`page-item ${pagination.current_page === page ? 'active' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}
                  <li className={`page-item ${pagination.current_page === pagination.last_page ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={pagination.current_page === pagination.last_page}
                    >
                      Next
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddBlotterModal
        show={showAddModal}
        onHide={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <EditBlotterModal
        show={showEditModal}
        blotter={selectedBlotter}
        onHide={handleModalClose}
        onSuccess={handleModalSuccess}
      />

      <ViewBlotterModal
        show={showViewModal}
        blotter={selectedBlotter}
        onHide={handleModalClose}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        blotter={deleteBlotter}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteBlotter(null);
        }}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default BlotterPage;
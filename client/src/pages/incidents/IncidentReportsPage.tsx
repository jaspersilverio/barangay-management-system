import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  FileText,
  Calendar,
  MapPin,
  CheckCircle,
  Plus,
  AlertCircle,
  Download
} from 'lucide-react';
import {
  type IncidentReport,
  type IncidentReportListParams,
  listIncidentReports,
  deleteIncidentReport,
  getIncidentReportsListCached,
  setIncidentReportsListCached,
  exportIncidentReportsToPdf,
  exportIncidentReportsToCsv
} from '../../services/incident-reports.service';
import AddIncidentReportModal from '../../components/incidents/AddIncidentReportModal';
import EditIncidentReportModal from '../../components/incidents/EditIncidentReportModal';
import ViewIncidentReportModal from '../../components/incidents/ViewIncidentReportModal';
import DeleteConfirmModal from '../../components/incidents/DeleteConfirmModal';
import { Button, Alert, Card, Form, Table, Pagination, InputGroup } from 'react-bootstrap';

function listCacheKey(search: string, status: string, start: string, end: string, p: number): string {
  return `incident-reports:${search}:${status}:${start}:${end}:${p}`;
}

const IncidentReportsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncidentReport, setSelectedIncidentReport] = useState<IncidentReport | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIncidentReportId, setDeleteIncidentReportId] = useState<number | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 15,
    total: 0
  });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  const listKey = useMemo(
    () => listCacheKey(debouncedSearch, statusFilter, startDate, endDate, page),
    [debouncedSearch, statusFilter, startDate, endDate, page]
  );

  useEffect(() => {
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current);
    }
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(inputValue);
      setPage(1);
    }, 300);
    debounceTimeoutRef.current = timeoutId;
    return () => {
      if (debounceTimeoutRef.current) {
        window.clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [inputValue]);

  const loadIncidentReports = useCallback(
    async (overrideSearch?: string, overridePage?: number, showLoading = true, cacheKey?: string) => {
      const key = cacheKey ?? listKey;
      if (showLoading) setLoading(true);
      try {
        const params: IncidentReportListParams = {
          search: overrideSearch !== undefined ? overrideSearch : debouncedSearch || undefined,
          status: statusFilter || undefined,
          start_date: startDate || undefined,
          end_date: endDate || undefined,
          page: overridePage !== undefined ? overridePage : page,
          per_page: 15
        };
        const response = await listIncidentReports(params);
        setIncidentReports(response.data.data);
        setPagination({
          current_page: response.data.current_page,
          last_page: response.data.last_page,
          per_page: response.data.per_page,
          total: response.data.total
        });
        setIncidentReportsListCached(key, response.data);
      } catch {
        // Keep previous data on error
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [debouncedSearch, statusFilter, startDate, endDate, page, listKey]
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const cached = getIncidentReportsListCached<{
      data: IncidentReport[];
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    }>(listKey);

    if (cached) {
      setIncidentReports(cached.data);
      setPagination({
        current_page: cached.current_page,
        last_page: cached.last_page,
        per_page: cached.per_page,
        total: cached.total
      });
      setLoading(false);
      loadIncidentReports(undefined, undefined, false, listKey).catch(() => {});
    } else {
      loadIncidentReports(undefined, undefined, true, listKey);
    }
  }, [isAuthenticated, listKey, loadIncidentReports]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle search input change - only updates input value, not search query
  // Search query is updated via debounce effect above
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Page reset is handled in debounce effect
  }, []);

  const handleSearchSubmit = useCallback(() => {
    if (debounceTimeoutRef.current) {
      window.clearTimeout(debounceTimeoutRef.current);
      debounceTimeoutRef.current = null;
    }
    setDebouncedSearch(inputValue);
    setPage(1);
    if (searchInputRef.current) searchInputRef.current.focus();
  }, [inputValue]);

  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleSearchSubmit();
      }
    },
    [handleSearchSubmit]
  );

  const handleAddIncidentReport = () => {
    setSelectedIncidentReport(null);
    setShowAddModal(true);
  };

  const handleEditIncidentReport = (incidentReport: IncidentReport) => {
    setSelectedIncidentReport(incidentReport);
    setShowEditModal(true);
  };

  const handleViewIncidentReport = (incidentReport: IncidentReport) => {
    setSelectedIncidentReport(incidentReport);
    setShowViewModal(true);
  };

  const handleDeleteIncidentReport = (id: number) => {
    setDeleteIncidentReportId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteIncidentReportId) return;
    const deletedId = deleteIncidentReportId;
    const previousReports = [...incidentReports];
    const previousPagination = { ...pagination };

    try {
      // Optimistically remove the item from the list immediately
      setIncidentReports(prev => prev.filter(r => r.id !== deletedId));
      setPagination(prev => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      setShowDeleteModal(false);
      setDeleteIncidentReportId(null);
      
      // Delete from backend
      const deleteResponse = await deleteIncidentReport(deletedId);
      
      if (!deleteResponse.success) {
        throw new Error(deleteResponse.message || 'Delete failed');
      }
      
      // Only reload if we need to fix pagination (e.g. deleted last item on page)
      // Otherwise, optimistic update is sufficient - reloading too fast can restore deleted items
      const remainingOnPage = incidentReports.length - 1;
      if (remainingOnPage === 0 && pagination.current_page > 1) {
        // Deleted last item on page, go to previous page
        setPage(pagination.current_page - 1);
      }
    } catch {
      setIncidentReports(previousReports);
      setPagination(previousPagination);
      loadIncidentReports(undefined, undefined, false);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedIncidentReport(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    loadIncidentReports();
  };

  const handleExportPdf = async () => {
    try {
      await exportIncidentReportsToPdf({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
    } catch {
      // Export failed silently or throws
    }
  };

  const handleExportCsv = async () => {
    try {
      await exportIncidentReportsToCsv({
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
    } catch {
      // Export failed silently or throws
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Recorded': { variant: 'secondary', icon: FileText },
      'Monitoring': { variant: 'warning', icon: AlertCircle },
      'Resolved': { variant: 'success', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Recorded'];
    const Icon = config.icon;

    return (
      <span className={`badge bg-${config.variant} d-flex align-items-center gap-1`}>
        <Icon size={12} />
        {status}
      </span>
    );
  };

  const formatDateTime = (dateString: string, timeString: string) => {
    const date = new Date(dateString);
    const [hours, minutes] = timeString.split(':');
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const canManage = user?.role === 'admin' || user?.role === 'purok_leader' || user?.role === 'staff';
  const canDelete = user?.role === 'admin' || user?.role === 'captain' || user?.role === 'purok_leader';

  if (!isAuthenticated) {
    return (
      <div className="container mt-4">
        <Alert variant="warning">
          Please log in to access incident reports.
        </Alert>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title">
          <h2 className="mb-0 text-brand-primary">Incident Reports</h2>
          <p className="text-brand-muted mb-0">Record and manage minor incidents for documentation</p>
        </div>
        <div className="page-actions">
          {canManage && (
            <Button
              variant="primary"
              size="lg"
              onClick={handleAddIncidentReport}
              disabled={loading}
              className="btn-brand-primary"
            >
              <Plus size={18} className="me-2" />
              Add Incident Report
            </Button>
          )}
        </div>
      </div>

      {/* Filters Section */}
      <Card className="filters-card mb-4">
        <Card.Body className="p-3">
          <div className="row g-3">
            <div className="col-md-4">
              <Form.Group>
                <Form.Label className="form-label-custom">Search</Form.Label>
                <InputGroup>
                  <InputGroup.Text>
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    ref={searchInputRef}
                    type="text"
                    placeholder="Title, description, or location..."
                    value={inputValue}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyDown}
                    className="form-control-custom"
                    autoComplete="off"
                  />
                </InputGroup>
              </Form.Group>
            </div>
            <div className="col-md-auto d-flex align-items-end">
              <Button
                variant="outline-primary"
                className="btn-outline-brand"
                onClick={handleSearchSubmit}
                disabled={loading}
              >
                <i className="fas fa-search me-2" />
                Search
              </Button>
            </div>
            <div className="col-md-2">
              <Form.Group>
                <Form.Label className="form-label-custom">Status</Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  disabled={loading}
                  className="form-control-custom"
                >
                  <option value="">All Status</option>
                  <option value="Recorded">Recorded</option>
                  <option value="Monitoring">Monitoring</option>
                  <option value="Resolved">Resolved</option>
                </Form.Select>
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group>
                <Form.Label className="form-label-custom">Start Date</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  disabled={loading}
                  className="form-control-custom"
                />
              </Form.Group>
            </div>
            <div className="col-md-3">
              <Form.Group>
                <Form.Label className="form-label-custom">End Date</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  disabled={loading}
                  className="form-control-custom"
                />
              </Form.Group>
            </div>
          </div>
          <div className="row g-3 mt-2">
            <div className="col-md-12 d-flex justify-content-end gap-2">
              <Button
                variant="outline-primary"
                onClick={handleExportPdf}
              >
                <Download size={16} className="me-2" />
                Export PDF
              </Button>
              <Button
                variant="outline-success"
                onClick={handleExportCsv}
              >
                <Download size={16} className="me-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Data Table */}
      <Card className="data-table-card">
        <Card.Body className="p-0">
          {loading ? (
            <div className="p-4 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : incidentReports.length === 0 ? (
            <div className="p-4 text-center">
              <Alert variant="info">
                <FileText size={24} className="mb-2" />
                <p className="mb-0">No incident reports found.</p>
              </Alert>
            </div>
          ) : (
            <>
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Date & Time</th>
                    <th>Incident Title</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentReports.map((incidentReport) => (
                    <tr key={incidentReport.id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <Calendar size={16} className="text-muted" />
                          <span>{formatDateTime(incidentReport.incident_date, incidentReport.incident_time)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="fw-medium">{incidentReport.incident_title}</div>
                        <small className="text-muted">
                          {incidentReport.description.substring(0, 50)}
                          {incidentReport.description.length > 50 ? '...' : ''}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <MapPin size={16} className="text-muted" />
                          <span>{incidentReport.location}</span>
                        </div>
                      </td>
                      <td>{getStatusBadge(incidentReport.status)}</td>
                      <td>
                        <div className="action-buttons">
                          <Button
                            size="sm"
                            onClick={() => handleViewIncidentReport(incidentReport)}
                            className="btn-action btn-action-view"
                            title="View Details"
                          >
                            <i className="fas fa-eye"></i>
                            View
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleEditIncidentReport(incidentReport)}
                                className="btn-action btn-action-edit"
                                title="Edit"
                              >
                                <i className="fas fa-edit"></i>
                                Edit
                              </Button>
                              {canDelete && (
                                <Button
                                  size="sm"
                                  onClick={() => handleDeleteIncidentReport(incidentReport.id)}
                                  className="btn-action btn-action-delete"
                                  title="Delete"
                                >
                                  <i className="fas fa-trash"></i>
                                  Delete
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              {pagination.last_page > 1 && (
                <div className="p-3 border-top">
                  <Pagination className="mb-0 justify-content-end">
                    <Pagination.First
                      onClick={() => handlePageChange(1)}
                      disabled={page === 1}
                    />
                    <Pagination.Prev
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1}
                    />
                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                      .filter((p) => {
                        if (pagination.last_page <= 7) return true;
                        return p === 1 || p === pagination.last_page || Math.abs(p - page) <= 2;
                      })
                      .map((p, idx, arr) => (
                        <React.Fragment key={p}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <Pagination.Ellipsis disabled />
                          )}
                          <Pagination.Item
                            active={p === page}
                            onClick={() => handlePageChange(p)}
                          >
                            {p}
                          </Pagination.Item>
                        </React.Fragment>
                      ))}
                    <Pagination.Next
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page === pagination.last_page}
                    />
                    <Pagination.Last
                      onClick={() => handlePageChange(pagination.last_page)}
                      disabled={page === pagination.last_page}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modals */}
      <AddIncidentReportModal
        show={showAddModal}
        onHide={handleModalClose}
        onSuccess={handleModalSuccess}
      />
      <EditIncidentReportModal
        show={showEditModal}
        onHide={handleModalClose}
        onSuccess={handleModalSuccess}
        incidentReport={selectedIncidentReport}
      />
      <ViewIncidentReportModal
        show={showViewModal}
        onHide={handleModalClose}
        incidentReport={selectedIncidentReport}
        onConvertToBlotter={handleModalSuccess}
      />
      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteIncidentReportId(null);
        }}
        onConfirm={handleConfirmDelete}
        incidentReportId={deleteIncidentReportId}
      />
    </div>
  );
};

export default IncidentReportsPage;


import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  RefreshCw,
  FileText,
  Calendar,
  MapPin,
  CheckCircle,
  Eye,
  Edit,
  Trash2,
  Plus,
  AlertCircle
} from 'lucide-react';
import { 
  type IncidentReport, 
  type IncidentReportListParams,
  listIncidentReports,
  deleteIncidentReport
} from '../../services/incident-reports.service';
import AddIncidentReportModal from '../../components/incidents/AddIncidentReportModal';
import EditIncidentReportModal from '../../components/incidents/EditIncidentReportModal';
import ViewIncidentReportModal from '../../components/incidents/ViewIncidentReportModal';
import DeleteConfirmModal from '../../components/incidents/DeleteConfirmModal';
import { Button, Alert, Card, Form, Table, Badge, Pagination, InputGroup } from 'react-bootstrap';

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
  
  // Filters and pagination
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

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(inputValue);
      setPage(1); // Reset to first page when search changes
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  // Load incident reports
  const loadIncidentReports = async () => {
    try {
      setLoading(true);
      const params: IncidentReportListParams = {
        search: debouncedSearch || undefined,
        status: statusFilter || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        page,
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
    } catch (error) {
      console.error('Error loading incident reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadIncidentReports();
    }
  }, [isAuthenticated, debouncedSearch, statusFilter, startDate, endDate, page]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

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

    try {
      await deleteIncidentReport(deleteIncidentReportId);
      await loadIncidentReports();
      setShowDeleteModal(false);
      setDeleteIncidentReportId(null);
    } catch (error) {
      console.error('Error deleting incident report:', error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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

  const canManage = user?.role === 'admin' || user?.role === 'purok_leader';

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
                    type="text"
                    placeholder="Title, description, or location..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    disabled={loading}
                    className="form-control-custom"
                  />
                </InputGroup>
              </Form.Group>
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
                    <th>Reporting Officer</th>
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
                        {incidentReport.reporting_officer?.name || 'N/A'}
                      </td>
                      <td>
                        <div className="d-flex justify-content-end gap-2">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => handleViewIncidentReport(incidentReport)}
                            title="View Details"
                          >
                            <Eye size={16} />
                          </Button>
                          {canManage && (
                            <>
                              <Button
                                variant="outline-warning"
                                size="sm"
                                onClick={() => handleEditIncidentReport(incidentReport)}
                                title="Edit"
                              >
                                <Edit size={16} />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteIncidentReport(incidentReport.id)}
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </Button>
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


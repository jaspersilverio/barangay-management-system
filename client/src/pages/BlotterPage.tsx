import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  RefreshCw,
  FileText,
  Calendar,
  MapPin,
  CheckCircle
} from 'lucide-react';
import { type Blotter, type BlotterFilters } from '../services/blotter.service';
import blotterService from '../services/blotter.service';
import AddBlotterModal from '../components/blotter/AddBlotterModal';
import EditBlotterModal from '../components/blotter/EditBlotterModal';
import ViewBlotterModal from '../components/blotter/ViewBlotterModal';
import DeleteConfirmModal from '../components/blotter/DeleteConfirmModal';
import { Button, Alert } from 'react-bootstrap';

const BlotterPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [blotters, setBlotters] = useState<Blotter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlotter, setSelectedBlotter] = useState<Blotter | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBlotter, setDeleteBlotter] = useState<Blotter | null>(null);
  
  // Filters and pagination
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

  // Statistics
  const [statistics, setStatistics] = useState({
    total: 0,
    open: 0,
    ongoing: 0,
    resolved: 0,
    this_month: 0,
    this_year: 0
  });

  // Load blotters
  const loadBlotters = async () => {
    try {
      setLoading(true);
      const response = await blotterService.getBlotters(filters);
      
      setBlotters(response.data);
      setPagination({
        current_page: response.current_page,
        last_page: response.last_page,
        per_page: response.per_page,
        total: response.total
      });
    } catch (error) {
      console.error('Error loading blotters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const response = await blotterService.getStatistics();
      setStatistics(response);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadBlotters();
      loadStatistics();
    }
  }, [isAuthenticated, filters]);

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

    try {
      await blotterService.deleteBlotter(deleteBlotter.id);
      await loadBlotters();
      await loadStatistics();
      setShowDeleteModal(false);
      setDeleteBlotter(null);
    } catch (error) {
      console.error('Error deleting blotter:', error);
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowViewModal(false);
    setSelectedBlotter(null);
  };

  const handleModalSuccess = () => {
    handleModalClose();
    loadBlotters();
    loadStatistics();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'Open': { variant: 'warning', icon: FileText },
      'Ongoing': { variant: 'info', icon: RefreshCw },
      'Resolved': { variant: 'success', icon: CheckCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['Open'];
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
          <h2 className="mb-0">Blotter Cases</h2>
          <p className="text-muted mb-0">Manage incident reports and case tracking</p>
        </div>
        <div className="page-actions">
          <Button 
            variant="primary" 
            size="lg"
            onClick={handleAddBlotter}
            className="btn-primary-custom btn-action-add"
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
          <div className="card bg-warning text-white">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Open</h6>
                  <h3 className="mb-0">{statistics.open}</h3>
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
          <div className="card bg-dark text-white">
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
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
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
                <option value="Open">Open</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Resolved">Resolved</option>
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
            <div className="col-md-1 d-flex align-items-end">
              <Button variant="outline-secondary" onClick={loadBlotters}>
                <RefreshCw size={16} />
              </Button>
            </div>
          </div>
        </div>
      </div>

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
                    <td colSpan={7} className="text-center py-4 text-muted">
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
                          <small className="text-muted">
                            {blotter.complainant_type}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div className="fw-medium">
                            {blotter.respondent_name || 'N/A'}
                          </div>
                          <small className="text-muted">
                            {blotter.respondent_type}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <div>{formatDate(blotter.incident_date)}</div>
                          <small className="text-muted">
                            {formatTime(blotter.incident_time)}
                          </small>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <MapPin size={14} className="me-1 text-muted" />
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
                          <Button
                            size="sm"
                            onClick={() => handleDeleteBlotter(blotter)}
                            className="btn-action btn-action-delete"
                            title="Delete Case"
                          >
                            <i className="fas fa-trash"></i>
                            Delete
                          </Button>
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
              <div className="text-muted">
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
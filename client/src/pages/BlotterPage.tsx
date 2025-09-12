import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Eye, 
  Trash2, 
  Filter,
  RefreshCw,
  FileText,
  Calendar,
  MapPin,
  CheckCircle,
  Archive,
  RotateCcw,
  Lock,
  AlertTriangle
} from 'lucide-react';
import { type Blotter, type BlotterFilters } from '../services/blotter.service';
import blotterService from '../services/blotter.service';
import AddBlotterModal from '../components/blotter/AddBlotterModal';
import EditBlotterModal from '../components/blotter/EditBlotterModal';
import ViewBlotterModal from '../components/blotter/ViewBlotterModal';
import DeleteConfirmModal from '../components/blotter/DeleteConfirmModal';
import { Button, Alert, Modal, Form, Spinner } from 'react-bootstrap';

const BlotterPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [blotters, setBlotters] = useState<Blotter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlotter, setSelectedBlotter] = useState<Blotter | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteBlotter, setDeleteBlotter] = useState<Blotter | null>(null);
  
  // Archive-related state
  const [showArchiveView, setShowArchiveView] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [archiveAuthenticated, setArchiveAuthenticated] = useState(false);
  
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

  // Load blotters (active or archived)
  const loadBlotters = async () => {
    try {
      setLoading(true);
      let response;
      
      if (showArchiveView && archiveAuthenticated) {
        const archiveResponse = await blotterService.getArchivedBlotters(filters);
        
        // Archived blotters response structure: { success: true, data: { data: [...], meta: {...} } }
        const archivedData = archiveResponse.data.data;
        setBlotters(archivedData.data || []);
        setPagination({
          current_page: archivedData.current_page || 1,
          last_page: archivedData.last_page || 1,
          per_page: archivedData.per_page || 15,
          total: archivedData.total || 0
        });
      } else {
        response = await blotterService.getBlotters(filters);
        
        setBlotters(response.data);
        setPagination({
          current_page: response.current_page,
          last_page: response.last_page,
          per_page: response.per_page,
          total: response.total
        });
      }
    } catch (error) {
      console.error('Error loading blotters:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load statistics
  const loadStatistics = async () => {
    try {
      const stats = await blotterService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (showArchiveView && archiveAuthenticated) {
        loadBlotters();
      } else if (!showArchiveView) {
        loadBlotters();
        loadStatistics();
      }
    }
  }, [filters, isAuthenticated, showArchiveView, archiveAuthenticated]);

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      search: e.target.value,
      page: 1
    }));
  };

  // Handle status filter
  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: status === prev.status ? '' : status,
      page: 1
    }));
  };

  // Handle date filters
  const handleDateFilter = (field: 'start_date' | 'end_date', value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1
    }));
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  // Handle add blotter
  const handleAddBlotter = async () => {
    await loadBlotters();
    await loadStatistics();
    setShowAddModal(false);
  };

  // Handle edit blotter
  const handleEditBlotter = (blotter: Blotter) => {
    setSelectedBlotter(blotter);
    setShowEditModal(true);
  };

  // Handle update blotter
  const handleUpdateBlotter = async () => {
    await loadBlotters();
    await loadStatistics();
    setShowEditModal(false);
    setSelectedBlotter(null);
  };

  // Handle view blotter
  const handleViewBlotter = (blotter: Blotter) => {
    setSelectedBlotter(blotter);
    setShowViewModal(true);
  };

  // Handle delete blotter
  const handleDeleteBlotter = (blotter: Blotter) => {
    setDeleteBlotter(blotter);
    setShowDeleteModal(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (deleteBlotter) {
      try {
        await blotterService.deleteBlotter(deleteBlotter.id);
        await loadBlotters();
        await loadStatistics();
        setShowDeleteModal(false);
        setDeleteBlotter(null);
      } catch (error) {
        console.error('Error deleting blotter:', error);
      }
    }
  };

  // Archive-related handlers
  const handleToggleArchive = () => {
    if (user?.role !== 'admin') {
      alert('Access denied. This feature is only available to administrators.');
      return;
    }

    if (!showArchiveView) {
      // Switching to archive view - require password
      setShowPasswordModal(true);
    } else {
      // Switching back to active view
      setShowArchiveView(false);
      setArchiveAuthenticated(false);
      setPassword('');
      setPasswordError('');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');

    try {
      const isValid = await blotterService.verifyArchivePassword(password);
      if (isValid) {
        setArchiveAuthenticated(true);
        setShowArchiveView(true);
        setShowPasswordModal(false);
        setPassword('');
      } else {
        setPasswordError('Invalid password. Please try again.');
      }
    } catch (error) {
      setPasswordError('Failed to verify password. Please try again.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRestoreBlotter = async (blotter: Blotter) => {
    if (window.confirm(`Are you sure you want to restore blotter case ${blotter.case_number}?`)) {
      try {
        await blotterService.restoreBlotter(blotter.id);
        await loadBlotters();
        alert('Blotter case restored successfully!');
      } catch (error) {
        console.error('Error restoring blotter:', error);
        alert('Failed to restore blotter case.');
      }
    }
  };

  const handleForceDeleteBlotter = async (blotter: Blotter) => {
    if (window.confirm(`Are you sure you want to PERMANENTLY DELETE blotter case ${blotter.case_number}? This action cannot be undone!`)) {
      if (window.confirm('This will permanently remove all case data and attachments. Are you absolutely sure?')) {
        try {
          await blotterService.forceDeleteBlotter(blotter.id);
          await loadBlotters();
          alert('Blotter case permanently deleted.');
        } catch (error) {
          console.error('Error permanently deleting blotter:', error);
          alert('Failed to permanently delete blotter case.');
        }
      }
    }
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      start_date: '',
      end_date: '',
      per_page: 15,
      page: 1
    });
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Open':
        return 'badge bg-warning text-dark';
      case 'Ongoing':
        return 'badge bg-info text-white';
      case 'Resolved':
        return 'badge bg-success text-white';
      default:
        return 'badge bg-secondary text-white';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container-fluid">
        <div className="alert alert-warning">
          <h4>Authentication Required</h4>
          <p>Please log in to access the Blotter management system.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <FileText className="me-2" size={28} />
            {showArchiveView ? 'Blotter Archive' : 'Blotter Management'}
          </h2>
          <p className="text-muted mb-0">
            {showArchiveView ? 'Manage archived blotter cases' : 'Manage incident reports and complaints'}
          </p>
        </div>
        <div className="d-flex gap-2">
          {user?.role === 'admin' && (
            <button
              className={`btn ${showArchiveView ? 'btn-outline-secondary' : 'btn-outline-warning'}`}
              onClick={handleToggleArchive}
            >
              <Archive size={20} className="me-2" />
              {showArchiveView ? 'Back to Active' : 'View Archive'}
            </button>
          )}
          {!showArchiveView && (
            <button
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={20} className="me-2" />
              Add New Case
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards - Only show for active view */}
      {!showArchiveView && (
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
          <div className="card bg-warning text-dark">
            <div className="card-body">
              <div className="d-flex justify-content-between">
                <div>
                  <h6 className="card-title">Open</h6>
                  <h3 className="mb-0">{statistics.open}</h3>
                </div>
                <Calendar size={24} />
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
      )}

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by case number, complainant, respondent, location..."
                  value={filters.search}
                  onChange={handleSearch}
                />
              </div>
            </div>
            <div className="col-md-2">
              <select
                className="form-select"
                value={filters.status}
                onChange={(e) => handleStatusFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="Open">Open</option>
                <option value="Ongoing">Ongoing</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                placeholder="Start Date"
                value={filters.start_date}
                onChange={(e) => handleDateFilter('start_date', e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                placeholder="End Date"
                value={filters.end_date}
                onChange={(e) => handleDateFilter('end_date', e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={clearFilters}
                >
                  <Filter size={16} />
                </button>
                <button
                  className="btn btn-outline-primary"
                  onClick={loadBlotters}
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
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
                      <th>Filed By</th>
                      {showArchiveView && <th>Date Deleted</th>}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {blotters.length === 0 ? (
                      <tr>
                        <td colSpan={showArchiveView ? 9 : 8} className="text-center py-4">
                          <div className="text-muted">
                            <FileText size={48} className="mb-2" />
                            <p>No blotter cases found</p>
                          </div>
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
                                {blotter.complainant_is_resident && blotter.complainant
                                  ? `${blotter.complainant.first_name} ${blotter.complainant.last_name}`
                                  : blotter.complainant_full_name || 'N/A'
                                }
                              </div>
                              <small className="text-muted">
                                {blotter.complainant_is_resident ? (
                                  <span className="badge bg-success">Resident</span>
                                ) : (
                                  <span className="badge bg-info">Non-Resident</span>
                                )}
                              </small>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">
                                {blotter.respondent_is_resident && blotter.respondent
                                  ? `${blotter.respondent.first_name} ${blotter.respondent.last_name}`
                                  : blotter.respondent_full_name || 'N/A'
                                }
                              </div>
                              <small className="text-muted">
                                {blotter.respondent_is_resident ? (
                                  <span className="badge bg-success">Resident</span>
                                ) : (
                                  <span className="badge bg-info">Non-Resident</span>
                                )}
                              </small>
                            </div>
                          </td>
                          <td>
                            <div>
                              <div>{formatDate(blotter.incident_date)}</div>
                              <small className="text-muted">
                                {blotter.incident_time}
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
                            <span className={getStatusBadgeClass(blotter.status)}>
                              {blotter.status}
                            </span>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">
                                {blotter.creator?.name}
                              </div>
                              <small className="text-muted">
                                {formatDate(blotter.created_at)}
                              </small>
                            </div>
                          </td>
                          {showArchiveView && (
                            <td>
                              <small className="text-muted">
                                {formatDate((blotter as any).deleted_at || '')}
                              </small>
                            </td>
                          )}
                          <td>
                            <div className="btn-group" role="group">
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => handleViewBlotter(blotter)}
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              {showArchiveView ? (
                                <>
                                  <button
                                    className="btn btn-sm btn-outline-success"
                                    onClick={() => handleRestoreBlotter(blotter)}
                                    title="Restore"
                                  >
                                    <RotateCcw size={14} />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleForceDeleteBlotter(blotter)}
                                    title="Delete Permanently"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    onClick={() => handleEditBlotter(blotter)}
                                    title="Edit"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteBlotter(blotter)}
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
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
                <nav className="mt-3">
                  <ul className="pagination justify-content-center">
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
                      <li key={page} className={`page-item ${page === pagination.current_page ? 'active' : ''}`}>
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
              )}

              {/* Results info */}
              <div className="text-muted text-center mt-3">
                Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                {pagination.total} results
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddBlotterModal
        show={showAddModal}
        onHide={() => setShowAddModal(false)}
        onSuccess={handleAddBlotter}
      />

      <EditBlotterModal
        show={showEditModal}
        onHide={() => {
          setShowEditModal(false);
          setSelectedBlotter(null);
        }}
        blotter={selectedBlotter}
        onSuccess={handleUpdateBlotter}
      />

      <ViewBlotterModal
        show={showViewModal}
        onHide={() => {
          setShowViewModal(false);
          setSelectedBlotter(null);
        }}
        blotter={selectedBlotter}
      />

      <DeleteConfirmModal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeleteBlotter(null);
        }}
        blotter={deleteBlotter}
        onConfirm={handleConfirmDelete}
      />

      {/* Password Verification Modal */}
      <Modal show={showPasswordModal} onHide={() => {}} backdrop="static" keyboard={false} centered>
        <Modal.Header className="bg-warning text-dark">
          <Modal.Title>
            <Lock className="me-2" size={20} />
            Archive Access Required
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="warning" className="d-flex align-items-center">
            <AlertTriangle size={20} className="me-2" />
            <div>
              <strong>Security Notice:</strong> Access to the Blotter Archive requires password verification.
            </div>
          </Alert>
          
          <Form onSubmit={handlePasswordSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Enter your account password to continue:</Form.Label>
              <Form.Control
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                disabled={passwordLoading}
              />
              {passwordError && (
                <Form.Text className="text-danger">{passwordError}</Form.Text>
              )}
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowPasswordModal(false)}
                disabled={passwordLoading}
              >
                Cancel
              </Button>
              <Button 
                variant="warning" 
                type="submit" 
                disabled={passwordLoading || !password}
              >
                {passwordLoading ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Verifying...
                  </>
                ) : (
                  'Verify & Continue'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default BlotterPage;

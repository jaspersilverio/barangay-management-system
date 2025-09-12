import React, { useState } from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { type Blotter } from '../../services/blotter.service';

interface DeleteConfirmModalProps {
  show: boolean;
  onHide: () => void;
  blotter: Blotter | null;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  show,
  onHide,
  blotter,
  onConfirm
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  if (!blotter) return null;

  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <AlertTriangle className="me-2 text-warning" size={20} />
          Confirm Deletion
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        <Alert variant="warning" className="d-flex align-items-center">
          <AlertTriangle size={20} className="me-2" />
          <div>
            <strong>Warning:</strong> This action cannot be undone. All case data and attachments will be permanently deleted.
          </div>
        </Alert>

        <div className="mb-3">
          <p>Are you sure you want to delete this blotter case?</p>
          
          <div className="border rounded p-3 bg-light">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-2">
                  <strong>Case Number:</strong> {blotter.case_number}
                </div>
                <div className="mb-2">
                  <strong>Status:</strong> {blotter.status}
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-2">
                  <strong>Complainant:</strong> {blotter.complainant?.first_name} {blotter.complainant?.last_name}
                </div>
                <div className="mb-2">
                  <strong>Respondent:</strong> {blotter.respondent?.first_name} {blotter.respondent?.last_name}
                </div>
              </div>
            </div>
            <div className="mt-2">
              <strong>Incident Date:</strong> {new Date(blotter.incident_date).toLocaleDateString()}
            </div>
            <div className="mt-1">
              <strong>Location:</strong> {blotter.incident_location}
            </div>
          </div>
        </div>

        <div className="text-muted">
          <small>
            This will permanently remove all case information, including:
            <ul className="mt-2 mb-0">
              <li>Case details and description</li>
              <li>All file attachments</li>
              <li>Case history and updates</li>
              <li>Associated records</li>
            </ul>
          </small>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={loading}>
          <X size={16} className="me-1" />
          Cancel
        </Button>
        <Button variant="danger" onClick={handleConfirm} disabled={loading}>
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              Deleting...
            </>
          ) : (
            <>
              <Trash2 size={16} className="me-1" />
              Delete Case
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmModal;

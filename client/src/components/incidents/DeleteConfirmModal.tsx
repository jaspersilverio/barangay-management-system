import React from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { AlertTriangle } from 'lucide-react';

interface DeleteConfirmModalProps {
  show: boolean;
  onHide: () => void;
  onConfirm: () => void;
  incidentReportId: number | null;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  show,
  onHide,
  onConfirm,
  incidentReportId
}) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header className="border-0 pb-0">
        <Modal.Title className="d-flex align-items-center gap-2">
          <AlertTriangle size={20} className="text-danger" />
          <span>Confirm Delete</span>
        </Modal.Title>
        <Button variant="link" className="p-0" onClick={onHide}>
          ×
        </Button>
      </Modal.Header>
      <Modal.Body>
        <Alert variant="warning">
          <AlertTriangle size={16} className="me-2" />
          Are you sure you want to delete this incident report? This action cannot be undone.
        </Alert>
        <p className="mb-0">
          This will permanently remove the incident report from the system.
        </p>
      </Modal.Body>
      <Modal.Footer className="border-0">
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete Incident Report
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmModal;


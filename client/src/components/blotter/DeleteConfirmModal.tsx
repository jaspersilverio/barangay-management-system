import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { type Blotter } from '../../services/blotter.service';

interface DeleteConfirmModalProps {
  show: boolean;
  blotter: Blotter | null;
  onHide: () => void;
  onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  show,
  blotter,
  onHide,
  onConfirm,
}) => {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton className="modal-header-custom">
        <Modal.Title className="modal-title-custom text-brand-primary">Delete Blotter Case</Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-body-custom">
        {blotter ? (
          <div>
            <p>Are you sure you want to delete this blotter case?</p>
            <div className="bg-brand-surface p-3 rounded">
              <strong>Case Number:</strong> {blotter.case_number}<br />
              <strong>Complainant:</strong> {blotter.complainant_full_name}<br />
              <strong>Respondent:</strong> {blotter.respondent_full_name}<br />
              <strong>Status:</strong> {blotter.status}
            </div>
            <p className="mt-3 text-danger">
              <strong>Warning:</strong> This action cannot be undone.
            </p>
          </div>
        ) : (
          <p>Are you sure you want to delete this blotter case?</p>
        )}
      </Modal.Body>
      <Modal.Footer className="modal-footer-custom">
        <Button variant="secondary" onClick={onHide} className="btn-brand-secondary">
          <i className="fas fa-times me-1"></i>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} className="btn-danger">
          <i className="fas fa-trash me-1"></i>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmModal;

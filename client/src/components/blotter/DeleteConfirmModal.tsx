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
      <Modal.Header closeButton>
        <Modal.Title>Delete Blotter Case</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {blotter ? (
          <div>
            <p>Are you sure you want to delete this blotter case?</p>
            <div className="bg-light p-3 rounded">
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
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm}>
          Delete
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DeleteConfirmModal;

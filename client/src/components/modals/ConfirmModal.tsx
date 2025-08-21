import { Modal, Button } from 'react-bootstrap'

type Props = {
  show: boolean
  title?: string
  body?: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onHide: () => void
}

export default function ConfirmModal({ show, title = 'Confirm', body = 'Are you sure?', confirmText = 'Confirm', cancelText = 'Cancel', onConfirm, onHide }: Props) {
  return (
    <Modal show={show} onHide={onHide} centered>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>{cancelText}</Button>
        <Button variant="danger" onClick={onConfirm}>{confirmText}</Button>
      </Modal.Footer>
    </Modal>
  )
}



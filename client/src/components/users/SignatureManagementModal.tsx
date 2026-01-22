import { useState, useEffect } from 'react'
import { Modal, Form, Button, Alert, Image } from 'react-bootstrap'
import { Upload, CheckCircle, AlertCircle } from 'lucide-react'
import { getCaptainSignature, uploadCaptainSignature, type CaptainSignature } from '../../services/users.service'

interface SignatureManagementModalProps {
  show: boolean
  onHide: () => void
  onSignatureUpdated: () => void
}

export default function SignatureManagementModal({
  show,
  onHide,
  onSignatureUpdated
}: SignatureManagementModalProps) {
  const [signature, setSignature] = useState<CaptainSignature | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (show) {
      loadSignature()
    }
  }, [show])

  const loadSignature = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await getCaptainSignature()
      if (response.success) {
        setSignature(response.data)
        setPreviewUrl(response.data.signature_url || null)
      } else {
        setError(response.message || 'Failed to load signature')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load signature')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image file (JPEG, PNG, GIF, or SVG)')
      return
    }

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      setError('File size must be less than 2MB')
      return
    }

    setSelectedFile(file)
    setError(null)

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a signature image to upload')
      return
    }

    try {
      setUploading(true)
      setError(null)
      setSuccess(null)

      const response = await uploadCaptainSignature(selectedFile)
      if (response.success) {
        setSuccess('Signature uploaded successfully')
        setSelectedFile(null)
        // Reload signature to get updated URL
        await loadSignature()
        onSignatureUpdated()
        // Clear preview after 2 seconds
        setTimeout(() => {
          setSuccess(null)
        }, 3000)
      } else {
        setError(response.message || 'Failed to upload signature')
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to upload signature')
    } finally {
      setUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setPreviewUrl(signature?.signature_url || null)
    setError(null)
    setSuccess(null)
    onHide()
  }

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Manage Captain Signature</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            <AlertCircle className="w-4 h-4 me-2" />
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
            <CheckCircle className="w-4 h-4 me-2" />
            {success}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Current Signature Status */}
            <div className="mb-4">
              <h6 className="mb-3">Current Signature Status</h6>
              {signature?.has_signature ? (
                <Alert variant="success" className="d-flex align-items-center">
                  <CheckCircle className="w-5 h-5 me-2" />
                  <span>Signature is configured and ready for document approvals.</span>
                </Alert>
              ) : (
                <Alert variant="warning" className="d-flex align-items-center">
                  <AlertCircle className="w-5 h-5 me-2" />
                  <div>
                    <strong>No signature uploaded.</strong>
                    <p className="mb-0 small">You must upload a signature before approving any certificates or official documents.</p>
                  </div>
                </Alert>
              )}
            </div>

            {/* Current Signature Preview */}
            {signature?.has_signature && previewUrl && (
              <div className="mb-4">
                <h6 className="mb-3">Current Signature</h6>
                <div className="border rounded p-3 bg-light d-inline-block">
                  <Image
                    src={previewUrl}
                    alt="Captain Signature"
                    style={{ maxWidth: '300px', maxHeight: '120px', objectFit: 'contain' }}
                  />
                </div>
              </div>
            )}

            {/* Upload Section */}
            <div>
              <h6 className="mb-3">
                {signature?.has_signature ? 'Replace Signature' : 'Upload Signature'}
              </h6>
              <Form.Group className="mb-3">
                <Form.Label>Select Signature Image</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/gif,image/svg+xml"
                  onChange={handleFileSelect}
                  disabled={uploading}
                />
                <Form.Text className="text-muted">
                  Supported formats: JPEG, PNG, GIF, SVG. Maximum size: 2MB
                </Form.Text>
              </Form.Group>

              {/* Preview of selected file */}
              {selectedFile && previewUrl && (
                <div className="mb-3">
                  <h6 className="mb-2">Preview</h6>
                  <div className="border rounded p-3 bg-light d-inline-block">
                    <Image
                      src={previewUrl}
                      alt="Signature Preview"
                      style={{ maxWidth: '300px', maxHeight: '120px', objectFit: 'contain' }}
                    />
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-info bg-opacity-10 rounded">
                <p className="mb-0 small text-info">
                  <strong>Important:</strong> The signature will be used for all official document approvals including certificates, blotters, and incident reports. 
                  Make sure the signature image is clear and professional.
                </p>
              </div>
            </div>
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose} disabled={uploading}>
          Close
        </Button>
        {selectedFile && (
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={uploading || !selectedFile}
          >
            {uploading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 me-2" />
                {signature?.has_signature ? 'Replace Signature' : 'Upload Signature'}
              </>
            )}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  )
}

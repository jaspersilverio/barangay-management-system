import { useState, useEffect } from 'react'
import { Form, Dropdown, Button, Spinner, Alert } from 'react-bootstrap'
import { getPuroks, type Purok } from '../../services/puroks.service'

interface PurokSelectorProps {
  selectedPurokId: number | null
  onPurokSelect: (purok: Purok | null) => void
  availablePuroks?: Purok[]
  className?: string
}

export default function PurokSelector({ 
  selectedPurokId, 
  onPurokSelect, 
  availablePuroks = [],
  className = '' 
}: PurokSelectorProps) {
  const [puroks, setPuroks] = useState<Purok[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadPuroks()
  }, [])

  // Refresh puroks when dropdown is opened
  const handleDropdownToggle = (isOpen: boolean) => {
    if (isOpen) {
      loadPuroks()
    }
  }

  const loadPuroks = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await getPuroks({ per_page: 100 }) // Get all puroks
      setPuroks(response.data.data)
    } catch (err) {
      console.error('Error loading puroks:', err)
      setError('Failed to load puroks')
    } finally {
      setIsLoading(false)
    }
  }

  // Use availablePuroks if provided, otherwise use all puroks
  const puroksToShow = availablePuroks.length > 0 ? availablePuroks : puroks
  
  const filteredPuroks = puroksToShow.filter(purok =>
    purok.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedPurok = puroksToShow.find(p => p.id === selectedPurokId)

  const handlePurokSelect = (purok: Purok) => {
    onPurokSelect(purok)
    setSearchTerm('')
  }

  const handleClearSelection = () => {
    onPurokSelect(null)
    setSearchTerm('')
  }

  return (
    <div className={`purok-selector ${className}`}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <label className="form-label mb-0 fw-semibold">
          Select Purok:
        </label>
        {selectedPurok && (
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleClearSelection}
            className="ms-auto"
          >
            Clear Selection
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      <Dropdown onToggle={handleDropdownToggle} className="w-100">
        <Dropdown.Toggle
          as={Button}
          variant="outline-primary"
          className="w-100 d-flex justify-content-between align-items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Spinner size="sm" className="me-2" />
              Loading puroks...
            </>
          ) : selectedPurok ? (
            selectedPurok.name
          ) : availablePuroks.length > 0 ? (
            'Select a purok to create boundary'
          ) : (
            'No available puroks'
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu className="w-100" style={{ maxHeight: '300px', overflowY: 'auto' }}>
          <div className="p-2">
            <Form.Control
              type="text"
              placeholder="Search puroks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="sm"
              className="mb-2"
            />
          </div>
          
          {filteredPuroks.length === 0 ? (
            <Dropdown.Item disabled>
              {searchTerm ? 'No puroks found' : 
               availablePuroks.length > 0 ? 'No available puroks found' : 
               'No puroks available'}
            </Dropdown.Item>
          ) : (
            filteredPuroks.map((purok) => (
              <Dropdown.Item
                key={purok.id}
                onClick={() => handlePurokSelect(purok)}
                active={selectedPurokId === purok.id}
                className="d-flex justify-content-between align-items-center"
              >
                <div>
                  <div className="fw-semibold">{purok.name}</div>
                  {purok.captain && (
                    <small className="text-muted">Leader: {purok.captain}</small>
                  )}
                </div>
                {selectedPurokId === purok.id && (
                  <i className="bi bi-check-circle-fill text-success"></i>
                )}
              </Dropdown.Item>
            ))
          )}
        </Dropdown.Menu>
      </Dropdown>

      {selectedPurok && (
        <div className="mt-2 p-2 bg-light rounded">
          <small className="text-muted">
            <strong>Selected:</strong> {selectedPurok.name}
            {selectedPurok.captain && (
              <span> • Leader: {selectedPurok.captain}</span>
            )}
          </small>
        </div>
      )}
    </div>
  )
}

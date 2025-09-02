import { useState, useEffect } from 'react'
import { Form, Spinner } from 'react-bootstrap'
import { searchHouseholdsAndResidents, type SearchResult } from '../../services/search.service'

interface MapSearchProps {
  onResultSelect: (result: SearchResult) => void
}

export default function MapSearch({ onResultSelect }: MapSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        performSearch()
      }, 300) // Debounce search

      return () => clearTimeout(timeoutId)
    } else {
      setSearchResults([])
      setShowResults(false)
    }
  }, [searchQuery])

  const performSearch = async () => {
    if (searchQuery.length < 2) return

    setIsSearching(true)
    try {
      const response = await searchHouseholdsAndResidents(searchQuery)
      if (response.success) {
        setSearchResults(response.data || [])
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleResultSelect = (result: SearchResult) => {
    onResultSelect(result)
    setSearchQuery('')
    setShowResults(false)
    setSearchResults([])
  }

  const getResultIcon = (type: string) => {
    return type === 'household' ? '🏠' : '👤'
  }

  const getResultLabel = (type: string) => {
    return type === 'household' ? 'Household' : 'Resident'
  }

  return (
    <div className="position-relative">
      <Form.Group>
        <Form.Label className="fw-bold">🔍 Search Head of Household or Resident</Form.Label>
        <Form.Control
          type="text"
          placeholder="Type name to search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setShowResults(true)}
        />
        {isSearching && (
          <div className="position-absolute top-50 end-0 translate-middle-y me-2">
            <Spinner animation="border" size="sm" />
          </div>
        )}
      </Form.Group>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div 
          className="position-absolute w-100 bg-white border rounded mt-1 shadow-sm"
          style={{ 
            maxHeight: '200px', 
            overflowY: 'auto',
            zIndex: 1000
          }}
        >
          {searchResults.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              className="p-2 border-bottom"
              style={{ cursor: 'pointer' }}
              onClick={() => handleResultSelect(result)}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              <div className="d-flex align-items-center">
                <div className="me-2">{getResultIcon(result.type)}</div>
                <div className="flex-grow-1">
                  <div className="fw-medium">{result.name}</div>
                  <div className="text-muted small">
                    {getResultLabel(result.type)}
                    {result.address && ` • ${result.address}`}
                    {result.age && ` • Age: ${result.age}`}
                    {result.sex && ` • ${result.sex}`}
                    {result.purok_name && ` • ${result.purok_name}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {showResults && searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
        <div className="position-absolute w-100 bg-white border rounded mt-1 p-2 text-muted small">
          No results found
        </div>
      )}
    </div>
  )
}

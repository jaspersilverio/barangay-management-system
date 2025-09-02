import { Button, ButtonGroup, Form } from 'react-bootstrap'

type Props = {
  mode?: 'sketch' | 'real'
  onToggleMode?: () => void
  onSave: () => void
  onLoad: () => void
  onExport: () => void
  onImport: (file: File) => void
  layers: Record<string, boolean>
  onToggleLayer: (key: string) => void
}

export default function MapToolbar({ mode, onToggleMode, onSave, onLoad, onExport, onImport, layers, onToggleLayer }: Props) {
  return (
    <div className="d-flex align-items-center gap-2 flex-wrap mb-3">
      <ButtonGroup>
        <Button variant="primary" onClick={onSave}>Save</Button>
        <Button variant="secondary" onClick={onLoad}>Load</Button>
        <Button variant="outline-secondary" onClick={onExport}>Export</Button>
        <Form.Label className="btn btn-outline-secondary mb-0">
          Import
          <Form.Control type="file" accept="application/json" className="d-none" onChange={(e) => {
            const target = e.target as HTMLInputElement
            const f = target.files?.[0]
            if (f) onImport(f)
          }} />
        </Form.Label>
      </ButtonGroup>

      {mode && onToggleMode && (
        <Button variant="warning" onClick={onToggleMode}>
          {mode === 'sketch' ? 'Switch to Real Map' : 'Switch to Sketch Map'}
        </Button>
      )}

      <div className="d-flex align-items-center gap-3">
        {Object.keys(layers).map((k) => (
          <Form.Check
            key={k}
            type="switch"
            id={`layer-${k}`}
            label={`Layer: ${k}`}
            checked={layers[k]}
            onChange={() => onToggleLayer(k)}
          />
        ))}
      </div>
    </div>
  )
}

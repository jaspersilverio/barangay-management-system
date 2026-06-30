import { useMemo, useState } from 'react'
import { Form } from 'react-bootstrap'
import UnifiedReportPanel from './UnifiedReportPanel'

type BeneficiaryMode = '4ps' | 'seniors' | 'solo_parents' | 'pwd'

export default function BeneficiariesReport() {
  const [mode, setMode] = useState<BeneficiaryMode>('4ps')

  const pdfEndpoint = useMemo(() => {
    if (mode === 'solo_parents') return '/pdf/export/solo-parents'
    if (mode === 'seniors') return '/pdf/export/residents?vulnerabilities=seniors'
    if (mode === 'pwd') return '/pdf/export/residents?vulnerabilities=pwds'
    return '/pdf/export/households?fourps_only=1'
  }, [mode])

  const extraParams = useMemo(() => ({ program: mode }), [mode])

  return (
    <UnifiedReportPanel
      type="beneficiaries"
      title="Beneficiaries"
      pdfEndpoint={pdfEndpoint}
      extraParams={extraParams}
      selector={
        <Form.Group>
          <Form.Label>Beneficiary Type</Form.Label>
          <Form.Select value={mode} onChange={(e) => setMode(e.target.value as BeneficiaryMode)}>
            <option value="4ps">4Ps</option>
            <option value="seniors">Senior Citizens</option>
            <option value="solo_parents">Solo Parents</option>
            <option value="pwd">PWD</option>
          </Form.Select>
        </Form.Group>
      }
    />
  )
}

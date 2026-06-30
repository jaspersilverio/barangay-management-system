import UnifiedReportPanel from './UnifiedReportPanel'

export default function IncidentReportsReport() {
  return <UnifiedReportPanel type="incident_reports" title="Incident Reports" pdfEndpoint="/pdf/export/incident-reports" />
}

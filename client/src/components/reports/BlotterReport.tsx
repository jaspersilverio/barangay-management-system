import UnifiedReportPanel from './UnifiedReportPanel'

export default function BlotterReport() {
  return <UnifiedReportPanel type="blotter" title="Blotter" pdfEndpoint="/pdf/export/blotters" />
}

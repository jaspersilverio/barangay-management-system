import UnifiedReportPanel from './UnifiedReportPanel'

export default function VaccinationsReport() {
  return <UnifiedReportPanel type="vaccinations" title="Vaccinations" pdfEndpoint="/pdf/export/vaccinations" />
}

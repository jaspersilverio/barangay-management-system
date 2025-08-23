# Reports Module - Barangay Management System

## Overview

The Reports Module provides comprehensive reporting capabilities for the Barangay Management System, allowing administrators to generate detailed reports on households, residents, and puroks with filtering and export functionality.

## Features

### 📊 Report Types

1. **Households Report**

   - Filter by date range and purok
   - Shows household details, member count, and location
   - Pagination support
   - Export to PDF/Excel

2. **Residents Report**

   - Filter by date range, purok, sex, and vulnerabilities
   - Shows resident demographics and household information
   - Vulnerability identification (seniors, children, PWDs)
   - Pagination support
   - Export to PDF/Excel

3. **Puroks Summary Report**
   - Overview of all puroks with statistics
   - Population distribution and demographics
   - Vulnerable groups summary
   - Export to PDF/Excel

### 🔧 Technical Implementation

#### Backend (Laravel)

**API Endpoints:**

- `GET /api/reports/households` - Get households report with filters
- `GET /api/reports/residents` - Get residents report with filters
- `GET /api/reports/puroks` - Get puroks summary report
- `POST /api/reports/export` - Export reports to PDF/Excel

**Key Features:**

- Advanced filtering and pagination
- Relationship-based data aggregation
- Custom validation rules
- Export functionality (placeholder for PDF/Excel)

**Models & Relationships:**

- Enhanced Purok model with `residents()` relationship
- Proper eager loading for performance
- Efficient database queries with joins

#### Frontend (React + TypeScript)

**Components:**

- `Reports.tsx` - Main reports page with tab navigation
- `HouseholdsReport.tsx` - Households report with filters
- `ResidentsReport.tsx` - Residents report with advanced filters
- `PuroksReport.tsx` - Puroks summary with statistics

**Features:**

- Responsive design with Bootstrap
- Real-time filtering and pagination
- Export buttons for PDF/Excel
- Loading states and error handling
- Empty state handling

**Services:**

- `reports.service.ts` - API service for reports
- Type definitions for all report data
- Proper error handling and response typing

## Usage

### Accessing Reports

1. Navigate to `/reports` in the application
2. Use the tab navigation to switch between report types
3. Apply filters as needed
4. Use pagination to navigate through results
5. Export reports using the export buttons

### Filtering Options

**Households Report:**

- Date range (from/to)
- Purok selection
- Results per page

**Residents Report:**

- Date range (from/to)
- Purok selection
- Sex (Male/Female)
- Vulnerabilities (Seniors, Children, PWDs)
- Results per page

**Puroks Report:**

- No filters (shows all puroks summary)

### Export Functionality

- **PDF Export**: Generates PDF reports (placeholder implementation)
- **Excel Export**: Generates Excel reports (placeholder implementation)

_Note: Export functionality is currently implemented as placeholders. To enable actual file downloads, install and configure:_

- **DomPDF** for PDF generation
- **Laravel Excel** for Excel generation

## Installation & Setup

### Backend Dependencies

The module is ready to use with the current Laravel setup. For full export functionality, add:

```bash
# For PDF export
composer require barryvdh/laravel-dompdf

# For Excel export
composer require maatwebsite/excel
```

### Frontend Dependencies

All required dependencies are already included:

- React Bootstrap for UI components
- Lucide React for icons
- TypeScript for type safety

## Database Requirements

The module requires the following database structure:

- `puroks` table with relationships to households
- `households` table with relationships to residents and puroks
- `residents` table with demographic data

## Performance Considerations

- Uses eager loading to prevent N+1 queries
- Implements pagination for large datasets
- Efficient database joins for report generation
- Proper indexing on frequently queried fields

## Future Enhancements

1. **Chart Visualizations**

   - Population distribution charts
   - Demographics pie charts
   - Trend analysis graphs

2. **Advanced Export Options**

   - Custom report templates
   - Scheduled report generation
   - Email delivery

3. **Report Scheduling**

   - Automated report generation
   - Email notifications
   - Report archiving

4. **Advanced Analytics**
   - Population growth trends
   - Migration patterns
   - Socioeconomic indicators

## Troubleshooting

### Common Issues

1. **Empty Reports**

   - Check if data exists in the database
   - Verify filter criteria
   - Check API endpoint responses

2. **Performance Issues**

   - Ensure proper database indexing
   - Check query execution plans
   - Monitor database performance

3. **Export Failures**
   - Verify export libraries are installed
   - Check file permissions
   - Monitor server logs

### Debug Mode

Enable Laravel logging to debug API issues:

```php
// In EventController or ReportController
\Illuminate\Support\Facades\Log::info('Debug info', $data);
```

## API Documentation

### Request Parameters

**Households Report:**

```typescript
{
  date_from?: string;    // YYYY-MM-DD format
  date_to?: string;      // YYYY-MM-DD format
  purok_id?: number;     // Purok ID for filtering
  per_page?: number;     // Results per page (default: 15)
}
```

**Residents Report:**

```typescript
{
  date_from?: string;           // YYYY-MM-DD format
  date_to?: string;             // YYYY-MM-DD format
  purok_id?: number;            // Purok ID for filtering
  sex?: string;                 // 'Male' or 'Female'
  vulnerabilities?: string;      // Comma-separated list
  per_page?: number;            // Results per page (default: 15)
}
```

**Export Request:**

```typescript
{
  type: 'pdf' | 'excel';
  reportType: 'households' | 'residents' | 'puroks';
  filters?: ReportFilters;
}
```

### Response Format

All API endpoints return consistent JSON responses:

```typescript
{
  success: boolean;
  data: any;
  message: string | null;
  errors: any;
}
```

## Contributing

When contributing to the Reports Module:

1. Follow the existing code structure
2. Add proper TypeScript types
3. Include error handling
4. Add loading states for better UX
5. Test with various data scenarios
6. Update this documentation

## License

This module is part of the Barangay Management System and follows the same licensing terms.

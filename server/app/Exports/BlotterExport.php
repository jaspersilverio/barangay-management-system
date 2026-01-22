<?php

namespace App\Exports;

use App\Models\Blotter;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class BlotterExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
{
    protected $query;

    public function __construct($query)
    {
        $this->query = $query;
    }

    /**
     * @return \Illuminate\Support\Collection
     */
    public function collection()
    {
        try {
            // Ensure relationships are loaded - query builder can be reused
            return $this->query->with(['complainant.household.purok', 'respondent.household.purok', 'official', 'creator'])->get();
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('BlotterExport collection error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            // Re-throw so the controller can handle it
            throw $e;
        }
    }

    /**
     * @return array
     */
    public function headings(): array
    {
        return [
            'Case No.',
            'Complainant',
            'Respondent',
            'Incident Title',
            'Description',
            'Purok',
            'Location',
            'Status',
            'Date Reported',
            'Created By',
        ];
    }

    /**
     * @param mixed $blotter
     * @return array
     */
    public function map($blotter): array
    {
        try {
            // Get complainant name safely
            $complainantName = 'N/A';
            if ($blotter->complainant) {
                $complainantName = $blotter->complainant->full_name ?? ($blotter->complainant->first_name . ' ' . $blotter->complainant->last_name);
            } elseif ($blotter->complainant_full_name) {
                $complainantName = $blotter->complainant_full_name;
            }

            // Get respondent name safely
            $respondentName = 'N/A';
            if ($blotter->respondent) {
                $respondentName = $blotter->respondent->full_name ?? ($blotter->respondent->first_name . ' ' . $blotter->respondent->last_name);
            } elseif ($blotter->respondent_full_name) {
                $respondentName = $blotter->respondent_full_name;
            }

            // Get purok name safely
            $purokName = 'N/A';
            if ($blotter->complainant && $blotter->complainant->household && $blotter->complainant->household->purok) {
                $purokName = $blotter->complainant->household->purok->name ?? 'N/A';
            }

            // Get incident title (from description, limit to 50 chars)
            $incidentTitle = 'N/A';
            if ($blotter->description) {
                $incidentTitle = strlen($blotter->description) > 50 
                    ? substr($blotter->description, 0, 50) . '...' 
                    : $blotter->description;
            }

            // Get description safely (limit length for Excel)
            $description = $blotter->description ?? 'N/A';
            if (strlen($description) > 200) {
                $description = substr($description, 0, 200) . '...';
            }

            // Get location
            $location = $blotter->incident_location ?? 'N/A';

            // Get status
            $status = ucfirst($blotter->status ?? 'Open');

            // Get created by
            $createdBy = 'N/A';
            if ($blotter->creator) {
                $createdBy = $blotter->creator->name ?? 'N/A';
            }

            return [
                $blotter->case_number ?? 'N/A',
                $complainantName,
                $respondentName,
                $incidentTitle,
                $description,
                $purokName,
                $location,
                $status,
                $this->formatDate($blotter->created_at),
                $createdBy,
            ];
        } catch (\Exception $e) {
            // Fallback if anything goes wrong
            Log::error('BlotterExport map error: ' . $e->getMessage());
            return [
                $blotter->case_number ?? 'N/A',
                'N/A',
                'N/A',
                'N/A',
                'N/A',
                'N/A',
                $blotter->incident_location ?? 'N/A',
                ucfirst($blotter->status ?? 'Open'),
                $this->formatDate($blotter->created_at),
                'N/A',
            ];
        }
    }

    /**
     * Format date safely
     */
    protected function formatDate($date)
    {
        if (!$date) {
            return 'N/A';
        }

        try {
            if (is_string($date)) {
                return Carbon::parse($date)->format('Y-m-d');
            } elseif ($date instanceof \Carbon\Carbon || $date instanceof \DateTime) {
                return Carbon::instance($date)->format('Y-m-d');
            }
            return 'N/A';
        } catch (\Exception $e) {
            return 'N/A';
        }
    }

    /**
     * @param Worksheet $sheet
     * @return array
     */
    public function styles(Worksheet $sheet)
    {
        return [
            1 => ['font' => ['bold' => true], 'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'startColor' => ['rgb' => 'E0E0E0']]],
        ];
    }
}

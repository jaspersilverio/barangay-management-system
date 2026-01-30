<?php

namespace App\Exports;

use App\Models\Vaccination;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class VaccinationExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize
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
            return $this->query->with(['resident.household.purok'])->get();
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('VaccinationExport collection error: ' . $e->getMessage(), [
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
            'Resident Name',
            'Age',
            'Sex',
            'Purok',
            'Household',
            'Vaccination Type',
            'Vaccine Name',
            'Completed Doses',
            'Required Doses',
            'Schedule Date',
            'Date Administered',
            'Next Due Date',
            'Status',
            'Administered By',
        ];
    }

    /**
     * @param mixed $vaccination
     * @return array
     */
    public function map($vaccination): array
    {
        try {
            $resident = $vaccination->resident;

            // Build resident name safely
            $residentName = 'N/A';
            if ($resident) {
                if (isset($resident->full_name)) {
                    $residentName = $resident->full_name;
                } else {
                    $parts = array_filter([
                        $resident->first_name ?? '',
                        $resident->middle_name ?? '',
                        $resident->last_name ?? ''
                    ]);
                    $residentName = !empty($parts) ? implode(' ', $parts) : 'N/A';
                }
            }

            // Get age safely (use accessor if available)
            $age = 'N/A';
            if ($resident) {
                try {
                    // Use the age accessor (getAgeAttribute)
                    $residentAge = $resident->age;
                    $age = $residentAge !== null ? (string)$residentAge : 'N/A';
                } catch (\Exception $e) {
                    $age = 'N/A';
                }
            }

            // Get sex safely
            $sex = 'N/A';
            if ($resident && isset($resident->sex)) {
                $sex = ucfirst(strtolower($resident->sex));
            }

            // Get purok and household safely
            $purokName = 'N/A';
            $householdName = 'N/A';

            if ($resident && $resident->household) {
                $household = $resident->household;
                $householdName = $household->head_name ?? 'N/A';

                if ($household->purok) {
                    $purokName = $household->purok->name ?? 'N/A';
                }
            }

            return [
                $residentName,
                $age,
                $sex,
                $purokName,
                $householdName,
                ucfirst(str_replace('_', ' ', $vaccination->vaccination_type ?? 'N/A')),
                $vaccination->vaccine_name ?? 'N/A',
                (string) ($vaccination->completed_doses ?? 0),
                $vaccination->required_doses !== null ? (string) $vaccination->required_doses : 'N/A',
                $this->formatDate($vaccination->schedule_date),
                $this->formatDate($vaccination->date_administered),
                $this->formatDate($vaccination->next_due_date),
                ucfirst($vaccination->computed_status ?? $vaccination->status ?? 'N/A'),
                $vaccination->administered_by ?? 'N/A',
            ];
        } catch (\Exception $e) {
            // Fallback if anything goes wrong
            return [
                'N/A',
                'N/A',
                'N/A',
                'N/A',
                'N/A',
                'N/A',
                $vaccination->vaccine_name ?? 'N/A',
                'N/A',
                'N/A',
                'N/A',
                'N/A',
                'N/A',
                'N/A',
                $vaccination->administered_by ?? 'N/A',
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

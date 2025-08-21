<?php

namespace App\Http\Controllers;

use App\Models\Purok;
use App\Models\Resident;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function populationSummary(Request $request)
    {
        $perPurok = Resident::query()
            ->selectRaw('puroks.id as purok_id, puroks.name as purok_name, COUNT(residents.id) as total')
            ->leftJoin('households', 'households.id', '=', 'residents.household_id')
            ->leftJoin('puroks', 'puroks.id', '=', 'households.purok_id')
            ->groupBy('puroks.id', 'puroks.name')
            ->orderBy('puroks.name')
            ->get();

        $bySex = Resident::query()
            ->selectRaw('sex, COUNT(*) as total')
            ->groupBy('sex')
            ->get();

        $now = now();
        $ageBuckets = [
            'children' => Resident::whereDate('birthdate', '>', $now->copy()->subYears(18)->toDateString())->count(),
            'adults' => Resident::whereDate('birthdate', '<=', $now->copy()->subYears(18)->toDateString())
                ->whereDate('birthdate', '>', $now->copy()->subYears(60)->toDateString())->count(),
            'seniors' => Resident::whereDate('birthdate', '<=', $now->copy()->subYears(60)->toDateString())->count(),
        ];

        return $this->respondSuccess([
            'per_purok' => $perPurok,
            'by_sex' => $bySex,
            'by_age' => $ageBuckets,
        ]);
    }

    public function vulnerableGroups(Request $request)
    {
        $seniors = Resident::seniors()->count();
        $children = Resident::children()->count();
        $pwds = Resident::pwds()->count();
        $pregnant = 0; // Placeholder; no pregnancy field provided

        return $this->respondSuccess(compact('seniors', 'children', 'pwds', 'pregnant'));
    }

    public function export(Request $request)
    {
        $type = $request->string('type')->toString();
        $reportType = $request->string('reportType')->toString();

        // Placeholder implementation; hook in to export libs as needed
        if (!in_array($type, ['pdf', 'excel'])) {
            return $this->respondError('Unsupported export type', null, 422);
        }

        return $this->respondSuccess([
            'type' => $type,
            'reportType' => $reportType,
            'status' => 'queued',
        ], 'Export started');
    }
}

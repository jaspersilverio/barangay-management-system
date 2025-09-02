<?php

namespace App\Http\Controllers;

use App\Models\Household;
use App\Models\Resident;
use App\Models\MapMarker;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /**
     * Search for households and residents
     */
    public function searchHouseholdsAndResidents(Request $request)
    {
        $query = $request->string('query')->toString();
        $user = $request->user();

        if (empty($query) || strlen($query) < 2) {
            return $this->respondSuccess(['data' => []]);
        }

        $results = [];

        // Search households
        $householdsQuery = Household::with(['purok', 'mapMarker']);

        // Role-based filtering for purok leaders
        if ($user->isPurokLeader()) {
            $householdsQuery->where('purok_id', $user->assigned_purok_id);
        }

        $households = $householdsQuery->where('head_name', 'like', "%{$query}%")
            ->orWhere('address', 'like', "%{$query}%")
            ->limit(5)
            ->get();

        foreach ($households as $household) {
            $results[] = [
                'id' => $household->id,
                'type' => 'household',
                'name' => $household->head_name,
                'address' => $household->address,
                'purok_name' => $household->purok?->name,
                'x_position' => $household->mapMarker?->x_position,
                'y_position' => $household->mapMarker?->y_position,
            ];
        }

        // Search residents
        $residentsQuery = Resident::with(['household.purok', 'household.mapMarker']);

        // Role-based filtering for purok leaders
        if ($user->isPurokLeader()) {
            $residentsQuery->whereHas('household', function ($q) use ($user) {
                $q->where('purok_id', $user->assigned_purok_id);
            });
        }

        $residents = $residentsQuery->where(function ($q) use ($query) {
            $q->where('first_name', 'like', "%{$query}%")
                ->orWhere('middle_name', 'like', "%{$query}%")
                ->orWhere('last_name', 'like', "%{$query}%")
                ->orWhereRaw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?", ["%{$query}%"]);
        })
            ->limit(5)
            ->get();

        foreach ($residents as $resident) {
            $results[] = [
                'id' => $resident->id,
                'type' => 'resident',
                'name' => $resident->full_name,
                'full_name' => $resident->full_name,
                'age' => $resident->age,
                'sex' => $resident->sex,
                'address' => $resident->household?->address,
                'purok_name' => $resident->household?->purok?->name,
                'household_id' => $resident->household_id,
                'x_position' => $resident->household?->mapMarker?->x_position,
                'y_position' => $resident->household?->mapMarker?->y_position,
            ];
        }

        // Sort results by relevance (households first, then residents)
        usort($results, function ($a, $b) {
            if ($a['type'] === 'household' && $b['type'] === 'resident') {
                return -1;
            }
            if ($a['type'] === 'resident' && $b['type'] === 'household') {
                return 1;
            }
            return 0;
        });

        return $this->respondSuccess(['data' => array_slice($results, 0, 10)]);
    }
}

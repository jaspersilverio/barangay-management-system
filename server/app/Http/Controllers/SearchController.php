<?php

namespace App\Http\Controllers;

use App\Models\Household;
use App\Models\Resident;
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
            return $this->respondSuccess([]);
        }

        $like = "%{$query}%";
        $results = [];

        // Search households (head, address, head resident name, or any member name)
        $householdsQuery = Household::with(['purok', 'mapMarker']);

        if ($user->isPurokLeader()) {
            $householdsQuery->where('purok_id', $user->assigned_purok_id);
        }

        $households = $householdsQuery->where(function ($q) use ($like) {
            $q->where('head_name', 'like', $like)
                ->orWhere('address', 'like', $like)
                ->orWhereHas('headResident', function ($residentQuery) use ($like) {
                    $residentQuery->where('first_name', 'like', $like)
                        ->orWhere('middle_name', 'like', $like)
                        ->orWhere('last_name', 'like', $like);
                })
                ->orWhereHas('residents', function ($residentQuery) use ($like) {
                    $residentQuery->where('first_name', 'like', $like)
                        ->orWhere('middle_name', 'like', $like)
                        ->orWhere('last_name', 'like', $like);
                });
        })
            ->limit(8)
            ->get();

        $householdIdsFromHouseholdQuery = [];

        foreach ($households as $household) {
            $householdIdsFromHouseholdQuery[] = $household->id;
            $results[] = [
                'id' => $household->id,
                'type' => 'household',
                'household_id' => $household->id,
                'name' => $household->head_name,
                'address' => $household->address,
                'purok_name' => $household->purok?->name,
                'map_marker_id' => $household->mapMarker?->id,
                'x_position' => $household->mapMarker?->x_position,
                'y_position' => $household->mapMarker?->y_position,
            ];
        }

        // Search residents (for rows that show which person matched)
        $residentsQuery = Resident::with(['household.purok', 'household.mapMarker']);

        if ($user->isPurokLeader()) {
            $residentsQuery->whereHas('household', function ($q) use ($user) {
                $q->where('purok_id', $user->assigned_purok_id);
            });
        }

        $residents = $residentsQuery->where(function ($q) use ($like) {
            $q->where('first_name', 'like', $like)
                ->orWhere('middle_name', 'like', $like)
                ->orWhere('last_name', 'like', $like)
                ->orWhereRaw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?", [$like]);
        })
            ->limit(8)
            ->get();

        foreach ($residents as $resident) {
            // Same household already listed — skip (avoids duplicate names / pins in dropdown)
            if ($resident->household_id !== null
                && in_array($resident->household_id, $householdIdsFromHouseholdQuery, true)) {
                continue;
            }

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
                'map_marker_id' => $resident->household?->mapMarker?->id,
                'x_position' => $resident->household?->mapMarker?->x_position,
                'y_position' => $resident->household?->mapMarker?->y_position,
            ];
        }

        usort($results, function ($a, $b) {
            if ($a['type'] === 'household' && $b['type'] === 'resident') {
                return -1;
            }
            if ($a['type'] === 'resident' && $b['type'] === 'household') {
                return 1;
            }

            return 0;
        });

        return $this->respondSuccess(array_slice($results, 0, 12));
    }
}

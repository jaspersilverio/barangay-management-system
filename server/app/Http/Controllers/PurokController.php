<?php

namespace App\Http\Controllers;

use App\Http\Requests\Purok\StorePurokRequest;
use App\Http\Requests\Purok\UpdatePurokRequest;
use App\Models\Household;
use App\Models\Purok;
use Illuminate\Http\Request;

class PurokController extends Controller
{
    public function index(Request $request)
    {
        $query = Purok::query();
        $user = $request->user();

        // Role-based filtering
        if ($user && $user->role === 'purok_leader' && $user->assigned_purok_id) {
            // Purok leaders can only see their assigned purok
            $query->where('id', $user->assigned_purok_id);
        }
        // Admin, staff, and viewer users can see all puroks

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                    ->orWhere('captain', 'like', "%$search%")
                    ->orWhere('contact', 'like', "%$search%");
            });
        }

        $puroks = $query->orderBy('name')->paginate($request->integer('per_page', 15));
        return $this->respondSuccess($puroks);
    }

    public function store(StorePurokRequest $request)
    {
        $data = $request->validated();

        // Generate a unique code if not provided
        if (empty($data['code'])) {
            $counter = 1;
            do {
                $code = 'P' . $counter;
                $counter++;
            } while (Purok::where('code', $code)->exists());
            $data['code'] = $code;
        }

        $purok = Purok::create($data);
        return $this->respondSuccess($purok, 'Purok created', 201);
    }

    public function show(Purok $purok)
    {
        return $this->respondSuccess($purok);
    }

    public function update(UpdatePurokRequest $request, Purok $purok)
    {
        $purok->update($request->validated());
        return $this->respondSuccess($purok, 'Purok updated');
    }

    public function destroy(Purok $purok)
    {
        $hasHouseholds = Household::where('purok_id', $purok->id)->exists();
        if ($hasHouseholds) {
            return $this->respondError('Cannot delete Purok with existing households', null, 409);
        }
        $purok->delete();
        return $this->respondSuccess(null, 'Purok deleted');
    }

    /**
     * Get purok summary with household count and leader info
     */
    public function summary(string $id)
    {
        $purok = Purok::findOrFail($id);

        $householdCount = $purok->households()->count();

        return $this->respondSuccess([
            'id' => $purok->id,
            'name' => $purok->name,
            'captain' => $purok->captain,
            'contact' => $purok->contact,
            'household_count' => $householdCount,
            'description' => $purok->description
        ]);
    }
}

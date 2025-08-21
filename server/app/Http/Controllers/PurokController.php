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

        // Generate a simple code if not provided
        if (empty($data['code'])) {
            $data['code'] = 'P' . (Purok::count() + 1);
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
}

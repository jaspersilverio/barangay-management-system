<?php

namespace App\Http\Controllers;

use App\Http\Requests\Landmark\StoreLandmarkRequest;
use App\Http\Requests\Landmark\UpdateLandmarkRequest;
use App\Models\Landmark;
use Illuminate\Http\Request;

class LandmarkController extends Controller
{
    public function index(Request $request)
    {
        $query = Landmark::query();
        if ($purokId = $request->integer('purok_id')) {
            $query->where('purok_id', $purokId);
        }
        if ($type = $request->string('type')->toString()) {
            $query->where('type', $type);
        }
        if ($search = $request->string('search')->toString()) {
            $query->where('name', 'like', "%$search%");
        }
        $landmarks = $query->paginate($request->integer('per_page', 15));
        return $this->respondSuccess($landmarks);
    }

    public function store(StoreLandmarkRequest $request)
    {
        $landmark = Landmark::create($request->validated());
        return $this->respondSuccess($landmark, 'Landmark created', 201);
    }

    public function show(Landmark $landmark)
    {
        return $this->respondSuccess($landmark);
    }

    public function update(UpdateLandmarkRequest $request, Landmark $landmark)
    {
        $landmark->update($request->validated());
        return $this->respondSuccess($landmark, 'Landmark updated');
    }

    public function destroy(Landmark $landmark)
    {
        $landmark->delete();
        return $this->respondSuccess(null, 'Landmark deleted');
    }
}

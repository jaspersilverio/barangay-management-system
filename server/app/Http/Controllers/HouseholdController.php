<?php

namespace App\Http\Controllers;

use App\Http\Requests\Household\StoreHouseholdRequest;
use App\Http\Requests\Household\UpdateHouseholdRequest;
use App\Models\Household;
use App\Models\User;
use App\Models\Resident;
use Illuminate\Http\Request;

class HouseholdController extends Controller
{
    public function index(Request $request)
    {
        $query = Household::query();

        if ($search = $request->string('search')->toString()) {
            $query->search($search);
        }

        $households = $query->paginate($request->integer('per_page', 15));
        return $this->respondSuccess($households);
    }

    public function store(StoreHouseholdRequest $request)
    {
        $data = $request->validated();
        $household = Household::create($data);
        return $this->respondSuccess($household, 'Household created', 201);
    }

    public function show(Household $household)
    {
        $household->load(['residents']);
        return $this->respondSuccess($household);
    }

    public function update(UpdateHouseholdRequest $request, Household $household)
    {
        $household->update($request->validated());
        return $this->respondSuccess($household, 'Household updated');
    }

    public function destroy(Request $request, Household $household)
    {
        $force = $request->boolean('force');
        if ($force) {
            Resident::where('household_id', $household->id)->delete();
        }
        $household->delete();
        return $this->respondSuccess(null, 'Household deleted');
    }

    public function members(Household $household)
    {
        $residents = $household->residents()->paginate(50);
        return $this->respondSuccess($residents);
    }
}

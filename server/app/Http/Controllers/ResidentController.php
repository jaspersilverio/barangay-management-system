<?php

namespace App\Http\Controllers;

use App\Http\Requests\Resident\StoreResidentRequest;
use App\Http\Requests\Resident\UpdateResidentRequest;
use App\Models\Resident;
use Illuminate\Http\Request;

class ResidentController extends Controller
{
    public function index(Request $request)
    {
        $query = Resident::query();

        if ($gender = $request->string('gender')->toString()) {
            $query->where('sex', $gender);
        }
        if ($status = $request->string('status')->toString()) {
            $query->where('occupation_status', $status);
        }
        if ($minAge = $request->integer('min_age')) {
            $query->whereDate('birthdate', '<=', now()->subYears($minAge)->toDateString());
        }
        if ($maxAge = $request->integer('max_age')) {
            $query->whereDate('birthdate', '>', now()->subYears($maxAge)->toDateString());
        }
        if ($request->boolean('seniors')) {
            $query->seniors();
        }
        if ($request->boolean('children')) {
            $query->children();
        }
        if ($request->boolean('pwds')) {
            $query->pwds();
        }
        if ($search = $request->string('search')->toString()) {
            $query->search($search);
        }

        $residents = $query->paginate($request->integer('per_page', 15));
        return $this->respondSuccess($residents);
    }

    public function store(StoreResidentRequest $request)
    {
        $resident = Resident::create($request->validated());
        return $this->respondSuccess($resident, 'Resident created', 201);
    }

    public function show(Resident $resident)
    {
        return $this->respondSuccess($resident);
    }

    public function update(UpdateResidentRequest $request, Resident $resident)
    {
        $resident->update($request->validated());
        return $this->respondSuccess($resident, 'Resident updated');
    }

    public function destroy(Resident $resident)
    {
        $resident->delete();
        return $this->respondSuccess(null, 'Resident deleted');
    }
}

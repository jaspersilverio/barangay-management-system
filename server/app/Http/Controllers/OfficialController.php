<?php

namespace App\Http\Controllers;

use App\Http\Requests\Official\StoreOfficialRequest;
use App\Http\Requests\Official\UpdateOfficialRequest;
use App\Models\Official;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class OfficialController extends Controller
{
    /**
     * Display a listing of officials.
     */
    public function index(Request $request)
    {
        $query = Official::with('user');

        // Filter by active status if specified
        if ($request->has('active')) {
            $query->where('active', $request->boolean('active'));
        }

        // Filter by position if specified
        if ($request->filled('position')) {
            $query->where('position', 'like', '%' . $request->position . '%');
        }

        // Search by name if specified
        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $officials = $query->orderBy('position')->orderBy('name')->paginate(15);

        return $this->respondSuccess($officials);
    }

    /**
     * Store a newly created official.
     */
    public function store(StoreOfficialRequest $request)
    {
        $data = $request->validated();

        // Debug: Log the received data
        Log::info('Creating official with data:', $data);

        // Handle photo upload
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('officials', 'public');
            $data['photo_path'] = $photoPath;
        }

        $official = Official::create($data);

        return $this->respondSuccess($official->load('user'), 'Official created successfully', 201);
    }

    /**
     * Display the specified official.
     */
    public function show(Official $official)
    {
        return $this->respondSuccess($official->load('user'));
    }

    /**
     * Update the specified official.
     */
    public function update(UpdateOfficialRequest $request, Official $official)
    {
        $data = $request->validated();

        // Handle photo upload
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($official->photo_path) {
                Storage::disk('public')->delete($official->photo_path);
            }

            $photoPath = $request->file('photo')->store('officials', 'public');
            $data['photo_path'] = $photoPath;
        }

        $official->update($data);

        return $this->respondSuccess($official->load('user'), 'Official updated successfully');
    }

    /**
     * Remove the specified official.
     */
    public function destroy(Official $official)
    {
        // Delete photo if exists
        if ($official->photo_path) {
            Storage::disk('public')->delete($official->photo_path);
        }

        $official->delete();

        return $this->respondSuccess(null, 'Official deleted successfully');
    }

    /**
     * Get active officials for public display.
     */
    public function active()
    {
        $officials = Official::active()
            ->with('user')
            ->orderBy('position')
            ->orderBy('name')
            ->get();

        return $this->respondSuccess($officials);
    }

    /**
     * Toggle official active status.
     */
    public function toggleActive(Official $official)
    {
        $official->update(['active' => !$official->active]);

        return $this->respondSuccess($official->load('user'), 'Official status updated successfully');
    }
}

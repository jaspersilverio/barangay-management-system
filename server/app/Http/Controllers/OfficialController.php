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

        // Ensure photo_url is included in response
        $officials->getCollection()->transform(function ($official) {
            $official->photo_url = $official->photo_url;
            // Log for debugging
            if ($official->photo_path) {
                Log::debug('Official photo URL', [
                    'id' => $official->id,
                    'photo_path' => $official->photo_path,
                    'photo_url' => $official->photo_url,
                    'exists' => Storage::disk('public')->exists($official->photo_path),
                ]);
            }
            return $official;
        });

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

        // Handle photo upload with auto-generated filename
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            // Generate unique filename: timestamp_random.extension
            $extension = $file->getClientOriginalExtension();
            $filename = time() . '_' . uniqid() . '.' . $extension;
            $photoPath = $file->storeAs('officials', $filename, 'public');
            $data['photo_path'] = $photoPath;

            // Log for debugging
            Log::info('Photo uploaded', [
                'path' => $photoPath,
                'full_path' => Storage::disk('public')->path($photoPath),
                'exists' => Storage::disk('public')->exists($photoPath),
            ]);
        }

        $official = Official::create($data);
        $official->load('user');
        // Ensure photo_url is included
        $official->photo_url = $official->photo_url;

        // Log photo URL for debugging
        if ($official->photo_path) {
            Log::info('Official created with photo', [
                'photo_path' => $official->photo_path,
                'photo_url' => $official->photo_url,
            ]);
        }

        return $this->respondSuccess($official, 'Official created successfully', 201);
    }

    /**
     * Display the specified official.
     */
    public function show(Official $official)
    {
        $official->load('user');
        // Ensure photo_url is included
        $official->photo_url = $official->photo_url;
        return $this->respondSuccess($official);
    }

    /**
     * Update the specified official.
     */
    public function update(UpdateOfficialRequest $request, Official $official)
    {
        $data = $request->validated();

        // Handle photo upload with auto-generated filename
        if ($request->hasFile('photo')) {
            // Delete old photo if exists
            if ($official->photo_path) {
                try {
                    Storage::disk('public')->delete($official->photo_path);
                } catch (\Exception $e) {
                    Log::warning('Failed to delete old photo: ' . $e->getMessage());
                }
            }

            $file = $request->file('photo');
            // Generate unique filename: timestamp_random.extension
            $extension = $file->getClientOriginalExtension();
            $filename = time() . '_' . uniqid() . '.' . $extension;
            $photoPath = $file->storeAs('officials', $filename, 'public');
            $data['photo_path'] = $photoPath;
        }

        $official->update($data);
        $official->load('user');
        // Ensure photo_url is included
        $official->photo_url = $official->photo_url;

        // Log for debugging
        if ($request->hasFile('photo')) {
            Log::info('Official photo updated', [
                'official_id' => $official->id,
                'photo_path' => $official->photo_path,
                'photo_url' => $official->photo_url,
            ]);
        }

        return $this->respondSuccess($official, 'Official updated successfully');
    }

    /**
     * Remove the specified official.
     */
    public function destroy(Official $official)
    {
        // Delete photo if exists
        if ($official->photo_path) {
            try {
                Storage::disk('public')->delete($official->photo_path);
            } catch (\Exception $e) {
                Log::warning('Failed to delete photo during official deletion: ' . $e->getMessage());
            }
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

        // Ensure photo_url is included for all officials
        $officials->transform(function ($official) {
            $official->photo_url = $official->photo_url;
            return $official;
        });

        return $this->respondSuccess($officials);
    }

    /**
     * Toggle official active status.
     */
    public function toggleActive(Official $official)
    {
        $official->update(['active' => !$official->active]);
        $official->load('user');
        // Ensure photo_url is included
        $official->photo_url = $official->photo_url;

        return $this->respondSuccess($official, 'Official status updated successfully');
    }
}

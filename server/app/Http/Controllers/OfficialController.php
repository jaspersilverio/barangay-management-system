<?php

namespace App\Http\Controllers;

use App\Http\Requests\Official\StoreOfficialRequest;
use App\Http\Requests\Official\UpdateOfficialRequest;
use App\Models\Official;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;

class OfficialController extends Controller
{
    /**
     * Display a listing of officials.
     */
    public function index(Request $request)
    {
        $query = Official::with('user');

        // Filter by category if specified (default to 'official' if not specified for backward compatibility)
        if ($request->filled('category')) {
            $query->byCategory($request->category);
        } else {
            // Default to 'official' category for backward compatibility
            $query->byCategory('official');
        }

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

        // Ensure photo_url and term_period are included in response
        $officials->getCollection()->transform(function ($official) {
            $official->photo_url = $official->photo_url;
            $official->term_period = $official->term_period; // Ensure accessor is computed
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
        // Authorization: Only admin can create officials
        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            return $this->respondError('Unauthorized. Only administrators can create officials.', null, 403);
        }

        $data = $request->validated();

        // Appointed officials (tanod, bhw, staff): map payload to official record
        if (isset($data['official_type']) && $data['official_type'] === 'appointed') {
            $data = [
                'name' => $data['full_name'],
                'category' => $data['official_role'],
                'sex' => ucfirst(strtolower($data['gender'] ?? '')),
                'birthdate' => $data['birthdate'],
                'contact' => $data['contact_number'] ?? null,
                'address' => $data['address'] ?? null,
                'term_start' => $data['date_appointed'],
                'term_end' => null,
                'position' => null,
                'active' => ($data['status'] ?? 'active') === 'active',
            ];
        } else {
            // Ensure category is set (default to 'official' if not provided)
            if (!isset($data['category']) || empty($data['category'])) {
                $data['category'] = 'official';
            }
        }

        // For official and SK categories, compose name from first/middle/last/suffix if provided
        if (isset($data['first_name']) && isset($data['last_name']) && in_array($data['category'] ?? '', ['official', 'sk'])) {
            $nameParts = array_filter([
                $data['first_name'] ?? '',
                $data['middle_name'] ?? '',
                $data['last_name'] ?? '',
                $data['suffix'] ?? ''
            ]);
            if (!empty($nameParts)) {
                $data['name'] = implode(' ', $nameParts);
            }
        }

        // Validate SK age requirement (15-30 years old)
        if ($data['category'] === 'sk' && isset($data['birthdate'])) {
            $birthdate = \Carbon\Carbon::parse($data['birthdate']);
            $age = $birthdate->age;
            if ($age < 15 || $age > 30) {
                return $this->respondError('SK members must be between 15 and 30 years old. Current age: ' . $age, null, 422);
            }
        }

        // Validate unique SK Chairperson
        if (
            $data['category'] === 'sk' &&
            isset($data['position']) &&
            str_contains($data['position'], 'SK Chairperson') &&
            isset($data['active']) && $data['active']
        ) {
            $existingChairperson = Official::where('category', 'sk')
                ->where('position', 'like', '%SK Chairperson%')
                ->where('active', true)
                ->first();

            if ($existingChairperson) {
                return $this->respondError('Only one active SK Chairperson is allowed at a time. Please deactivate the current Chairperson first.', null, 422);
            }
        }

        // Validate unique Barangay Captain for official category
        if (
            $data['category'] === 'official' &&
            isset($data['position']) &&
            str_contains($data['position'], 'Barangay Captain') &&
            isset($data['active']) && $data['active']
        ) {

            $existingCaptain = Official::where('category', 'official')
                ->where('position', 'like', '%Barangay Captain%')
                ->where('active', true)
                ->first();

            if ($existingCaptain) {
                return $this->respondError('Only one active Barangay Captain is allowed at a time. Please deactivate the current Captain first.', null, 422);
            }
        }

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
        // Ensure photo_url and term_period are included
        $official->photo_url = $official->photo_url;
        $official->term_period = $official->term_period;

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
        // Ensure photo_url and term_period are included
        $official->photo_url = $official->photo_url;
        $official->term_period = $official->term_period;
        return $this->respondSuccess($official);
    }

    /**
     * Update the specified official.
     */
    public function update(UpdateOfficialRequest $request, Official $official)
    {
        // Authorization: Only admin can update officials
        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            return $this->respondError('Unauthorized. Only administrators can update officials.', null, 403);
        }

        $data = $request->validated();

        // Appointed officials (tanod, bhw, staff): ensure position stays null
        if (in_array($official->category, ['tanod', 'bhw', 'staff'])) {
            $data['position'] = null;
        }

        // For official and SK categories, compose name from first/middle/last/suffix if provided
        if (in_array($official->category, ['official', 'sk']) && isset($data['first_name']) && isset($data['last_name'])) {
            $nameParts = array_filter([
                $data['first_name'] ?? $official->first_name ?? '',
                $data['middle_name'] ?? $official->middle_name ?? '',
                $data['last_name'] ?? $official->last_name ?? '',
                $data['suffix'] ?? $official->suffix ?? ''
            ]);
            if (!empty($nameParts)) {
                $data['name'] = implode(' ', $nameParts);
            }
        }

        // Validate SK age requirement (15-30 years old)
        if ($official->category === 'sk' && isset($data['birthdate'])) {
            $birthdate = \Carbon\Carbon::parse($data['birthdate']);
            $age = $birthdate->age;
            if ($age < 15 || $age > 30) {
                return $this->respondError('SK members must be between 15 and 30 years old. Current age: ' . $age, null, 422);
            }
        }

        // Validate unique SK Chairperson (exclude current record)
        if (
            $official->category === 'sk' &&
            isset($data['position']) &&
            str_contains($data['position'], 'SK Chairperson') &&
            isset($data['active']) && $data['active']
        ) {
            $existingChairperson = Official::where('category', 'sk')
                ->where('position', 'like', '%SK Chairperson%')
                ->where('active', true)
                ->where('id', '!=', $official->id)
                ->first();

            if ($existingChairperson) {
                return $this->respondError('Only one active SK Chairperson is allowed at a time. Please deactivate the current Chairperson first.', null, 422);
            }
        }

        // Validate unique Barangay Captain for official category (exclude current record)
        if (
            $official->category === 'official' &&
            isset($data['position']) &&
            str_contains($data['position'], 'Barangay Captain') &&
            isset($data['active']) && $data['active']
        ) {

            $existingCaptain = Official::where('category', 'official')
                ->where('position', 'like', '%Barangay Captain%')
                ->where('active', true)
                ->where('id', '!=', $official->id)
                ->first();

            if ($existingCaptain) {
                return $this->respondError('Only one active Barangay Captain is allowed at a time. Please deactivate the current Captain first.', null, 422);
            }
        }

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
        // Ensure photo_url and term_period are included
        $official->photo_url = $official->photo_url;
        $official->term_period = $official->term_period;

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
        // Authorization: Only admin can delete officials
        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            return $this->respondError('Unauthorized. Only administrators can delete officials.', null, 403);
        }

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

        // Ensure photo_url and term_period are included for all officials
        $officials->transform(function ($official) {
            $official->photo_url = $official->photo_url;
            $official->term_period = $official->term_period;
            return $official;
        });

        return $this->respondSuccess($officials);
    }

    /**
     * Toggle official active status.
     */
    public function toggleActive(Official $official)
    {
        // Authorization: Only admin can toggle official status
        $user = Auth::user();
        if (!$user || $user->role !== 'admin') {
            return $this->respondError('Unauthorized. Only administrators can change official status.', null, 403);
        }

        $official->update(['active' => !$official->active]);
        $official->load('user');
        // Ensure photo_url and term_period are included
        $official->photo_url = $official->photo_url;
        $official->term_period = $official->term_period;

        return $this->respondSuccess($official, 'Official status updated successfully');
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SettingsController extends Controller
{
    /**
     * Get all settings
     */
    public function index(): JsonResponse
    {
        try {
            $settings = Setting::all()->keyBy('key');

            // Get active officials for dropdowns
            $officials = \App\Models\Official::where('category', 'official')
                ->where('active', true)
                ->orderBy('position')
                ->orderBy('name')
                ->get(['id', 'name', 'position']);

            $formattedSettings = [
                'barangay_info' => $settings->get('barangay_info')?->value ?? [],
                'system_preferences' => $settings->get('system_preferences')?->value ?? [],
                'emergency' => $settings->get('emergency')?->value ?? [],
                'officials_options' => $officials, // Provide officials for dropdown
            ];

            return $this->respondSuccess($formattedSettings);
        } catch (\Exception $e) {
            return $this->respondError('Failed to fetch settings: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Update system preferences
     */
    public function updatePreferences(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'theme' => 'required|in:light,dark',
                'per_page' => 'required|integer|min:5|max:100',
                'date_format' => 'required|string|max:20',
            ]);

            DB::beginTransaction();

            Setting::updateOrCreate(
                ['key' => 'system_preferences'],
                ['value' => $request->only(['theme', 'per_page', 'date_format'])]
            );

            DB::commit();

            return $this->respondSuccess(
                Setting::where('key', 'system_preferences')->first()->value,
                'System preferences updated successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->respondError('Failed to update system preferences: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Update emergency settings
     */
    public function updateEmergency(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'contact_numbers' => 'required|array',
                'contact_numbers.*.name' => 'required|string|max:100',
                'contact_numbers.*.number' => 'required|string|max:20',
                'evacuation_centers' => 'required|array',
                'evacuation_centers.*.name' => 'required|string|max:255',
                'evacuation_centers.*.address' => 'required|string|max:500',
                'evacuation_centers.*.capacity' => 'required|integer|min:1',
            ]);

            DB::beginTransaction();

            Setting::updateOrCreate(
                ['key' => 'emergency'],
                ['value' => $request->only(['contact_numbers', 'evacuation_centers'])]
            );

            DB::commit();

            return $this->respondSuccess(
                Setting::where('key', 'emergency')->first()->value,
                'Emergency settings updated successfully'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->respondError('Failed to update emergency settings: ' . $e->getMessage(), null, 500);
        }
    }
}

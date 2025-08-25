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

            $formattedSettings = [
                'barangay_info' => $settings->get('barangay_info')?->value ?? [],
                'system_preferences' => $settings->get('system_preferences')?->value ?? [],
                'emergency' => $settings->get('emergency')?->value ?? [],
            ];

            return response()->json([
                'success' => true,
                'data' => $formattedSettings,
                'message' => null,
                'errors' => null,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to fetch settings: ' . $e->getMessage(),
                'errors' => null,
            ], 500);
        }
    }

    /**
     * Update barangay information
     */
    public function updateBarangayInfo(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'name' => 'required|string|max:255',
                'address' => 'required|string|max:500',
                'contact' => 'required|string|max:50',
                'logo_path' => 'nullable|string',
            ]);

            DB::beginTransaction();

            Setting::updateOrCreate(
                ['key' => 'barangay_info'],
                ['value' => $request->only(['name', 'address', 'contact', 'logo_path'])]
            );

            DB::commit();

            return response()->json([
                'success' => true,
                'data' => Setting::where('key', 'barangay_info')->first()->value,
                'message' => 'Barangay information updated successfully',
                'errors' => null,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to update barangay information: ' . $e->getMessage(),
                'errors' => null,
            ], 500);
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

            return response()->json([
                'success' => true,
                'data' => Setting::where('key', 'system_preferences')->first()->value,
                'message' => 'System preferences updated successfully',
                'errors' => null,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to update system preferences: ' . $e->getMessage(),
                'errors' => null,
            ], 500);
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

            return response()->json([
                'success' => true,
                'data' => Setting::where('key', 'emergency')->first()->value,
                'message' => 'Emergency settings updated successfully',
                'errors' => null,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Failed to update emergency settings: ' . $e->getMessage(),
                'errors' => null,
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\BarangayInfo;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class BarangayInfoController extends Controller
{
    /**
     * Get barangay information (singleton - id = 1)
     */
    public function show(): JsonResponse
    {
        try {
            $barangayInfo = BarangayInfo::find(1);

            return $this->respondSuccess($barangayInfo);
        } catch (\Exception $e) {
            return $this->respondError('Failed to fetch barangay information: ' . $e->getMessage(), null, 500);
        }
    }

    /**
     * Store or update barangay information (singleton - id = 1)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $request->validate([
                'barangay_name' => 'nullable|string|max:255',
                'municipality' => 'nullable|string|max:255',
                'province' => 'nullable|string|max:255',
                'region' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:500',
                'contact_number' => 'nullable|string|max:50',
                'email' => 'nullable|email|max:255',
                'captain_name' => 'nullable|string|max:255',
                'logo' => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
                'captain_signature' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            ]);

            DB::beginTransaction();

            // Get or create singleton instance (id = 1)
            $barangayInfo = BarangayInfo::firstOrCreate(['id' => 1]);

            // Handle logo upload
            if ($request->hasFile('logo')) {
                if ($barangayInfo->logo_path) {
                    Storage::disk('public')->delete($barangayInfo->logo_path);
                }
                $file = $request->file('logo');
                $extension = $file->getClientOriginalExtension();
                $filename = 'barangay_logo_' . time() . '_' . uniqid() . '.' . $extension;
                $logoPath = $file->storeAs('barangay', $filename, 'public');
                $barangayInfo->logo_path = $logoPath;
            }

            // Handle captain signature upload
            if ($request->hasFile('captain_signature')) {
                if ($barangayInfo->captain_signature_path) {
                    Storage::disk('public')->delete($barangayInfo->captain_signature_path);
                }
                $file = $request->file('captain_signature');
                $extension = $file->getClientOriginalExtension();
                $filename = 'captain_signature_' . time() . '_' . uniqid() . '.' . $extension;
                $signaturePath = $file->storeAs('barangay', $filename, 'public');
                $barangayInfo->captain_signature_path = $signaturePath;
            }

            // Update fields
            $barangayInfo->barangay_name = $request->input('barangay_name', '');
            $barangayInfo->municipality = $request->input('municipality', '');
            $barangayInfo->province = $request->input('province', '');
            $barangayInfo->region = $request->input('region', '');
            $barangayInfo->address = $request->input('address', '');
            $barangayInfo->contact_number = $request->input('contact_number', '');
            $barangayInfo->email = $request->input('email', '');
            $barangayInfo->captain_name = $request->input('captain_name', '');

            $barangayInfo->save();

            DB::commit();

            return $this->respondSuccess($barangayInfo->fresh(), 'Barangay information saved successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            return $this->respondError('Failed to save barangay information: ' . $e->getMessage(), null, 500);
        }
    }
}

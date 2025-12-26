<?php

namespace App\Http\Controllers;

use App\Http\Requests\FourPs\StoreFourPsRequest;
use App\Http\Requests\FourPs\UpdateFourPsRequest;
use App\Models\FourPsBeneficiary;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class FourPsBeneficiaryController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = FourPsBeneficiary::with(['household.purok', 'creator']);
            $user = $request->user();

            // Role-based filtering
            if ($user->isPurokLeader() && $user->assigned_purok_id) {
                // Purok leaders can only see 4Ps beneficiaries from their assigned purok
                $query->byPurok($user->assigned_purok_id);
            }

            // Search
            if ($search = $request->string('search')->toString()) {
                $query->search($search);
            }

            // Status filter
            if ($status = $request->string('status')->toString()) {
                $query->byStatus($status);
            }

            // Purok filter (admin only)
            if ($user->role === 'admin' && $purokId = $request->integer('purok_id')) {
                $query->byPurok($purokId);
            }

            $beneficiaries = $query->orderBy('date_registered', 'desc')
                ->paginate($request->integer('per_page', 15));

            // Transform the response
            $beneficiaries->getCollection()->transform(function ($beneficiary) {
                return [
                    'id' => $beneficiary->id,
                    'household_id' => $beneficiary->household_id,
                    'four_ps_number' => $beneficiary->four_ps_number,
                    'status' => $beneficiary->status,
                    'date_registered' => $beneficiary->date_registered ? $beneficiary->date_registered->format('Y-m-d') : null,
                    'created_at' => $beneficiary->created_at ? $beneficiary->created_at->format('Y-m-d H:i:s') : null,
                    'household' => $beneficiary->household ? [
                        'id' => $beneficiary->household->id,
                        'head_name' => $beneficiary->household->head_name ?? 'N/A',
                        'address' => $beneficiary->household->address ?? 'N/A',
                        'contact' => $beneficiary->household->contact ?? 'N/A',
                        'purok' => $beneficiary->household->purok ? [
                            'id' => $beneficiary->household->purok->id,
                            'name' => $beneficiary->household->purok->name,
                        ] : null,
                    ] : null,
                ];
            });

            return $this->respondSuccess($beneficiaries);
        } catch (\Exception $e) {
            Log::error('Error loading 4Ps beneficiaries: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            return $this->respondError('Failed to load 4Ps beneficiaries: ' . $e->getMessage(), null, 500);
        }
    }

    public function store(StoreFourPsRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        DB::beginTransaction();
        try {
            $data['created_by'] = $user->id;
            $beneficiary = FourPsBeneficiary::create($data);

            // Log audit trail
            $this->logFourPsCreation($beneficiary, $user, $request->ip());

            DB::commit();

            // Load relationships for response
            $beneficiary->load(['household.purok', 'creator']);

            return $this->respondSuccess($beneficiary, '4Ps beneficiary registered successfully', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::error('4Ps registration validation failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'data' => $data,
                'errors' => $e->errors()
            ]);
            return $this->respondError('Validation failed', $e->errors(), 422);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            if ($e->getCode() == 23000) {
                return $this->respondError('This household is already registered as a 4Ps beneficiary.', null, 422);
            }
            Log::error('4Ps registration failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'data' => $data,
                'exception' => $e
            ]);
            return $this->respondError('Failed to register 4Ps beneficiary. Please try again.', null, 500);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Unexpected error during 4Ps registration: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'data' => $data,
                'exception' => $e
            ]);
            return $this->respondError('An unexpected error occurred. Please try again.', null, 500);
        }
    }

    public function show(FourPsBeneficiary $fourPs)
    {
        $fourPs->load(['household.purok', 'creator']);
        return $this->respondSuccess($fourPs);
    }

    public function update(UpdateFourPsRequest $request, FourPsBeneficiary $fourPs)
    {
        $user = $request->user();
        $data = $request->validated();

        // Role-based access control
        if ($user->isPurokLeader() && $fourPs->household->purok_id !== $user->assigned_purok_id) {
            return $this->respondError('You can only edit 4Ps beneficiaries in your assigned purok', null, 403);
        }

        DB::beginTransaction();
        try {
            $oldData = $fourPs->toArray();
            $fourPs->update($data);

            // Log audit trail
            $this->logFourPsUpdate($fourPs, $oldData, $user, $request->ip());

            DB::commit();

            $fourPs->load(['household.purok', 'creator']);
            return $this->respondSuccess($fourPs, '4Ps beneficiary updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('4Ps update failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'four_ps_id' => $fourPs->id,
                'exception' => $e
            ]);
            return $this->respondError('Failed to update 4Ps beneficiary. Please try again.', null, 500);
        }
    }

    public function destroy(Request $request, FourPsBeneficiary $fourPs)
    {
        $user = $request->user();

        // Role-based access control
        if ($user->isPurokLeader() && $fourPs->household->purok_id !== $user->assigned_purok_id) {
            return $this->respondError('You can only delete 4Ps beneficiaries in your assigned purok', null, 403);
        }

        try {
            $fourPs->delete();
            $this->logFourPsDeletion($fourPs, $user, $request->ip());
            return $this->respondSuccess(null, '4Ps beneficiary deleted successfully');
        } catch (\Exception $e) {
            Log::error('4Ps deletion failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'four_ps_id' => $fourPs->id,
                'exception' => $e
            ]);
            return $this->respondError('Failed to delete 4Ps beneficiary. Please try again.', null, 500);
        }
    }

    private function logFourPsCreation($beneficiary, $user, $ipAddress)
    {
        try {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'Created 4Ps Beneficiary',
                'model_type' => 'App\Models\FourPsBeneficiary',
                'model_id' => $beneficiary->id,
                'changes' => [
                    'four_ps_details' => [
                        'four_ps_number' => $beneficiary->four_ps_number,
                        'household_id' => $beneficiary->household_id,
                        'status' => $beneficiary->status,
                        'date_registered' => $beneficiary->date_registered->format('Y-m-d'),
                    ],
                    'household_info' => [
                        'head_name' => $beneficiary->household?->head_name,
                        'address' => $beneficiary->household?->address,
                        'purok_id' => $beneficiary->household?->purok_id,
                    ]
                ],
                'ip_address' => $ipAddress,
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to create audit log for 4Ps creation: ' . $e->getMessage(), [
                'four_ps_id' => $beneficiary->id,
                'user_id' => $user->id,
                'exception' => $e
            ]);
        }
    }

    private function logFourPsUpdate($beneficiary, $oldData, $user, $ipAddress)
    {
        try {
            $changes = [];
            foreach ($beneficiary->getDirty() as $key => $value) {
                $changes[$key] = [
                    'old' => $oldData[$key] ?? null,
                    'new' => $value,
                ];
            }

            if (!empty($changes)) {
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'Updated 4Ps Beneficiary',
                    'model_type' => 'App\Models\FourPsBeneficiary',
                    'model_id' => $beneficiary->id,
                    'changes' => $changes,
                    'ip_address' => $ipAddress,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to create audit log for 4Ps update: ' . $e->getMessage(), [
                'four_ps_id' => $beneficiary->id,
                'user_id' => $user->id,
                'exception' => $e
            ]);
        }
    }

    private function logFourPsDeletion($beneficiary, $user, $ipAddress)
    {
        try {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'Deleted 4Ps Beneficiary',
                'model_type' => 'App\Models\FourPsBeneficiary',
                'model_id' => $beneficiary->id,
                'changes' => [
                    'four_ps_number' => $beneficiary->four_ps_number,
                    'household_id' => $beneficiary->household_id,
                ],
                'ip_address' => $ipAddress,
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to create audit log for 4Ps deletion: ' . $e->getMessage(), [
                'four_ps_id' => $beneficiary->id,
                'user_id' => $user->id,
                'exception' => $e
            ]);
        }
    }
}


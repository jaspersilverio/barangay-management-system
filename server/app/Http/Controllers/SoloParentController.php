<?php

namespace App\Http\Controllers;

use App\Http\Requests\SoloParent\StoreSoloParentRequest;
use App\Http\Requests\SoloParent\UpdateSoloParentRequest;
use App\Models\SoloParent;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class SoloParentController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = SoloParent::with(['resident.household.purok', 'creator', 'verifier']);
            $user = $request->user();

            // Role-based filtering
            if ($user->isPurokLeader() && $user->assigned_purok_id) {
                $query->byPurok($user->assigned_purok_id);
            }

            // Search
            if ($search = $request->string('search')->toString()) {
                $query->search($search);
            }

            // Status filter (computed status)
            if ($status = $request->string('status')->toString()) {
                $query->byComputedStatus($status);
            }

            // Purok filter (admin only)
            if ($user->role === 'admin' && $purokId = $request->integer('purok_id')) {
                $query->byPurok($purokId);
            }

            $soloParents = $query->orderBy('date_declared', 'desc')
                ->paginate($request->integer('per_page', 15));

            // Transform the response with computed status
            $soloParents->getCollection()->transform(function ($soloParent) {
                try {
                    $dependentChildren = $soloParent->getDependentChildren();
                    $computedStatus = $soloParent->computed_status;
                    $hasDependentChildren = $soloParent->hasEligibleDependentChildren();
                } catch (\Exception $e) {
                    Log::warning('Error computing solo parent status: ' . $e->getMessage(), [
                        'solo_parent_id' => $soloParent->id,
                        'exception' => $e
                    ]);
                    $dependentChildren = collect([]);
                    $computedStatus = 'inactive';
                    $hasDependentChildren = false;
                }

                return [
                    'id' => $soloParent->id,
                    'resident_id' => $soloParent->resident_id,
                    'eligibility_reason' => $soloParent->eligibility_reason,
                    'eligibility_reason_label' => $soloParent->eligibility_reason_label ?? ucfirst(str_replace('_', ' ', $soloParent->eligibility_reason)),
                    'date_declared' => $soloParent->date_declared ? $soloParent->date_declared->format('Y-m-d') : null,
                    'valid_until' => $soloParent->valid_until ? $soloParent->valid_until->format('Y-m-d') : null,
                    'verification_date' => $soloParent->verification_date ? $soloParent->verification_date->format('Y-m-d') : null,
                    'computed_status' => $computedStatus,
                    'has_dependent_children' => $hasDependentChildren,
                    'dependent_children_count' => $dependentChildren->count(),
                    'dependent_children' => $dependentChildren->map(function ($child) {
                        return [
                            'id' => $child->id,
                            'name' => trim("{$child->first_name} {$child->middle_name} {$child->last_name}"),
                            'age' => $child->age ?? null,
                            'relationship' => $child->relationship_to_head,
                        ];
                    }),
                    'created_at' => $soloParent->created_at ? $soloParent->created_at->format('Y-m-d H:i:s') : null,
                    'resident' => $soloParent->resident ? [
                        'id' => $soloParent->resident->id,
                        'first_name' => $soloParent->resident->first_name,
                        'middle_name' => $soloParent->resident->middle_name,
                        'last_name' => $soloParent->resident->last_name,
                        'full_name' => trim("{$soloParent->resident->first_name} {$soloParent->resident->middle_name} {$soloParent->resident->last_name}"),
                        'sex' => $soloParent->resident->sex,
                        'birthdate' => $soloParent->resident->birthdate ? $soloParent->resident->birthdate->format('Y-m-d') : null,
                        'age' => $soloParent->resident->age,
                        'civil_status' => $soloParent->resident->civil_status,
                        'household' => $soloParent->resident->household ? [
                            'id' => $soloParent->resident->household->id,
                            'head_name' => $soloParent->resident->household->head_name ?? 'N/A',
                            'address' => $soloParent->resident->household->address ?? 'N/A',
                            'contact' => $soloParent->resident->household->contact ?? 'N/A',
                            'purok' => $soloParent->resident->household->purok ? [
                                'id' => $soloParent->resident->household->purok->id,
                                'name' => $soloParent->resident->household->purok->name,
                            ] : null,
                        ] : null,
                    ] : null,
                ];
            });

            return $this->respondSuccess($soloParents);
        } catch (\Exception $e) {
            Log::error('Error loading solo parents: ' . $e->getMessage(), [
                'user_id' => $request->user()?->id,
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            return $this->respondError('Failed to load solo parents: ' . $e->getMessage(), null, 500);
        }
    }

    public function store(StoreSoloParentRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        DB::beginTransaction();
        try {
            $data['created_by'] = $user->id;
            $soloParent = SoloParent::create($data);

            // Log audit trail
            $this->logSoloParentCreation($soloParent, $user, $request->ip());

            DB::commit();

            // Load relationships for response
            $soloParent->load(['resident.household.purok', 'creator', 'verifier']);

            return $this->respondSuccess($soloParent, 'Solo parent registered successfully', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            Log::error('Solo parent registration validation failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'data' => $data,
                'errors' => $e->errors()
            ]);
            return $this->respondError('Validation failed', $e->errors(), 422);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            if ($e->getCode() == 23000) {
                return $this->respondError('This resident is already registered as a solo parent.', null, 422);
            }
            Log::error('Solo parent registration failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'data' => $data,
                'exception' => $e
            ]);
            return $this->respondError('Failed to register solo parent. Please try again.', null, 500);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Unexpected error during solo parent registration: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'data' => $data,
                'exception' => $e
            ]);
            return $this->respondError('An unexpected error occurred. Please try again.', null, 500);
        }
    }

    public function show(SoloParent $soloParent)
    {
        $soloParent->load(['resident.household.purok', 'creator', 'verifier']);
        $dependentChildren = $soloParent->getDependentChildren();

        $data = [
            'id' => $soloParent->id,
            'resident_id' => $soloParent->resident_id,
            'eligibility_reason' => $soloParent->eligibility_reason,
            'eligibility_reason_label' => $soloParent->eligibility_reason_label,
            'date_declared' => $soloParent->date_declared ? $soloParent->date_declared->format('Y-m-d') : null,
            'valid_until' => $soloParent->valid_until ? $soloParent->valid_until->format('Y-m-d') : null,
            'verification_date' => $soloParent->verification_date ? $soloParent->verification_date->format('Y-m-d') : null,
            'computed_status' => $soloParent->computed_status,
            'has_dependent_children' => $soloParent->hasEligibleDependentChildren(),
            'dependent_children_count' => $dependentChildren->count(),
            'dependent_children' => $dependentChildren->map(function ($child) {
                return [
                    'id' => $child->id,
                    'name' => trim("{$child->first_name} {$child->middle_name} {$child->last_name}"),
                    'age' => $child->age,
                    'relationship' => $child->relationship_to_head,
                ];
            }),
            'resident' => $soloParent->resident,
        ];

        return $this->respondSuccess($data);
    }

    public function update(UpdateSoloParentRequest $request, SoloParent $soloParent)
    {
        $user = $request->user();
        $data = $request->validated();

        // Role-based access control
        if ($user->isPurokLeader() && $soloParent->resident->household->purok_id !== $user->assigned_purok_id) {
            return $this->respondError('You can only edit solo parents in your assigned purok', null, 403);
        }

        DB::beginTransaction();
        try {
            $oldData = $soloParent->toArray();
            $soloParent->update($data);

            // Log audit trail
            $this->logSoloParentUpdate($soloParent, $oldData, $user, $request->ip());

            DB::commit();

            $soloParent->load(['resident.household.purok', 'creator', 'verifier']);
            return $this->respondSuccess($soloParent, 'Solo parent updated successfully');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Solo parent update failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'solo_parent_id' => $soloParent->id,
                'exception' => $e
            ]);
            return $this->respondError('Failed to update solo parent. Please try again.', null, 500);
        }
    }

    public function destroy(Request $request, SoloParent $soloParent)
    {
        $user = $request->user();

        // Role-based access control
        if ($user->isPurokLeader() && $soloParent->resident->household->purok_id !== $user->assigned_purok_id) {
            return $this->respondError('You can only delete solo parents in your assigned purok', null, 403);
        }

        try {
            $soloParent->delete();
            $this->logSoloParentDeletion($soloParent, $user, $request->ip());
            return $this->respondSuccess(null, 'Solo parent deleted successfully');
        } catch (\Exception $e) {
            Log::error('Solo parent deletion failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'solo_parent_id' => $soloParent->id,
                'exception' => $e
            ]);
            return $this->respondError('Failed to delete solo parent. Please try again.', null, 500);
        }
    }

    private function logSoloParentCreation($soloParent, $user, $ipAddress)
    {
        try {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'Created Solo Parent',
                'model_type' => 'App\Models\SoloParent',
                'model_id' => $soloParent->id,
                'changes' => [
                    'solo_parent_details' => [
                        'resident_id' => $soloParent->resident_id,
                        'eligibility_reason' => $soloParent->eligibility_reason,
                        'date_declared' => $soloParent->date_declared->format('Y-m-d'),
                        'valid_until' => $soloParent->valid_until->format('Y-m-d'),
                    ],
                ],
                'ip_address' => $ipAddress,
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to create audit log for solo parent creation: ' . $e->getMessage());
        }
    }

    private function logSoloParentUpdate($soloParent, $oldData, $user, $ipAddress)
    {
        try {
            $changes = [];
            foreach ($soloParent->getDirty() as $key => $value) {
                $changes[$key] = [
                    'old' => $oldData[$key] ?? null,
                    'new' => $value,
                ];
            }

            if (!empty($changes)) {
                AuditLog::create([
                    'user_id' => $user->id,
                    'action' => 'Updated Solo Parent',
                    'model_type' => 'App\Models\SoloParent',
                    'model_id' => $soloParent->id,
                    'changes' => $changes,
                    'ip_address' => $ipAddress,
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to create audit log for solo parent update: ' . $e->getMessage());
        }
    }

    private function logSoloParentDeletion($soloParent, $user, $ipAddress)
    {
        try {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'Deleted Solo Parent',
                'model_type' => 'App\Models\SoloParent',
                'model_id' => $soloParent->id,
                'changes' => [
                    'resident_id' => $soloParent->resident_id,
                    'eligibility_reason' => $soloParent->eligibility_reason,
                ],
                'ip_address' => $ipAddress,
            ]);
        } catch (\Exception $e) {
            Log::warning('Failed to create audit log for solo parent deletion: ' . $e->getMessage());
        }
    }

    public function generateCertificate(Request $request, SoloParent $soloParent)
    {
        $user = $request->user();

        // Check authorization
        if (!$user || ($user->role !== 'admin' && $user->role !== 'staff')) {
            return $this->respondError('Unauthorized to generate certificates.', null, 403);
        }

        // Check if solo parent is active
        if ($soloParent->computed_status !== 'active') {
            return $this->respondError('Only active solo parents can generate certificates.', null, 400);
        }

        try {
            // Load relationships
            $soloParent->load(['resident.household.purok', 'verifier']);
            $dependentChildren = $soloParent->getDependentChildren();

            // Prepare data for PDF generation
            $data = [
                'title' => 'Solo Parent Certificate',
                'document_title' => 'SOLO PARENT CERTIFICATE',
                'solo_parent' => $soloParent,
                'resident' => $soloParent->resident,
                'dependent_children' => $dependentChildren,
                'date_declared_formatted' => $soloParent->date_declared->format('F d, Y'),
                'valid_until_formatted' => $soloParent->valid_until->format('F d, Y'),
                'current_date' => Carbon::now()->format('F d, Y'), // For backward compatibility with view
            ];

            // Generate PDF using centralized service
            $pdfService = app(\App\Services\PdfService::class);
            $filename = 'solo-parent-certificate-' . $soloParent->id . '-' . Carbon::now()->format('Y-m-d') . '.pdf';

            return $pdfService->download('pdf.solo-parent', $data, $filename);
        } catch (\Exception $e) {
            Log::error('Solo parent certificate generation failed: ' . $e->getMessage(), [
                'solo_parent_id' => $soloParent->id,
                'user_id' => $user->id,
                'exception' => $e
            ]);
            return $this->respondError('Failed to generate certificate. Please try again.', null, 500);
        }
    }
}

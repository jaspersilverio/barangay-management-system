<?php

namespace App\Http\Controllers;

use App\Http\Controllers\NotificationController;
use App\Http\Requests\Resident\StoreResidentRequest;
use App\Http\Requests\Resident\UpdateResidentRequest;
use App\Models\Resident;
use App\Models\User;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ResidentController extends Controller
{
    public function index(Request $request)
    {
        // Include all residents - those with households and those without (unassigned)
        // Eager load household relationships for better performance
        // Also load households where residents are heads (for heads without household_id set)
        $query = Resident::with(['household.purok', 'household.headResident', 'purok', 'soloParent']);
        $user = $request->user();
        
        // Preload households where residents are heads to ensure we have all household data
        // This is important for newly created heads whose household_id might not be set yet
        
        // Also preload households where residents are heads (for heads without household_id set)
        // This ensures we have all household data available

        // Role-based filtering for purok leaders
        if ($user->isPurokLeader()) {
            $query->where(function ($q) use ($user) {
                // Residents in households from assigned purok
                $q->whereHas('household', function ($householdQuery) use ($user) {
                    $householdQuery->where('purok_id', $user->assigned_purok_id);
                })
                // OR residents who are heads of households in assigned purok (using direct query)
                ->orWhereIn('id', function ($subQuery) use ($user) {
                    $subQuery->select('head_resident_id')
                        ->from('households')
                        ->where('purok_id', $user->assigned_purok_id)
                        ->whereNotNull('head_resident_id');
                })
                // OR unassigned residents (no household) - purok leaders can see all unassigned
                ->orWhereNull('household_id');
            });
        }

        // Filter by purok_id (for admin)
        if ($purokId = $request->string('purok_id')->toString()) {
            $query->where(function ($q) use ($purokId) {
                $q->whereHas('household', function ($householdQuery) use ($purokId) {
                    $householdQuery->where('purok_id', $purokId);
                })
                ->orWhereIn('id', function ($subQuery) use ($purokId) {
                    $subQuery->select('head_resident_id')
                        ->from('households')
                        ->where('purok_id', $purokId)
                        ->whereNotNull('head_resident_id');
                })
                ->orWhere('purok_id', $purokId); // Unassigned residents with direct purok_id
            });
        }

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

        // Filter by household_id - residents in a specific household
        if ($householdId = $request->integer('household_id')) {
            $query->where('household_id', $householdId);
        }

        // Sort alphabetically by last name, then first name (LGU standard)
        $query->orderBy('last_name', 'asc')
              ->orderBy('first_name', 'asc');

        try {
            $residents = $query->paginate($request->integer('per_page', 15));
        } catch (\Exception $e) {
            \Log::error('Error paginating residents: ' . $e->getMessage(), [
                'user_id' => $user->id ?? null,
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            return $this->respondError('Failed to load residents: ' . $e->getMessage(), null, 500);
        }

        // Transform the response to include properly formatted data
        $residents->getCollection()->transform(function ($resident) {
            try {
                // Safely check if resident is head of household using direct query
                // This is the authoritative source - check households table
                $isHeadOfHousehold = false;
                $headHousehold = null;
                if ($resident->id) {
                    try {
                        // Check if this resident is a head of any household
                        // Use a more efficient query with caching
                        $headHousehold = \App\Models\Household::with('purok')
                            ->where('head_resident_id', $resident->id)
                            ->first();
                        $isHeadOfHousehold = $headHousehold !== null;
                        
                        // If resident is head but household_id is not set, update it
                        // This fixes data integrity issues from resident-first architecture
                        if ($isHeadOfHousehold && !$resident->household_id) {
                            try {
                                $resident->household_id = $headHousehold->id;
                                $resident->relationship_to_head = 'Head';
                                $resident->save();
                                // Reload the relationship to ensure it's available
                                $resident->load('household.purok');
                                
                                \Log::info('Auto-updated resident household_id for head', [
                                    'resident_id' => $resident->id,
                                    'household_id' => $headHousehold->id
                                ]);
                            } catch (\Exception $updateError) {
                                \Log::warning('Failed to auto-update resident household_id: ' . $updateError->getMessage(), [
                                    'resident_id' => $resident->id,
                                    'household_id' => $headHousehold->id
                                ]);
                            }
                        }
                        
                        // CRITICAL: If resident is head, ensure household relationship is loaded
                        // Even if household_id is set, the relationship might not be loaded
                        if ($isHeadOfHousehold && $headHousehold && !$resident->household) {
                            // Manually set the relationship so it's available in the response
                            $resident->setRelation('household', $headHousehold);
                        }
                    } catch (\Exception $e) {
                        // If query fails, just set to false
                        \Log::warning('Error checking head of household: ' . $e->getMessage(), [
                            'resident_id' => $resident->id
                        ]);
                    }
                }
                
                // Safely get age
                $age = null;
                try {
                    $age = $resident->age;
                } catch (\Exception $e) {
                    // If age calculation fails, leave as null
                }
                
                // Safely get classifications
                $classifications = [];
                $isSenior = false;
                $isSoloParent = false;
                try {
                    if ($resident->birthdate) {
                        $isSenior = $resident->is_senior ?? false;
                        if ($isSenior) {
                            $classifications[] = 'Senior Citizen';
                        }
                    }
                    if ($resident->is_pwd ?? false) {
                        $classifications[] = 'PWD';
                    }
                    // Check solo parent - can be from household relationship or from being head
                    $checkHousehold = $resident->household ?? $headHousehold;
                    if ($checkHousehold && ($resident->household_id || $isHeadOfHousehold)) {
                        try {
                            $isSoloParent = $resident->is_solo_parent ?? false;
                            if ($isSoloParent) {
                                $classifications[] = 'Solo Parent';
                            }
                        } catch (\Exception $e) {
                            // If solo parent check fails, just skip it
                        }
                    }
                } catch (\Exception $e) {
                    // If classification calculation fails, just use empty array
                }
                
                // Get household data - prioritize resident's household relationship, then check if they are head
                $householdData = null;
                
                // First, try to get household from resident's household_id relationship
                // OR if resident is head, use the headHousehold we already loaded
                $householdToUse = $resident->household ?? ($isHeadOfHousehold ? $headHousehold : null);
                
                // Resolve purok for display - from household or direct resident purok_id (with fallback lookup)
                $purokData = null;
                $purokId = $householdToUse?->purok_id ?? $resident->purok_id ?? null;
                if ($purokId) {
                    $purokModel = ($householdToUse && $householdToUse->purok) ? $householdToUse->purok : ($resident->purok ?? null);
                    if (!$purokModel) {
                        $purokModel = \App\Models\Purok::find($purokId);
                    }
                    if ($purokModel) {
                        $purokData = ['id' => $purokModel->id, 'name' => $purokModel->name];
                    }
                }

                if ($householdToUse) {
                    $householdData = [
                        'id' => $householdToUse->id,
                        'head_name' => ($isHeadOfHousehold && $householdToUse->head_resident_id == $resident->id)
                            ? ($resident->full_name ?? trim(($resident->first_name ?? '') . ' ' . ($resident->middle_name ? $resident->middle_name . ' ' : '') . ($resident->last_name ?? '')))
                            : ((isset($householdToUse->headResident) && $householdToUse->headResident) 
                                ? $householdToUse->headResident->full_name 
                                : ($householdToUse->head_name ?? 'N/A')),
                        'address' => $householdToUse->address ?? 'N/A',
                        'purok_id' => $householdToUse->purok_id,
                        'purok' => $purokData,
                    ];
                }
                
                return [
                    'id' => $resident->id,
                    'household_id' => $resident->household_id ?? ($isHeadOfHousehold && $headHousehold ? $headHousehold->id : null),
                    'first_name' => $resident->first_name ?? '',
                    'middle_name' => $resident->middle_name,
                    'last_name' => $resident->last_name ?? '',
                    'suffix' => $resident->suffix ?? null,
                    'full_name' => $resident->full_name ?? trim(($resident->first_name ?? '') . ' ' . ($resident->middle_name ? $resident->middle_name . ' ' : '') . ($resident->last_name ?? '')),
                    'sex' => $resident->sex ?? 'other',
                    'birthdate' => $resident->birthdate ? $resident->birthdate->format('Y-m-d') : null,
                    'civil_status' => $resident->civil_status ?? 'single',
                    'relationship_to_head' => $resident->relationship_to_head ?? ($isHeadOfHousehold ? 'Head' : null),
                    'occupation_status' => $resident->occupation_status ?? 'other',
                    'resident_status' => $resident->resident_status ?? 'active',
                    'is_pwd' => $resident->is_pwd ?? false,
                    'age' => $age,
                    'is_senior' => $isSenior,
                    'is_solo_parent' => $isSoloParent,
                    'classifications' => $classifications,
                    'is_head_of_household' => $isHeadOfHousehold,
                    'photo_path' => $resident->photo_path ?? null,
                    'photo_url' => $resident->photo_url ?? null,
                    'household' => $householdData,
                    'purok' => $purokData,
                ];
            } catch (\Exception $e) {
                // Log error and return basic resident data
                \Log::error('Error transforming resident data: ' . $e->getMessage(), [
                    'resident_id' => $resident->id ?? null,
                    'exception' => $e,
                    'trace' => $e->getTraceAsString()
                ]);
                
                return [
                    'id' => $resident->id ?? 0,
                    'household_id' => $resident->household_id,
                    'first_name' => $resident->first_name ?? '',
                    'middle_name' => $resident->middle_name,
                    'last_name' => $resident->last_name ?? '',
                    'suffix' => $resident->suffix ?? null,
                    'full_name' => trim(($resident->first_name ?? '') . ' ' . ($resident->last_name ?? '')),
                    'sex' => $resident->sex ?? 'other',
                    'birthdate' => $resident->birthdate ? $resident->birthdate->format('Y-m-d') : null,
                    'civil_status' => $resident->civil_status ?? 'single',
                    'relationship_to_head' => $resident->relationship_to_head,
                    'occupation_status' => $resident->occupation_status ?? 'other',
                    'resident_status' => $resident->resident_status ?? 'active',
                    'is_pwd' => $resident->is_pwd ?? false,
                    'age' => null,
                    'is_senior' => false,
                    'is_solo_parent' => false,
                    'classifications' => [],
                    'is_head_of_household' => false,
                    'photo_path' => $resident->photo_path ?? null,
                    'photo_url' => $resident->photo_url ?? null,
                    'household' => null,
                    'purok' => null,
                ];
            }
            
            // Ensure photo_url is included
            $resident->photo_url = $resident->photo_url ?? null;
        });

        return $this->respondSuccess($residents);
    }

    public function store(StoreResidentRequest $request)
    {
        $user = $request->user();
        $data = $request->validated();

        // Debug: Log the received data
        Log::info('Resident creation request data:', [
            'user_id' => $user->id,
            'validated_data' => $data,
            'raw_data' => $request->all()
        ]);

        // Remove purok_id from data as it's not needed (residents get purok through household)
        unset($data['purok_id']);

        try {
            // Start database transaction for data consistency
            DB::beginTransaction();

            // Handle household assignment (can be null for unassigned residents)
            if (isset($data['household_id']) && $data['household_id']) {
                // Auto-assign purok_id for purok leaders
                if ($user->isPurokLeader()) {
                    // Verify that the household belongs to the assigned purok
                    $household = \App\Models\Household::find($data['household_id']);
                    if (!$household || $household->purok_id != $user->assigned_purok_id) {
                        DB::rollBack();
                        return $this->respondError('You can only add residents to households in your assigned purok.', null, 403);
                    }
                }

                // Additional validation: Check for duplicate resident in same household
                $existingResident = Resident::where('household_id', $data['household_id'])
                    ->where('first_name', $data['first_name'])
                    ->where('last_name', $data['last_name'])
                    ->where('birthdate', $data['birthdate'])
                    ->first();

                if ($existingResident) {
                    DB::rollBack();
                    return $this->respondError('A resident with the same name and birthdate already exists in this household.', [
                        'duplicate_resident' => [
                            'A resident with the same first name, last name, and birthdate already exists in this household.'
                        ]
                    ], 422);
                }
            } else {
                // Unassigned resident - set relationship_to_head to null
                $data['relationship_to_head'] = null;
            }

            // Handle photo upload
            if ($request->hasFile('photo')) {
                $file = $request->file('photo');
                // Generate unique filename: timestamp_random.extension
                $extension = $file->getClientOriginalExtension();
                $filename = time() . '_' . uniqid() . '.' . $extension;
                $photoPath = $file->storeAs('residents', $filename, 'public');
                $data['photo_path'] = $photoPath;

                Log::info('Resident photo uploaded', [
                    'path' => $photoPath,
                    'full_path' => Storage::disk('public')->path($photoPath),
                    'exists' => Storage::disk('public')->exists($photoPath),
                ]);
            }

            // Clean up data - convert empty strings to null for nullable fields
            $createData = $data;
            $nullableFields = [
                'household_id', 'purok_id', 'middle_name', 'suffix', 'place_of_birth', 'nationality', 
                'religion', 'contact_number', 'email', 'valid_id_type', 'valid_id_number',
                'relationship_to_head', 'employer_workplace', 'educational_attainment',
                'remarks', 'photo_path', 'resident_status'
            ];
            
            foreach ($nullableFields as $field) {
                if (isset($createData[$field]) && $createData[$field] === '') {
                    $createData[$field] = null;
                }
            }

            // If household_id is set, get purok_id from household if purok_id is not provided
            if (isset($createData['household_id']) && $createData['household_id'] && !isset($createData['purok_id'])) {
                $household = \App\Models\Household::find($createData['household_id']);
                if ($household && $household->purok_id) {
                    $createData['purok_id'] = $household->purok_id;
                }
            }

            // Check if purok_id column exists in the residents table before trying to save it
            // If column doesn't exist, remove purok_id from createData to avoid SQL errors
            try {
                $schema = \Illuminate\Support\Facades\Schema::getColumnListing('residents');
                if (!in_array('purok_id', $schema)) {
                    // Column doesn't exist, remove purok_id from data
                    unset($createData['purok_id']);
                    Log::info('purok_id column does not exist in residents table, removing from createData');
                }
            } catch (\Exception $e) {
                // If we can't check the schema, remove purok_id to be safe
                unset($createData['purok_id']);
                Log::warning('Could not check if purok_id column exists, removing from createData: ' . $e->getMessage());
            }
            
            // Ensure boolean fields are actual booleans
            if (isset($createData['is_pwd'])) {
                $createData['is_pwd'] = (bool) $createData['is_pwd'];
            } else {
                $createData['is_pwd'] = false;
            }
            
            if (isset($createData['is_pregnant'])) {
                $createData['is_pregnant'] = (bool) $createData['is_pregnant'];
            } else {
                $createData['is_pregnant'] = false;
            }
            
            // Ensure resident_status has a default
            if (empty($createData['resident_status'])) {
                $createData['resident_status'] = 'active';
            }
            
            // Log the data before creation
            Log::info('Creating resident with data:', [
                'data' => $createData,
                'data_keys' => array_keys($createData)
            ]);

            // Create the resident
            $resident = Resident::create($createData);

            // Log the audit trail
            try {
                $this->logResidentCreation($resident, $user, $request->ip());
            } catch (\Exception $e) {
                Log::warning('Failed to log resident creation: ' . $e->getMessage());
            }

            // Create notifications
            try {
                $this->createResidentNotifications($resident, $user);
            } catch (\Exception $e) {
                Log::warning('Failed to create resident notifications: ' . $e->getMessage());
            }

            // Commit the transaction
            DB::commit();

            // Load relationships for response
            $resident->load(['household.purok']);
            
            // Ensure photo_url is included in response
            $resident->photo_url = $resident->photo_url;

            return $this->respondSuccess($resident, 'Resident created successfully', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();

            Log::error('Resident creation validation failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'validated_data' => $data ?? [],
                'raw_request_data' => $request->all(),
                'errors' => $e->errors(),
                'error_details' => json_encode($e->errors(), JSON_PRETTY_PRINT)
            ]);

            return $this->respondError('Validation failed: ' . json_encode($e->errors()), $e->errors(), 422);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();

            // Handle specific database errors
            if ($e->getCode() == 23000) { // Integrity constraint violation
                Log::error('Database integrity constraint violation: ' . $e->getMessage(), [
                    'user_id' => $user->id,
                    'data' => $data,
                    'sql' => $e->getSql(),
                    'bindings' => $e->getBindings(),
                    'error_code' => $e->getCode(),
                    'error_info' => $e->errorInfo ?? null
                ]);
                return $this->respondError('Database integrity constraint violation: ' . $e->getMessage(), ['sql_error' => $e->getMessage()], 422);
            }

            Log::error('Resident creation failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'data' => $data,
                'exception' => $e
            ]);

            return $this->respondError('Failed to create resident. Please try again.', null, 500);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Unexpected error during resident creation: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'data' => $data,
                'exception' => $e,
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);

            return $this->respondError('An unexpected error occurred: ' . $e->getMessage() . ' (Line: ' . $e->getLine() . ')', ['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()], 500);
        }
    }

    public function show(Request $request, Resident $resident)
    {
        $user = $request->user();

        // Check if purok leader can access this resident
        if ($user->isPurokLeader()) {
            $hasAccess = false;
            if ($resident->household && $resident->household->purok_id == $user->assigned_purok_id) {
                $hasAccess = true;
            }
            // Check if resident is head of household in assigned purok
            $isHeadInPurok = \App\Models\Household::where('head_resident_id', $resident->id)
                ->where('purok_id', $user->assigned_purok_id)
                ->exists();
            if ($isHeadInPurok) {
                $hasAccess = true;
            }
            if (!$hasAccess) {
                return $this->respondError('Access denied.', null, 403);
            }
        }

        // Load the resident with household and purok relationships
        $resident->load(['household.purok', 'household.headResident', 'soloParent']);

        // Get classifications
        $classifications = [];
        try {
            $classifications = $resident->classifications;
        } catch (\Exception $e) {
            // If classification calculation fails, use empty array
        }
        
        // Safely check if resident is head of household
        $isHeadOfHousehold = false;
        try {
            $isHeadOfHousehold = \App\Models\Household::where('head_resident_id', $resident->id)->exists();
        } catch (\Exception $e) {
            // If check fails, just set to false
        }

        // Format the response for the frontend with all fields
        $purokId = $resident->purok_id ?? ($resident->household?->purok_id ?? null);
        $formattedResident = [
            'id' => $resident->id,
            'household_id' => $resident->household_id,
            'purok_id' => $purokId,
            'first_name' => $resident->first_name,
            'middle_name' => $resident->middle_name,
            'last_name' => $resident->last_name,
            'suffix' => $resident->suffix ?? null,
            'full_name' => $resident->full_name,
            'sex' => $resident->sex,
            'birthdate' => $resident->birthdate ? $resident->birthdate->format('Y-m-d') : null,
            'place_of_birth' => $resident->place_of_birth ?? null,
            'nationality' => $resident->nationality ?? 'Filipino',
            'religion' => $resident->religion ?? null,
            'contact_number' => $resident->contact_number ?? null,
            'email' => $resident->email ?? null,
            'valid_id_type' => $resident->valid_id_type ?? null,
            'valid_id_number' => $resident->valid_id_number ?? null,
            'civil_status' => $resident->civil_status,
            'relationship_to_head' => $resident->relationship_to_head,
            'occupation_status' => $resident->occupation_status,
            'employer_workplace' => $resident->employer_workplace ?? null,
            'educational_attainment' => $resident->educational_attainment ?? null,
            'is_pwd' => $resident->is_pwd,
            'is_pregnant' => $resident->is_pregnant,
            'resident_status' => $resident->resident_status ?? 'active',
            'remarks' => $resident->remarks ?? null,
            'age' => $resident->age,
            'is_senior' => $resident->is_senior,
            'is_solo_parent' => $resident->is_solo_parent,
            'classifications' => $classifications,
            'is_head_of_household' => $isHeadOfHousehold,
            'photo_path' => $resident->photo_path ?? null,
            'photo_url' => $resident->photo_url ?? null,
            'household' => $resident->household ? [
                'id' => $resident->household->id,
                'head_name' => (isset($resident->household->headResident) && $resident->household->headResident) 
                    ? $resident->household->headResident->full_name 
                    : ($resident->household->head_name ?? 'N/A'),
                'address' => $resident->household->address,
                'purok_id' => $resident->household->purok_id,
                'purok' => $resident->household->purok ? [
                    'id' => $resident->household->purok->id,
                    'name' => $resident->household->purok->name,
                ] : null,
            ] : null,
            'head_of_households' => \App\Models\Household::where('head_resident_id', $resident->id)
                ->with('purok')
                ->get()
                ->map(function ($household) {
                    return [
                        'id' => $household->id,
                        'address' => $household->address,
                        'purok' => $household->purok ? [
                            'id' => $household->purok->id,
                            'name' => $household->purok->name,
                        ] : null,
                    ];
                }),
            'created_at' => $resident->created_at ? $resident->created_at->toISOString() : null,
            'updated_at' => $resident->updated_at ? $resident->updated_at->toISOString() : null,
        ];

        return $this->respondSuccess($formattedResident);
    }

    public function update(UpdateResidentRequest $request, Resident $resident)
    {
        $user = $request->user();

        // Check if purok leader can edit this resident
        if ($user->isPurokLeader()) {
            $hasAccess = false;
            if ($resident->household && $resident->household->purok_id == $user->assigned_purok_id) {
                $hasAccess = true;
            }
            // Check if resident is head of household in assigned purok
            $isHeadInPurok = \App\Models\Household::where('head_resident_id', $resident->id)
                ->where('purok_id', $user->assigned_purok_id)
                ->exists();
            if ($isHeadInPurok) {
                $hasAccess = true;
            }
            // Unassigned residents (no household) can be edited by purok leaders
            if (!$resident->household_id) {
                $hasAccess = true;
            }
            if (!$hasAccess) {
                return $this->respondError('You can only edit residents in your assigned purok.', null, 403);
            }
        }

        $data = $request->validated();

        try {
            // Start database transaction for data consistency
            DB::beginTransaction();

            // Handle household assignment changes
            if (isset($data['household_id'])) {
                if ($data['household_id']) {
                    // Assigning to a household
                    // For purok leaders, ensure they can't change the household to one outside their purok
                    if ($user->isPurokLeader()) {
                        $household = \App\Models\Household::find($data['household_id']);
                        if (!$household || $household->purok_id != $user->assigned_purok_id) {
                            DB::rollBack();
                            return $this->respondError('You can only assign residents to households in your assigned purok.', null, 403);
                        }
                    }

                    // Check for duplicate resident in same household (excluding current resident)
                    $existingResident = Resident::where('household_id', $data['household_id'])
                        ->where('id', '!=', $resident->id)
                        ->where('first_name', $data['first_name'] ?? $resident->first_name)
                        ->where('last_name', $data['last_name'] ?? $resident->last_name)
                        ->where('birthdate', $data['birthdate'] ?? $resident->birthdate)
                        ->first();

                    if ($existingResident) {
                        DB::rollBack();
                        return $this->respondError('A resident with the same name and birthdate already exists in this household.', [
                            'duplicate_resident' => [
                                'A resident with the same first name, last name, and birthdate already exists in this household.'
                            ]
                        ], 422);
                    }

                    // Ensure relationship_to_head is provided
                    if (empty($data['relationship_to_head'])) {
                        DB::rollBack();
                        return $this->respondError('Relationship to head is required when assigning to a household.', [
                            'relationship_to_head' => ['Relationship to head is required when assigning to a household.']
                        ], 422);
                    }
                } else {
                    // Unassigning from household - set relationship_to_head to null
                    $data['relationship_to_head'] = null;
                }
            }

            // Handle photo upload
            if ($request->hasFile('photo')) {
                // Delete old photo if exists
                if ($resident->photo_path) {
                    try {
                        Storage::disk('public')->delete($resident->photo_path);
                    } catch (\Exception $e) {
                        Log::warning('Failed to delete old resident photo: ' . $e->getMessage());
                    }
                }

                $file = $request->file('photo');
                // Generate unique filename: timestamp_random.extension
                $extension = $file->getClientOriginalExtension();
                $filename = time() . '_' . uniqid() . '.' . $extension;
                $photoPath = $file->storeAs('residents', $filename, 'public');
                $data['photo_path'] = $photoPath;

                Log::info('Resident photo updated', [
                    'resident_id' => $resident->id,
                    'path' => $photoPath,
                    'exists' => Storage::disk('public')->exists($photoPath),
                ]);
            }

            // Update the resident (exclude is_solo_parent - it's handled via solo_parents table)
            $soloParentRequested = $data['is_solo_parent'] ?? null;
            unset($data['is_solo_parent']);
            $resident->update($data);

            // Handle solo parent: create or delete SoloParent record
            if ($soloParentRequested !== null) {
                $existingSoloParent = \App\Models\SoloParent::where('resident_id', $resident->id)->first();
                if ($soloParentRequested) {
                    if (!$existingSoloParent) {
                        \App\Models\SoloParent::create([
                            'resident_id' => $resident->id,
                            'eligibility_reason' => 'unmarried_parent',
                            'date_declared' => now(),
                            'valid_until' => now()->addYears(1),
                            'created_by' => $user->id,
                        ]);
                    }
                } else {
                    if ($existingSoloParent) {
                        $existingSoloParent->delete();
                    }
                }
            }

            // Log the audit trail
            $auditChanges = $data;
            if ($soloParentRequested !== null) {
                $auditChanges['is_solo_parent'] = $soloParentRequested;
            }
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'updated',
                'model_type' => Resident::class,
                'model_id' => $resident->id,
                'changes' => $auditChanges,
                'ip_address' => $request->ip(),
            ]);

            // Commit the transaction
            DB::commit();

            // Load relationships for response
            $resident->load(['household.purok']);
            
            // Ensure photo_url is included in response
            $resident->photo_url = $resident->photo_url;

            return $this->respondSuccess($resident, 'Resident updated successfully');
        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();

            Log::error('Resident update validation failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'resident_id' => $resident->id,
                'data' => $data,
                'errors' => $e->errors()
            ]);

            return $this->respondError('Validation failed', $e->errors(), 422);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();

            // Handle specific database errors
            if ($e->getCode() == 23000) { // Integrity constraint violation
                return $this->respondError('Database integrity constraint violation. Please check your data and try again.', null, 422);
            }

            Log::error('Resident update failed: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'resident_id' => $resident->id,
                'data' => $data,
                'exception' => $e
            ]);

            return $this->respondError('Failed to update resident. Please try again.', null, 500);
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Unexpected error during resident update: ' . $e->getMessage(), [
                'user_id' => $user->id,
                'resident_id' => $resident->id,
                'data' => $data,
                'exception' => $e
            ]);

            return $this->respondError('An unexpected error occurred. Please try again.', null, 500);
        }
    }

    public function destroy(Request $request, Resident $resident)
    {
        $user = $request->user();

        // Check if purok leader can delete this resident
        if ($user->isPurokLeader()) {
            if ($resident->household->purok_id != $user->assigned_purok_id) {
                return $this->respondError('You can only delete residents in your assigned purok.', null, 403);
            }
        }

        $resident->delete();
        return $this->respondSuccess(null, 'Resident deleted');
    }

    /**
     * Search for existing residents
     */
    public function search(Request $request)
    {
        $query = $request->string('query')->toString();
        $user = $request->user();

        if (empty($query) || strlen($query) < 2) {
            return $this->respondSuccess(['data' => []]);
        }

        $residentsQuery = Resident::with(['household.purok'])
            ->where(function ($q) use ($query) {
                $q->where('first_name', 'like', "%{$query}%")
                    ->orWhere('middle_name', 'like', "%{$query}%")
                    ->orWhere('last_name', 'like', "%{$query}%")
                    ->orWhereRaw("CONCAT(first_name, ' ', COALESCE(middle_name, ''), ' ', last_name) LIKE ?", ["%{$query}%"]);
            });

        // Role-based filtering for purok leaders
        if ($user->isPurokLeader()) {
            $residentsQuery->whereHas('household', function ($q) use ($user) {
                $q->where('purok_id', $user->assigned_purok_id);
            });
        }

        $residents = $residentsQuery->limit(10)->get();

        $formattedResidents = $residents->map(function ($resident) {
            return [
                'id' => $resident->id,
                'full_name' => $resident->full_name,
                'age' => $resident->age,
                'sex' => $resident->sex,
                'household_id' => $resident->household_id,
                'household' => $resident->household ? [
                    'id' => $resident->household->id,
                    'head_name' => $resident->household->head_name,
                    'address' => $resident->household->address,
                    'purok' => $resident->household->purok ? [
                        'id' => $resident->household->purok->id,
                        'name' => $resident->household->purok->name,
                    ] : null,
                ] : null,
            ];
        });

        return $this->respondSuccess(['data' => $formattedResidents]);
    }

    /**
     * Link an existing resident to a household
     */
    public function linkToHousehold(Request $request)
    {
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'resident_id' => 'required|exists:residents,id',
            'household_id' => 'required|exists:households,id',
        ]);

        if ($validator->fails()) {
            return $this->respondError('Validation failed', $validator->errors()->toArray(), 422);
        }

        $user = $request->user();
        $resident = Resident::findOrFail($request->resident_id);
        $household = \App\Models\Household::findOrFail($request->household_id);

        // Check if purok leader can perform this action
        if ($user->isPurokLeader()) {
            if ($household->purok_id != $user->assigned_purok_id) {
                return $this->respondError('You can only link residents to households in your assigned purok.', null, 403);
            }
        }

        // Check if resident is already linked to a household
        if ($resident->household_id) {
            return $this->respondError('This resident is already linked to a household.', null, 422);
        }

        // Link resident to household
        $resident->update(['household_id' => $request->household_id]);

        // Load the updated resident with household data
        $resident->load(['household.purok']);

        return $this->respondSuccess($resident, 'Resident linked to household successfully');
    }

    /**
     * Log resident creation to audit trail
     */
    private function logResidentCreation($resident, $user, $ipAddress)
    {
        try {
            AuditLog::create([
                'user_id' => $user->id,
                'action' => 'Created Resident',
                'model_type' => 'App\Models\Resident',
                'model_id' => $resident->id,
                'changes' => [
                    'resident_details' => [
                        'name' => $resident->full_name,
                        'household_id' => $resident->household_id,
                        'sex' => $resident->sex,
                        'birthdate' => $resident->birthdate?->format('Y-m-d'),
                        'relationship_to_head' => $resident->relationship_to_head,
                        'occupation_status' => $resident->occupation_status,
                        'is_pwd' => $resident->is_pwd,
                    ],
                    'household_info' => [
                        'head_name' => $resident->household?->head_name,
                        'address' => $resident->household?->address,
                        'purok_id' => $resident->household?->purok_id,
                    ]
                ],
                'ip_address' => $ipAddress,
            ]);
        } catch (\Exception $e) {
            // Log the audit failure but don't fail the main operation
            Log::warning('Failed to create audit log for resident creation: ' . $e->getMessage(), [
                'resident_id' => $resident->id,
                'user_id' => $user->id,
                'exception' => $e
            ]);
        }
    }

    /**
     * Create notifications for new resident
     */
    private function createResidentNotifications($resident, $user)
    {
        $fullName = trim($resident->first_name . ' ' . ($resident->middle_name ? $resident->middle_name . ' ' : '') . $resident->last_name);
        // Load household relationship if it exists
        if ($resident->household_id) {
            $resident->load('household');
            $householdAddress = $resident->household->address ?? 'Unknown address';
        } else {
            $householdAddress = 'Unassigned';
        }

        // Notify admin
        $adminUsers = User::where('role', 'admin')->get();
        foreach ($adminUsers as $admin) {
            NotificationController::createUserNotification(
                $admin->id,
                'New Resident Added',
                "A new resident has been added: {$fullName} at {$householdAddress}",
                'resident'
            );
        }

        // Notify purok leader if different from the user who created it
        if ($resident->household->purok_id && $user->role !== 'purok_leader') {
            $purokLeader = User::where('role', 'purok_leader')
                ->where('assigned_purok_id', $resident->household->purok_id)
                ->first();

            if ($purokLeader) {
                NotificationController::createUserNotification(
                    $purokLeader->id,
                    'New Resident in Your Purok',
                    "A new resident has been added to your purok: {$fullName} at {$householdAddress}",
                    'resident'
                );
            }
        }
    }
}

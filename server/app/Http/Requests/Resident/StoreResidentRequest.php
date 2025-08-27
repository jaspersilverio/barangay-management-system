<?php

namespace App\Http\Requests\Resident;

use App\Http\Requests\BaseFormRequest;

class StoreResidentRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->user();
        $isPurokLeader = $user && $user->role === 'purok_leader';

        return [
            'household_id' => ['required', 'integer', 'exists:households,id'],
            'first_name' => ['required', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'sex' => ['required', 'in:male,female,other'],
            'birthdate' => ['required', 'date'],
            'relationship_to_head' => ['required', 'string', 'max:255'],
            'occupation_status' => ['required', 'in:employed,unemployed,student,retired,other'],
            'is_pwd' => ['boolean'],
            'purok_id' => $isPurokLeader
                ? ['nullable', 'string'] // Optional for purok leaders (auto-assigned)
                : ['required', 'string', 'exists:puroks,id'], // Required for others
        ];
    }
}

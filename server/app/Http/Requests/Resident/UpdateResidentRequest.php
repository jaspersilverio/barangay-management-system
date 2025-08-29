<?php

namespace App\Http\Requests\Resident;

use App\Http\Requests\BaseFormRequest;

class UpdateResidentRequest extends BaseFormRequest
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
            'household_id' => ['sometimes', 'integer', 'exists:households,id'],
            'first_name' => ['sometimes', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'sex' => ['sometimes', 'in:male,female,other'],
            'birthdate' => ['sometimes', 'date'],
            'relationship_to_head' => ['sometimes', 'string', 'max:255'],
            'occupation_status' => ['sometimes', 'in:employed,unemployed,student,retired,other'],
            'is_pwd' => ['sometimes', 'boolean'],
        ];
    }
}

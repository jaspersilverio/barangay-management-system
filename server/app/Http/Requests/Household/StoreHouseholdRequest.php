<?php

namespace App\Http\Requests\Household;

use App\Http\Requests\BaseFormRequest;

class StoreHouseholdRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user = $this->user();

        return [
            'address' => ['required', 'string', 'max:255'],
            'property_type' => ['required', 'string', 'max:255'],
            'head_name' => ['required', 'string', 'max:255'],
            'contact' => ['required', 'string', 'max:255'],
            'purok_id' => $user && $user->role === 'purok_leader'
                ? ['nullable', 'integer', 'exists:puroks,id']
                : ['required', 'integer', 'exists:puroks,id'],
        ];
    }
}

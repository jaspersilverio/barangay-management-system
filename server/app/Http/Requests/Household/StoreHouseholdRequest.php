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
        return [
            'purok_id' => ['required', 'integer', 'exists:puroks,id'],
            'household_code' => ['required', 'string', 'max:255', 'unique:households,household_code'],
            'head_name' => ['required', 'string', 'max:255'],
            'address' => ['required', 'string', 'max:255'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'photo_path' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'created_by' => ['nullable', 'integer', 'exists:users,id'],
            'updated_by' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}

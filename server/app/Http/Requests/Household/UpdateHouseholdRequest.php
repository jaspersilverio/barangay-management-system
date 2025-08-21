<?php

namespace App\Http\Requests\Household;

use App\Http\Requests\BaseFormRequest;
use Illuminate\Validation\Rule;

class UpdateHouseholdRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $id = $this->route('household')?->id ?? null;
        return [
            'purok_id' => ['sometimes', 'integer', 'exists:puroks,id'],
            'household_code' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('households', 'household_code')->ignore($id)
            ],
            'head_name' => ['sometimes', 'string', 'max:255'],
            'address' => ['sometimes', 'string', 'max:255'],
            'landmark' => ['nullable', 'string', 'max:255'],
            'photo_path' => ['nullable', 'string', 'max:255'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'created_by' => ['sometimes', 'integer', 'exists:users,id'],
            'updated_by' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }
}

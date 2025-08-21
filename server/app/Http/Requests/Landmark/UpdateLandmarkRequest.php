<?php

namespace App\Http\Requests\Landmark;

use App\Http\Requests\BaseFormRequest;

class UpdateLandmarkRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'purok_id' => ['sometimes', 'integer', 'exists:puroks,id'],
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'in:church,school,barangay_hall,evacuation_center,health_center,other'],
            'description' => ['nullable', 'string'],
            'latitude' => ['sometimes', 'numeric'],
            'longitude' => ['sometimes', 'numeric'],
        ];
    }
}

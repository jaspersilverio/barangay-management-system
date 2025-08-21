<?php

namespace App\Http\Requests\Landmark;

use App\Http\Requests\BaseFormRequest;

class StoreLandmarkRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'purok_id' => ['required', 'integer', 'exists:puroks,id'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:church,school,barangay_hall,evacuation_center,health_center,other'],
            'description' => ['nullable', 'string'],
            'latitude' => ['required', 'numeric'],
            'longitude' => ['required', 'numeric'],
        ];
    }
}

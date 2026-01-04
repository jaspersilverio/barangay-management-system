<?php

namespace App\Http\Requests\Official;

use App\Http\Requests\BaseFormRequest;

class UpdateOfficialRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        return [
            'user_id' => ['nullable', 'exists:users,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'position' => ['sometimes', 'required', 'string', 'max:255'],
            'term_start' => ['nullable', 'date'],
            'term_end' => ['nullable', 'date', 'after_or_equal:term_start'],
            'contact' => ['nullable', 'string', 'max:255'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'], // 5MB max, webp support
            'active' => ['sometimes', 'nullable'],
        ];
    }

    protected function prepareForValidation()
    {
        // Convert active to boolean if it's a string
        if ($this->has('active')) {
            $activeValue = $this->active;
            if (is_string($activeValue)) {
                $this->merge([
                    'active' => $activeValue === 'true',
                ]);
            } elseif (is_bool($activeValue)) {
                $this->merge([
                    'active' => $activeValue,
                ]);
            } else {
                $this->merge([
                    'active' => true, // default to true
                ]);
            }
        }
    }

    public function messages(): array
    {
        return [
            'name.required' => 'The official name is required.',
            'position.required' => 'The position is required.',
            'term_end.after_or_equal' => 'The term end date must be after or equal to the term start date.',
            'photo.image' => 'The photo must be an image file.',
            'photo.mimes' => 'The photo must be a JPEG, PNG, JPG, or WEBP file.',
            'photo.max' => 'The photo size must not exceed 5MB.',
        ];
    }
}

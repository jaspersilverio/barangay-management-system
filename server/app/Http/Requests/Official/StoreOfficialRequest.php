<?php

namespace App\Http\Requests\Official;

use App\Http\Requests\BaseFormRequest;

class StoreOfficialRequest extends BaseFormRequest
{
    public function authorize(): bool
    {
        return $this->user()->role === 'admin';
    }

    public function rules(): array
    {
        $officialType = $this->input('official_type');
        $isAppointed = $officialType === 'appointed';

        if ($isAppointed) {
            return [
                'full_name' => ['required', 'string', 'max:255'],
                'gender' => ['required', 'string', 'in:male,female,Male,Female'],
                'birthdate' => ['required', 'date'],
                'contact_number' => ['nullable', 'string', 'max:20'],
                'address' => ['nullable', 'string'],
                'date_appointed' => ['required', 'date'],
                'status' => ['required', 'string', 'in:active,inactive'],
                'official_role' => ['required', 'string', 'in:tanod,bhw,staff'],
                'official_type' => ['required', 'string', 'in:appointed'],
            ];
        }

        $category = $this->input('category', 'official');
        $isOfficialCategory = $category === 'official';
        $isSKCategory = $category === 'sk';
        $isEnhancedCategory = $isOfficialCategory || $isSKCategory;

        return [
            'user_id' => ['nullable', 'exists:users,id'],
            'name' => $isEnhancedCategory ? ['nullable', 'string', 'max:255'] : ['required', 'string', 'max:255'],
            'category' => ['nullable', 'string', 'in:official,sk,tanod,bhw,staff'],
            'first_name' => $isEnhancedCategory ? ['required', 'string', 'max:255'] : ['nullable', 'string', 'max:255'],
            'middle_name' => ['nullable', 'string', 'max:255'],
            'last_name' => $isEnhancedCategory ? ['required', 'string', 'max:255'] : ['nullable', 'string', 'max:255'],
            'suffix' => ['nullable', 'string', 'max:50'],
            'sex' => ['nullable', 'string', 'in:Male,Female'],
            'birthdate' => ['nullable', 'date'],
            'email' => ['nullable', 'email', 'max:255'],
            'address' => ['nullable', 'string', 'max:500'],
            'purok_id' => ['nullable', 'exists:puroks,id'],
            'position' => [
                'required',
                'string',
                'max:255',
                function ($attribute, $value, $fail) use ($isOfficialCategory) {
                    if ($isOfficialCategory) {
                        $invalidPositions = ['SK', 'Tanod', 'Health Worker', 'BHW', 'Day Care Worker'];
                        foreach ($invalidPositions as $invalid) {
                            if (stripos($value, $invalid) !== false) {
                                $fail("Position '{$value}' is not valid for Barangay Officials.");
                                return;
                            }
                        }
                        $officialPositions = [
                            'Barangay Captain',
                            'Barangay Kagawad',
                            'Barangay Secretary',
                            'Barangay Treasurer',
                            'Barangay Administrator',
                            'Barangay Clerk'
                        ];
                        $isValidOfficial = false;
                        foreach ($officialPositions as $validPosition) {
                            if (stripos($value, $validPosition) !== false) {
                                $isValidOfficial = true;
                                break;
                            }
                        }
                        if (!$isValidOfficial) {
                            $fail("Position '{$value}' is not a valid Barangay Official position.");
                        }
                    }
                }
            ],
            'term_start' => ['nullable', 'date'],
            'term_end' => ['nullable', 'date', 'after_or_equal:term_start'],
            'contact' => ['nullable', 'string', 'max:255'],
            'photo' => ['nullable', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'active' => ['nullable'],
        ];
    }

    protected function prepareForValidation()
    {
        // Appointed officials: normalize status to active boolean
        if ($this->input('official_type') === 'appointed' && $this->has('status')) {
            $this->merge(['active' => $this->status === 'active']);
        }

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
        } else {
            $this->merge([
                'active' => true, // default to true if not provided
            ]);
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

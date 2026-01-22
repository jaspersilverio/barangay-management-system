<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BarangayInfo extends Model
{
    use HasFactory;

    protected $table = 'barangay_infos';

    protected $fillable = [
        'barangay_name',
        'municipality',
        'province',
        'region',
        'address',
        'contact_number',
        'email',
        'captain_name',
        'logo_path',
    ];

    /**
     * Get the singleton instance (id = 1)
     */
    public static function getInstance()
    {
        return static::firstOrCreate(['id' => 1]);
    }
}

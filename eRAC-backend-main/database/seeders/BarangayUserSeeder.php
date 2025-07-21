<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BarangayUser;
use App\Models\Barangay;
use Illuminate\Support\Facades\Hash;

class BarangayUserSeeder extends Seeder
{
    public function run()
    {
        $barangay = Barangay::first();
        BarangayUser::create([
            'first_name' => 'Juan',
            'middle_name' => 'D.',
            'last_name' => 'Cruz',
            'barangay_id' => $barangay->id,
            'position' => 'Barangay Captain',
            'suffix' => null,
            'photo_path' => null,
            'email' => 'juan.cruz@example.com',
            'username' => 'juancruz',
            'password' => Hash::make('password123'),
            'role' => 'admin',
            'is_approved' => true,
        ]);
    }
} 
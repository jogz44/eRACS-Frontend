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
        $barangays = Barangay::all();
        foreach ($barangays as $barangay) {
            BarangayUser::firstOrCreate([
                'username' => strtolower(str_replace(' ', '', $barangay->name)),
            ], [
                'first_name' => 'Reidh',
                'middle_name' => 'D.',
                'last_name' => 'Maze',
                'barangay_id' => $barangay->id,
                'position' => 'Barangay Captain',
                'suffix' => null,
                'photo_path' => 'profile-photos/rSYrsbZu3GvqESHS1ixYubhgnoAd1IQSguFEikge.png',
                'email' => strtolower(str_replace(' ', '', $barangay->name)) . '@example.com',
                'password' => Hash::make('password123'),
                'role' => 'barangay_user',
                'is_approved' => true,
            ]);
        }
    }
} 
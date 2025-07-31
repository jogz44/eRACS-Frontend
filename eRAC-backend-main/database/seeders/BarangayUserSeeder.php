<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BarangayUser;
use App\Models\Barangay;
use App\Models\BarangayPosition;
use Illuminate\Support\Facades\Hash;

class BarangayUserSeeder extends Seeder
{
    public function run()
    {
        $barangays = Barangay::all();
        $positions = BarangayPosition::all();
        
        if ($positions->isEmpty()) {
            throw new \Exception('No positions found. Please run BarangayPositionSeeder first.');
        }
        
        // Get the first barangay for multiple users with different positions
        $firstBarangay = $barangays->first();
        
        // Create multiple users with different positions for the first barangay
        $usersForFirstBarangay = [
            [
                'username' => strtolower(str_replace(' ', '', $firstBarangay->name)) . '_captain',
                'first_name' => 'Reidh',
                'middle_name' => 'D.',
                'last_name' => 'Maze',
                'position_name' => 'Barangay Captain',
                'email' => strtolower(str_replace(' ', '', $firstBarangay->name)) . '_captain@example.com',
            ],
            [
                'username' => strtolower(str_replace(' ', '', $firstBarangay->name)) . '_skc',
                'first_name' => 'Dan Steve',
                'middle_name' => 'P.',
                'last_name' => 'Bermejo',
                'position_name' => 'SK Chairperson',
                'email' => strtolower(str_replace(' ', '', $firstBarangay->name)) . '_skc@example.com',
            ],
            [
                'username' => strtolower(str_replace(' ', '', $firstBarangay->name)) . '_skt',
                'first_name' => 'Kristine Cielo',
                'middle_name' => 'B.',
                'last_name' => 'Garcia',
                'position_name' => 'SK Treasurer',
                'email' => strtolower(str_replace(' ', '', $firstBarangay->name)) . '_skt@example.com',
            ],
            [
                'username' => strtolower(str_replace(' ', '', $firstBarangay->name)) . '_treasurer',
                'first_name' => 'Michael June',
                'middle_name' => 'M.',
                'last_name' => 'Llano',
                'position_name' => 'Barangay Treasurer',
                'email' => strtolower(str_replace(' ', '', $firstBarangay->name)) . '_treasurer@example.com',
            ],
        ];
        
        // Create users for the first barangay with different positions
        foreach ($usersForFirstBarangay as $userData) {
            $position = $positions->where('name', $userData['position_name'])->first();
            
            BarangayUser::firstOrCreate([
                'username' => $userData['username'],
            ], [
                'first_name' => $userData['first_name'],
                'middle_name' => $userData['middle_name'],
                'last_name' => $userData['last_name'],
                'barangay_id' => $firstBarangay->id,
                'position_id' => $position->id,
                'suffix' => null,
                'photo_path' => 'profile-photos/rSYrsbZu3GvqESHS1ixYubhgnoAd1IQSguFEikge.png',
                'email' => $userData['email'],
                'password' => Hash::make('password123'),
                'role' => 'barangay_user',
                'is_approved' => true,
            ]);
        }
        
        // Create Barangay Captain users for all other barangays
        $barangayCaptainPosition = $positions->where('name', 'Barangay Captain')->first();
        foreach ($barangays->skip(1) as $barangay) {
            BarangayUser::firstOrCreate([
                'username' => strtolower(str_replace(' ', '', $barangay->name)),
            ], [
                'first_name' => 'Reidh',
                'middle_name' => 'D.',
                'last_name' => 'Maze',
                'barangay_id' => $barangay->id,
                'position_id' => $barangayCaptainPosition->id,
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
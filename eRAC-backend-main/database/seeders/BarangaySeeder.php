<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Barangay;

class BarangaySeeder extends Seeder
{
    public function run()
    {
        Barangay::create([
            'name' => 'Barangay Uno',
        ]);
    }
} 
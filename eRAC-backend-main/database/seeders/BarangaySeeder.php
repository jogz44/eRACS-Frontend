<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Barangay;

class BarangaySeeder extends Seeder
{
    public function run()
    {
        $barangays = [
            'Apokon',
            'Bincungan',
            'Busaon',
            'Canocotan',
            'Cuambogan',
            'La Filipina',
            'Liboganon',
            'Madaum',
            'Magdum',
            'Mankilam',
            'New Balamban',
            'Nueva Fuerza',
            'Pagsabangan',
            'Pandapan',
            'Magugpo Poblacion',
            'San Agustin',
            'San Isidro',
            'San Miguel',
            'Visayan Village',
            'Magugpo East',
            'Magugpo North',
            'Magugpo South',
            'Magugpo West',
        ];

        foreach ($barangays as $name) {
            Barangay::firstOrCreate(['name' => $name]);
        }
    }
} 
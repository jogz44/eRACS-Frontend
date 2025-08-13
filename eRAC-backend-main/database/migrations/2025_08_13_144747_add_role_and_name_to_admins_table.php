<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->string('name')->nullable()->after('password');
            $table->enum('role', ['super_admin', 'accounting', 'coa'])->default('super_admin')->after('name');
        });

        // Update existing admin record
        DB::table('admins')->where('email', 'admin@gmail.com')->update([
            'name' => 'Super Administrator',
            'role' => 'super_admin'
        ]);

        // Insert new accounting account
        DB::table('admins')->insert([
            'email' => 'accounting@gmail.com',
            'password' => Hash::make('accounting123'),
            'name' => 'Accounting Officer',
            'role' => 'accounting',
            'created_at' => now(),
            'updated_at' => now()
        ]);

        // Insert new COA account
        DB::table('admins')->insert([
            'email' => 'coa@gmail.com',
            'password' => Hash::make('coa123'),
            'name' => 'COA Officer',
            'role' => 'coa',
            'created_at' => now(),
            'updated_at' => now()
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropColumn(['name', 'role']);
        });

        // Remove the new accounts
        DB::table('admins')->where('email', 'accounting@gmail.com')->delete();
        DB::table('admins')->where('email', 'coa@gmail.com')->delete();
    }
};

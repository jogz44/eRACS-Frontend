<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cont_appropriations', function (Blueprint $table) {
            // Add new columns
            $table->foreignId('barangay_id')->after('id')->constrained();
            $table->foreignId('fiscal_year_id')->after('barangay_id')->constrained('lib_fiscal_years');
            $table->string('expense_class')->after('description');
            $table->decimal('appropriation_amount', 15, 2)->after('expense_class');
            $table->decimal('unappropriated_amount', 15, 2)->after('appropriation_amount');
            $table->date('continued_date')->after('unappropriated_amount');
            $table->enum('status', ['draft', 'committed', 'reverted'])->default('draft')->after('continued_date');
            $table->foreignId('user_id')->after('status')->constrained('barangay_users');
            
            // Add indexes
            $table->index(['barangay_id', 'fiscal_year_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cont_appropriations', function (Blueprint $table) {
            // Remove new columns
            $table->dropForeign(['barangay_id']);
            $table->dropForeign(['fiscal_year_id']);
            $table->dropForeign(['user_id']);
            $table->dropIndex(['barangay_id', 'fiscal_year_id']);
            
            $table->dropColumn([
                'barangay_id',
                'fiscal_year_id',
                'expense_class',
                'appropriation_amount',
                'unappropriated_amount',
                'continued_date',
                'status',
                'user_id'
            ]);
        });
    }
};

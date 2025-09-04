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
        // Expense Classes Table
    Schema::create('lib_expense_classes', function (Blueprint $table) {
        $table->id();
        $table->foreignId('barangay_id')->constrained()->onDelete('cascade');

        // Explicitly reference lib_fiscal_years table
        $table->foreignId('fiscal_year_id')
              ->constrained('lib_fiscal_years'); // Specify the correct table name
        $table->string('name');
        $table->integer('order')->default(0);
        $table->timestamps();

        $table->unique(['barangay_id', 'fiscal_year_id', 'name']);
    });

    // Expense Types Table
    Schema::create('lib_expense_types', function (Blueprint $table) {
        $table->id();
        $table->foreignId('expense_class_id')
              ->constrained('lib_expense_classes')
              ->onDelete('cascade');
        $table->string('name');
        $table->integer('order')->default(0);
        $table->timestamps();

        $table->unique(['expense_class_id', 'name']);
    });

    // Expense Items Table
    Schema::create('lib_expense_items', function (Blueprint $table) {
        $table->id();
        $table->foreignId('expense_type_id')
              ->constrained('lib_expense_types')
              ->onDelete('cascade');
        $table->unsignedBigInteger('parent_item_id')->nullable();
        $table->string('name');
        $table->integer('order')->default(0);
        $table->timestamps();

        // Index for parent_item_id
        $table->index(['parent_item_id']);
        
        // Unique constraint that includes parent_item_id for hierarchical support
        $table->unique(['expense_type_id', 'name', 'parent_item_id'], 'lib_expense_items_unique');
    });

    // Add foreign key constraint for parent_item_id after table creation
    Schema::table('lib_expense_items', function (Blueprint $table) {
        $table->foreign('parent_item_id')->references('id')->on('lib_expense_items')->onDelete('no action');
    });
    }

    public function down()
    {
        Schema::dropIfExists('lib_expense_items');
        Schema::dropIfExists('lib_expense_types');
        Schema::dropIfExists('lib_expense_classes');
    }
};

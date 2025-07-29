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
        Schema::create('budget_augmentation_details', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('budget_augmentation_id');
            $table->unsignedBigInteger('expense_class_id')->nullable();
            $table->unsignedBigInteger('expense_type_id')->nullable();
            $table->unsignedBigInteger('expense_item_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->text('particulars');
            $table->timestamps();

            $table->foreign('budget_augmentation_id')->references('id')->on('budget_augmentations')->onDelete('cascade');
            $table->foreign('expense_class_id')->references('id')->on('lib_expense_classes')->onDelete('no action');
            $table->foreign('expense_type_id')->references('id')->on('lib_expense_types')->onDelete('no action');
            $table->foreign('expense_item_id')->references('id')->on('lib_expense_items')->onDelete('no action');

            $table->index(['budget_augmentation_id']);
            $table->index(['expense_class_id', 'expense_type_id', 'expense_item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('budget_augmentation_details');
    }
}; 
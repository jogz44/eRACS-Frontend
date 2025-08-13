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
            $table->unsignedBigInteger('from_expense_class_id')->nullable();
            $table->unsignedBigInteger('from_expense_type_id')->nullable();
            $table->unsignedBigInteger('from_expense_item_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->unsignedBigInteger('transfer_to_expense_class_id')->nullable();
            $table->unsignedBigInteger('transfer_to_expense_type_id')->nullable();
            $table->unsignedBigInteger('transfer_to_expense_item_id')->nullable();
            $table->text('particulars');
            $table->timestamps();

            $table->foreign('budget_augmentation_id')->references('id')->on('budget_augmentations')->onDelete('cascade');
            $table->foreign('from_expense_class_id')->references('id')->on('lib_expense_classes')->onDelete('no action');
            $table->foreign('from_expense_type_id')->references('id')->on('lib_expense_types')->onDelete('no action');
            $table->foreign('from_expense_item_id')->references('id')->on('lib_expense_items')->onDelete('no action');
            $table->foreign('transfer_to_expense_class_id')->references('id')->on('lib_expense_classes')->onDelete('no action');
            $table->foreign('transfer_to_expense_type_id')->references('id')->on('lib_expense_types')->onDelete('no action');
            $table->foreign('transfer_to_expense_item_id')->references('id')->on('lib_expense_items')->onDelete('no action');

            $table->index(['budget_augmentation_id']);
            $table->index(['from_expense_class_id', 'from_expense_type_id', 'from_expense_item_id']);
            $table->index(['transfer_to_expense_class_id', 'transfer_to_expense_type_id', 'transfer_to_expense_item_id']);
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
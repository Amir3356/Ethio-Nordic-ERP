<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employee_documents', function (Blueprint $table) {
            $table->id('document_id');
            $table->foreignId('employee_id')->constrained('employees', 'employee_id')->cascadeOnDelete();
            $table->string('document_type'); // employment_contract, id_copy, certification, license, other
            $table->string('document_name');
            $table->string('file_path')->nullable();
            $table->date('upload_date');
            $table->date('expiry_date')->nullable();
            $table->string('status')->default('active'); // active, expired, expiring_soon
            $table->string('access_level')->default('hr_manager'); // hr_manager, admin, management
            $table->integer('file_size_kb')->default(0);
            $table->timestamps();

            $table->index('status');
            $table->index('document_type');
            $table->index('expiry_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employee_documents');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('employees', function (Blueprint $table) {
            $table->id('employee_id');
            $table->string('employee_code')->unique();
            $table->string('first_name');
            $table->string('last_name');
            $table->string('email')->unique();
            $table->string('phone')->nullable();
            $table->string('department');
            $table->string('position');
            $table->foreignId('manager_id')->nullable()->constrained('employees', 'employee_id')->nullOnDelete();
            $table->date('hire_date');
            $table->string('contract_type'); // permanent, contract, temporary
            $table->string('employment_status')->default('active'); // active, on_leave, terminated
            $table->string('salary_grade')->nullable();
            $table->decimal('base_salary_etb', 12, 2)->default(0);
            $table->string('currency')->default('ETB');
            $table->string('location')->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('gender')->nullable();
            $table->string('marital_status')->nullable();
            $table->string('emergency_contact')->nullable();
            $table->string('emergency_phone')->nullable();
            $table->text('address')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('department');
            $table->index('employment_status');
            $table->index('employee_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};

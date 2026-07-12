<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Module 4, Step 1: a new employee record triggers a provisioning
 * request to the User & Access Management module.
 */
class EmployeeOnboarded
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $employeeId,
        public string $fullName,
        public string $email,
        public string $department,
    ) {
    }
}

<?php

namespace App\Events;

use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Module 4, Step 9: employee exit triggers an automatic deactivation
 * request to the User & Access Management module to revoke access.
 */
class EmployeeTerminated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public int $employeeId,
        public string $email,
        public ?string $reason,
    ) {
    }
}

<?php

use Illuminate\Support\Facades\Schedule;

// Module 2 (Inventory Management) — Scheduler layer.
// Step 3: reorder level monitoring; Step 4: daily expiry monitoring (FEFO).
Schedule::command('inventory:monitor-reorder-levels')->hourly();
Schedule::command('inventory:monitor-batch-expiry')->dailyAt('06:00');

// Module 3 (Finance & Accounting) — Step 8: monthly depreciation posting;
// Step 5: daily overdue AR reminder run.
Schedule::command('finance:post-depreciation')->monthlyOn(1, '05:00');
Schedule::command('finance:ar-overdue-reminders')->dailyAt('08:00');

// Module 1 (User & Access Management) — Step 8: quarterly access review.
Schedule::command('access:generate-review')->quarterly();

// Module 4 (Human Resource Management) — Workflow Engine triggers.
// Step 6: semi-annual performance review cycles; Step 7: certification renewal reminders.
Schedule::command('hr:trigger-review-cycle')->cron('0 6 1 1,7 *');
Schedule::command('hr:certification-reminders')->dailyAt('07:00');

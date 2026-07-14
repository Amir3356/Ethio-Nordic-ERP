<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::unprepared("
            DROP TRIGGER IF EXISTS audit_logs_prevent_delete ON audit_logs;
        ");

        // Remove entries created by the initial database seeders (default
        // Permissions, Roles, and the bootstrap Admin user) — these are
        // setup/demo data, not real user activity.
        DB::table('audit_logs')
            ->where('email', 'system')
            ->whereIn('model_type', [
                'App\\Models\\Permission',
                'App\\Models\\Role',
                'App\\Models\\User',
            ])
            ->where('action', 'create')
            ->delete();

        DB::unprepared("
            CREATE TRIGGER audit_logs_prevent_delete
                BEFORE DELETE ON audit_logs
                FOR EACH ROW
                EXECUTE FUNCTION prevent_audit_logs_delete();
        ");
    }

    public function down(): void
    {
        // Deleted seed-noise rows are not restorable.
    }
};

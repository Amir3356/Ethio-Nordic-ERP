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

        DB::table('audit_logs')
            ->where('model_type', 'App\\Models\\RefreshToken')
            ->delete();

        DB::table('audit_logs')
            ->where('model_type', 'App\\Models\\TwoFactorSecret')
            ->delete();

        // Remove User "update" entries that only bumped last_login_at (plus
        // the row's own updated_at) — these are login-noise, not real edits.
        DB::table('audit_logs')
            ->where('model_type', 'App\\Models\\User')
            ->where('action', 'update')
            ->whereRaw("(after_data::jsonb - 'last_login_at' - 'updated_at') = '{}'::jsonb")
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
        DB::unprepared("
            DROP TRIGGER IF EXISTS audit_logs_prevent_delete ON audit_logs;
        ");

        DB::unprepared("
            CREATE TRIGGER audit_logs_prevent_delete
                BEFORE DELETE ON audit_logs
                FOR EACH ROW
                EXECUTE FUNCTION prevent_audit_logs_delete();
        ");
    }
};

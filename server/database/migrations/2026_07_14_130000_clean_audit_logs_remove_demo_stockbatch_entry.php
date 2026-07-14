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

        // Remove the leftover demo StockBatch delete entry from early testing.
        DB::table('audit_logs')
            ->where('model_type', 'App\\Models\\StockBatch')
            ->where('model_id', 4)
            ->where('action', 'delete')
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
        // Deleted demo entry is not restorable.
    }
};

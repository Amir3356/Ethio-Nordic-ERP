<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Create a PL/pgSQL function that blocks any UPDATE on audit_logs
        DB::unprepared("
            CREATE OR REPLACE FUNCTION prevent_audit_logs_update()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'Audit logs are immutable and cannot be updated. Action: %, Table: %', TG_OP, TG_TABLE_NAME;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        ");

        // Create a PL/pgSQL function that blocks any DELETE on audit_logs
        DB::unprepared("
            CREATE OR REPLACE FUNCTION prevent_audit_logs_delete()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'Audit logs are immutable and cannot be deleted. Action: %, Table: %', TG_OP, TG_TABLE_NAME;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        ");

        // Create the UPDATE trigger
        DB::unprepared("
            CREATE TRIGGER audit_logs_prevent_update
                BEFORE UPDATE ON audit_logs
                FOR EACH ROW
                EXECUTE FUNCTION prevent_audit_logs_update();
        ");

        // Create the DELETE trigger
        DB::unprepared("
            CREATE TRIGGER audit_logs_prevent_delete
                BEFORE DELETE ON audit_logs
                FOR EACH ROW
                EXECUTE FUNCTION prevent_audit_logs_delete();
        ");

        // Revoke UPDATE and DELETE privileges from all roles to enforce at permission level
        DB::unprepared("
            REVOKE UPDATE, DELETE ON audit_logs FROM PUBLIC;
        ");
    }

    public function down(): void
    {
        DB::unprepared("DROP TRIGGER IF EXISTS audit_logs_prevent_update ON audit_logs;");
        DB::unprepared("DROP TRIGGER IF EXISTS audit_logs_prevent_delete ON audit_logs;");
        DB::unprepared("DROP FUNCTION IF EXISTS prevent_audit_logs_update();");
        DB::unprepared("DROP FUNCTION IF EXISTS prevent_audit_logs_delete();");

        // Restore permissions
        DB::unprepared("GRANT UPDATE, DELETE ON audit_logs TO PUBLIC;");
    }
};

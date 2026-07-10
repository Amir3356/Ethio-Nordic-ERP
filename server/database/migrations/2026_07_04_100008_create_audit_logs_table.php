<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('no action');
            $table->string('email')->nullable();
            $table->string('full_name')->nullable();
            $table->string('action');
            $table->string('module');
            $table->string('model_type');
            $table->unsignedBigInteger('model_id')->nullable();
            $table->json('before_data')->nullable();
            $table->json('after_data')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'created_at']);
            $table->index(['model_type', 'model_id']);
            $table->index('created_at');
        });

        DB::unprepared("
            CREATE OR REPLACE FUNCTION prevent_audit_logs_update()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'Audit logs are immutable and cannot be updated. Action: %, Table: %', TG_OP, TG_TABLE_NAME;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        ");

        DB::unprepared("
            CREATE OR REPLACE FUNCTION prevent_audit_logs_delete()
            RETURNS TRIGGER AS $$
            BEGIN
                RAISE EXCEPTION 'Audit logs are immutable and cannot be deleted. Action: %, Table: %', TG_OP, TG_TABLE_NAME;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        ");

        DB::unprepared("
            CREATE TRIGGER audit_logs_prevent_update
                BEFORE UPDATE ON audit_logs
                FOR EACH ROW
                EXECUTE FUNCTION prevent_audit_logs_update();
        ");

        DB::unprepared("
            CREATE TRIGGER audit_logs_prevent_delete
                BEFORE DELETE ON audit_logs
                FOR EACH ROW
                EXECUTE FUNCTION prevent_audit_logs_delete();
        ");

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

        DB::unprepared("GRANT UPDATE, DELETE ON audit_logs TO PUBLIC;");

        Schema::dropIfExists('audit_logs');
    }
};

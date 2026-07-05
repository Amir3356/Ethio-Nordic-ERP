<?php

namespace App\Console\Commands;

use App\Mail\UserActivationMail;
use App\Models\User;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

#[Signature('test:email {email : Email address to send test email to}')]
#[Description('Test Gmail SMTP email configuration')]
class TestEmailCommand extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        
        $this->info('Testing Gmail SMTP configuration...');
        $this->info('Sending test email to: ' . $email);

        try {
            // Create a dummy user for testing
            $testUser = new User([
                'full_name' => 'Test User',
                'email' => $email,
                'department' => 'IT',
            ]);

            $tempPassword = 'TestPassword123!';
            $activationUrl = 'https://example.com/activate';

            Mail::to($email)->send(
                new UserActivationMail($testUser, $tempPassword, $activationUrl)
            );

            $this->info('✅ Email sent successfully!');
            $this->info('📧 Check your inbox at: ' . $email);
            $this->info('📝 Temporary password: ' . $tempPassword);
            
            return Command::SUCCESS;
            
        } catch (\Exception $e) {
            $this->error('❌ Failed to send email');
            $this->error('Error: ' . $e->getMessage());
            
            if ($this->option('verbose')) {
                $this->error($e->getTraceAsString());
            }
            
            // Show SMTP configuration for debugging
            $this->warn('Current SMTP Configuration:');
            $this->table([
                'Setting', 'Value'
            ], [
                ['MAIL_MAILER', config('mail.default')],
                ['MAIL_HOST', config('mail.mailers.smtp.host')],
                ['MAIL_PORT', config('mail.mailers.smtp.port')],
                ['MAIL_USERNAME', config('mail.mailers.smtp.username')],
                ['MAIL_ENCRYPTION', config('mail.mailers.smtp.encryption')],
                ['MAIL_FROM_ADDRESS', config('mail.from.address')],
                ['MAIL_FROM_NAME', config('mail.from.name')],
            ]);
            
            return Command::FAILURE;
        }
    }
}

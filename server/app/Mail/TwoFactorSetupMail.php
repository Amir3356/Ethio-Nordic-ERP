<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TwoFactorSetupMail extends Mailable
{
    use Queueable, SerializesModels;

    public $user;
    public $qrCodeUrl;
    public $manualEntryCode;
    public $recoveryCodes;

    /**
     * Create a new message instance.
     */
    public function __construct(User $user, string $qrCodeUrl, string $manualEntryCode, array $recoveryCodes)
    {
        $this->user = $user;
        $this->qrCodeUrl = $qrCodeUrl;
        $this->manualEntryCode = $manualEntryCode;
        $this->recoveryCodes = $recoveryCodes;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Two-Factor Authentication Setup - Ethio Nordic ERP',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.two-factor-setup',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}

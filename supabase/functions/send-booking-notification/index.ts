// @ts-nocheck
/**
 * Supabase Edge Function: send-booking-notification
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * GoF Pattern: OBSERVER (behavioural)
 * ─────────────────────────────────────────────────────────────────────────
 * This function is the "subscriber" in the Observer pattern.
 * The DB trigger (handle_booking_status_change) is the "subject" — it inserts
 * rows into the notifications table when booking state changes.
 *
 * This function is called by a Supabase Database Webhook pointing at the
 * notifications table (INSERT events). It:
 *   1. Reads the notification + related booking details
 *   2. Renders the correct email template for the event type
 *   3. Sends via Resend (free tier: 3,000 emails/month — ample for a charity)
 *   4. Updates notifications.sent_at to mark delivery
 *
 * Why Resend over SendGrid / Mailgun?
 *   - Free tier is genuinely generous (3k/month)
 *   - Simple REST API — no SDK needed in an Edge Function
 *   - Excellent deliverability for transactional email
 *
 * Decoupling benefit: the booking table and booking repository have zero
 * knowledge of email. Adding SMS later only requires a second observer
 * function — no changes to booking logic.
 *
 * Deploy: supabase functions deploy send-booking-notification
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotificationPayload {
  type: 'INSERT';
  table: 'notifications';
  record: {
    id: string;
    booking_id: string;
    type: string;
    recipient_email: string;
    sent_at: string | null;
  };
}

interface BookingWithRoom {
  id: string;
  booker_name: string;
  booker_email: string;
  room: { name: string };
  start_time: string;
  end_time: string;
  purpose: string;
  status: string;
  deposit_amount_pence: number;
  admin_notes: string | null;
}

// ---------------------------------------------------------------------------
// Email templates — pure functions, easily testable
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'Europe/London',
  });
}

function formatPrice(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`;
}

type EmailContent = { subject: string; html: string };

function renderTemplate(type: string, booking: BookingWithRoom): EmailContent {
  const details = `
    <p><strong>Room:</strong> ${booking.room.name}</p>
    <p><strong>Start:</strong> ${formatDate(booking.start_time)}</p>
    <p><strong>End:</strong> ${formatDate(booking.end_time)}</p>
    <p><strong>Purpose:</strong> ${booking.purpose}</p>
    <p><strong>Deposit:</strong> ${formatPrice(booking.deposit_amount_pence)}</p>
  `;

  const templates: Record<string, EmailContent> = {
    booking_received: {
      subject: `Booking Request Received — ${booking.room.name}`,
      html: `
        <h2>Thank you, ${booking.booker_name}!</h2>
        <p>We've received your booking request for Wincobank Chapel.
           Our team will review it and get back to you within 2 working days.</p>
        ${details}
        <p>If you have any questions, please reply to this email.</p>
        <p>— The Wincobank Chapel Team</p>
      `,
    },
    booking_approved: {
      subject: `Booking Confirmed — ${booking.room.name}`,
      html: `
        <h2>Great news, ${booking.booker_name}!</h2>
        <p>Your booking has been <strong>approved</strong>.</p>
        ${details}
        ${booking.admin_notes ? `<p><strong>Note from our team:</strong> ${booking.admin_notes}</p>` : ''}
        <p>Please ensure the deposit of ${formatPrice(booking.deposit_amount_pence)} is paid before your booking date.</p>
        <p>— The Wincobank Chapel Team</p>
      `,
    },
    booking_rejected: {
      subject: `Booking Update — ${booking.room.name}`,
      html: `
        <h2>Hello ${booking.booker_name},</h2>
        <p>Unfortunately we're unable to approve your booking request at this time.</p>
        ${details}
        ${booking.admin_notes ? `<p><strong>Reason:</strong> ${booking.admin_notes}</p>` : ''}
        <p>Please <a href="https://wincobankchapel.org/rooms">visit our rooms page</a>
           to check availability or contact us to discuss alternative dates.</p>
        <p>— The Wincobank Chapel Team</p>
      `,
    },
    booking_cancelled: {
      subject: `Booking Cancelled — ${booking.room.name}`,
      html: `
        <h2>Hello ${booking.booker_name},</h2>
        <p>Your booking for <strong>${booking.room.name}</strong> on
           ${formatDate(booking.start_time)} has been cancelled.</p>
        ${booking.admin_notes ? `<p><strong>Note:</strong> ${booking.admin_notes}</p>` : ''}
        <p>If this was unexpected, please contact us directly.</p>
        <p>— The Wincobank Chapel Team</p>
      `,
    },
  };

  return templates[type] ?? {
    subject: 'Booking Update — Wincobank Chapel',
    html: `<p>There has been an update to your booking. Please log in to view details.</p>`,
  };
}

// ---------------------------------------------------------------------------
// Also notify admins of new bookings (Observer: second subscriber)
// ---------------------------------------------------------------------------

async function notifyAdmins(booking: BookingWithRoom, resendApiKey: string): Promise<void> {
  const adminEmail = Deno.env.get('ADMIN_EMAIL') ?? 'admin@wincobankchapel.org';

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Wincobank Chapel <noreply@wincobankchapel.org>',
      to: adminEmail,
      subject: `[Action Required] New Booking Request — ${booking.room.name}`,
      html: `
        <h2>New booking request received</h2>
        <p><strong>From:</strong> ${booking.booker_name} (${booking.booker_email})</p>
        <p><strong>Room:</strong> ${booking.room.name}</p>
        <p><strong>Start:</strong> ${formatDate(booking.start_time)}</p>
        <p><strong>End:</strong> ${formatDate(booking.end_time)}</p>
        <p><strong>Purpose:</strong> ${booking.purpose}</p>
        <p>
          <a href="${Deno.env.get('SITE_URL')}/admin/bookings/${booking.id}">
            Review this booking →
          </a>
        </p>
      `,
    }),
  });
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req: Request) => {
  try {
    const payload: NotificationPayload = await req.json();
    const notification = payload.record;

    // Skip if already sent (idempotency — webhook may retry)
    if (notification.sent_at) {
      return new Response(JSON.stringify({ skipped: 'already_sent' }), { status: 200 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // Service role bypasses RLS for internal function
    );

    // Fetch booking + room details
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*, room:rooms(name)')
      .eq('id', notification.booking_id)
      .single();

    if (error || !booking) {
      console.error('Failed to fetch booking:', error);
      return new Response(JSON.stringify({ error: 'booking_not_found' }), { status: 404 });
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
    const template = renderTemplate(notification.type, booking as BookingWithRoom);

    // Send email to booker
    const emailRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Wincobank Chapel <noreply@wincobankchapel.org>',
        to: notification.recipient_email,
        subject: template.subject,
        html: template.html,
      }),
    });

    if (!emailRes.ok) {
      const err = await emailRes.text();
      throw new Error(`Resend API error: ${err}`);
    }

    // Also notify admin dashboard on new bookings
    if (notification.type === 'booking_received') {
      await notifyAdmins(booking as BookingWithRoom, resendApiKey);
    }

    // Mark notification as sent
    await supabase
      .from('notifications')
      .update({ sent_at: new Date().toISOString() })
      .eq('id', notification.id);

    return new Response(JSON.stringify({ sent: true }), { status: 200 });

  } catch (err) {
    console.error('send-booking-notification error:', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
/**
 * API Route: POST /api/contact
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Handles contact form submissions.
 * 1. Stores the message in the 'contact_messages' table (durable record).
 * 2. Sends a notification email to the chapel via Resend, with the sender's
 *    address as reply-to so volunteers can reply directly.
 *
 * The DB write is the source of truth: if the email fails to send, the
 * submission is still saved and we return success. If the DB write fails,
 * we return an error so the visitor knows to try again.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function sendNotificationEmail(fields: {
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
}): Promise<void> {
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.warn('RESEND_API_KEY not set — skipping contact notification email');
    return;
  }

  const to = process.env.CONTACT_EMAIL ?? 'enquiries@wincobankchapel.org';

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Wincobank Chapel <noreply@wincobankchapel.org>',
      to,
      reply_to: fields.email,
      subject: `[Website Contact] ${fields.subject}`,
      html: `
        <h2>New contact form message</h2>
        <p><strong>Name:</strong> ${escapeHtml(fields.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(fields.email)}</p>
        ${fields.phone ? `<p><strong>Phone:</strong> ${escapeHtml(fields.phone)}</p>` : ''}
        <p><strong>Subject:</strong> ${escapeHtml(fields.subject)}</p>
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-wrap;">${escapeHtml(fields.message)}</p>
      `,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error: ${err}`);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Basic validation
    const { name, email, subject, message } = body;
    if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Please fill in all required fields.' },
        { status: 400 }
      );
    }

    if (!email.includes('@')) {
      return NextResponse.json(
        { error: 'Please enter a valid email address.' },
        { status: 400 }
      );
    }

    // Store in Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const cleaned = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
    };

    const { error } = await supabase.from('contact_messages').insert(cleaned);

    if (error) {
      console.error('Failed to store contact message:', error);
      // Don't expose DB errors to the client
      return NextResponse.json(
        { error: 'Unable to send your message. Please try again or call us on 07980 143776.' },
        { status: 500 }
      );
    }

    // Message is safely stored. Attempt to notify the chapel by email, but
    // don't fail the request if the email send fails — the record is saved.
    try {
      await sendNotificationEmail(cleaned);
    } catch (emailErr) {
      console.error('Contact notification email failed (message still saved):', emailErr);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('POST /api/contact error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

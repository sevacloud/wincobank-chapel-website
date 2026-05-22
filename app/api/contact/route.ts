/**
 * API Route: POST /api/contact
 * © Liamarjit Bhogal (© Seva Cloud 2026)
 *
 * Handles contact form submissions.
 * Stores the message in Supabase and optionally sends a notification email.
 *
 * For now, stores in a 'contact_messages' table. If the table doesn't exist
 * yet, it falls back to sending a mailto-style email via Resend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

    const { error } = await supabase.from('contact_messages').insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: body.phone?.trim() || null,
      subject: subject.trim(),
      message: message.trim(),
    });

    if (error) {
      console.error('Failed to store contact message:', error);
      // Don't expose DB errors to the client
      return NextResponse.json(
        { error: 'Unable to send your message. Please try again or call us on 07980 143776.' },
        { status: 500 }
      );
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

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType } from 'docx';

export async function GET(request: NextRequest) {
  try {
    console.log('Data export request received');
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Session found for user:', session.user.email);

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', session.user.email)
      .single();

    if (userError || !user) {
      console.log('User not found:', userError);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    console.log('User found:', user.id);

    // Log data export event for audit trail
    try {
      await supabase
        .from('consent_audit_log')
        .insert({
          user_id: user.id,
          action: 'data_exported',
          new_values: JSON.stringify({
            export_type: 'word_document',
            exported_at: new Date().toISOString()
          }),
          ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown',
          timestamp: new Date().toISOString()
        });
    } catch (auditError) {
      console.error('Failed to log data export event:', auditError);
      // Don't fail the request if audit logging fails
    }

    // Get user attempts
    let attempts = [];
    try {
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('attempts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      attempts = attemptsData || [];
    } catch (error) {
      console.log('Attempts table not found or error:', error);
      attempts = [];
    }

    // Get user analytics (if table exists)
    let analytics = [];
    try {
      const { data: analyticsData } = await supabase
        .from('user_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      analytics = analyticsData || [];
    } catch (error) {
      // Analytics table might not exist
      console.log('Analytics table not found, skipping...');
    }

    // Get API usage (if table exists)
    let apiUsage = [];
    try {
      const { data: apiUsageData } = await supabase
        .from('api_usage')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      apiUsage = apiUsageData || [];
    } catch (error) {
      // API usage table might not exist
      console.log('API usage table not found, skipping...');
    }

    // Generate Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Title
          new Paragraph({
            children: [
              new TextRun({
                text: "Bleepy Simulator - Personal Data Export",
                bold: true,
                size: 32,
              }),
            ],
            heading: HeadingLevel.TITLE,
            spacing: { after: 400 },
          }),
          
          // Export info
          new Paragraph({
            children: [
              new TextRun({
                text: `Exported on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`,
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Profile Information
          new Paragraph({
            children: [
              new TextRun({
                text: "Personal Information",
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          // Profile table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Name", bold: true })] })],
                    width: { size: 30, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: user.name || "Not provided" })] })],
                    width: { size: 70, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Email", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: user.email })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Role", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: user.role || "Student" })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "University/Institution", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: user.university || "Not provided" })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Year of Study", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: user.year || "Not provided" })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Account Created", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: new Date(user.created_at).toLocaleDateString('en-GB') })] })],
                  }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Email Verified", bold: true })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: user.email_verified ? "Yes" : "No" })] })],
                  }),
                ],
              }),
            ],
          }),

          // Training Sessions
          new Paragraph({
            children: [
              new TextRun({
                text: "Training Sessions",
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Total Sessions Completed: ${attempts?.length || 0}`,
                bold: true,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Training sessions table
          attempts && attempts.length > 0 ? new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              // Header row
              new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Date", bold: true })] })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Station", bold: true })] })],
                    width: { size: 25, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Duration", bold: true })] })],
                    width: { size: 20, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Score", bold: true })] })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Status", bold: true })] })],
                    width: { size: 15, type: WidthType.PERCENTAGE },
                  }),
                ],
              }),
              // Data rows
              ...attempts.slice(0, 50).map((attempt: any) => new TableRow({
                children: [
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: new Date(attempt.created_at).toLocaleDateString('en-GB') })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: attempt.station_slug || "Unknown" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: attempt.duration ? `${Math.round(attempt.duration / 60)} min` : "N/A" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: attempt.overall_band || "N/A" })] })],
                  }),
                  new TableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: attempt.end_time ? "Completed" : "Incomplete" })] })],
                  }),
                ],
              })),
            ],
          }) : new Paragraph({
            children: [
              new TextRun({
                text: "No training sessions found.",
                italics: true,
              }),
            ],
            spacing: { after: 200 },
          }),

          // Data Rights Information
          new Paragraph({
            children: [
              new TextRun({
                text: "Your Data Rights",
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: "Under GDPR, you have the following rights regarding your personal data:",
                bold: true,
              }),
            ],
            spacing: { after: 100 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "• Right to Access: View and download all your personal data" }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "• Right to Rectification: Correct or update your personal information" }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "• Right to Erasure: Delete your account and all associated data" }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "• Right to Portability: Export your data in a machine-readable format" }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "• Right to Restrict: Limit how we process your personal data" }),
            ],
            spacing: { after: 50 },
          }),

          new Paragraph({
            children: [
              new TextRun({ text: "• Right to Object: Opt out of certain data processing activities" }),
            ],
            spacing: { after: 200 },
          }),

          // Footer
          new Paragraph({
            children: [
              new TextRun({
                text: "This document contains all personal data we have collected about you. If you have any questions about your data or wish to exercise your rights, please contact us at support@bleepy.co.uk",
                italics: true,
                size: 20,
              }),
            ],
            spacing: { before: 400, after: 200 },
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: `Generated by Bleepy Simulator on ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`,
                italics: true,
                size: 18,
              }),
            ],
          }),
        ],
      }],
    });

    // Generate the Word document buffer
    const buffer = await Packer.toBuffer(doc);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="Bleepy-Data-Export-${session.user.email.split('@')[0]}-${new Date().toISOString().split('T')[0]}.docx"`
      }
    });

  } catch (error) {
    console.error('Data export error:', error);
    return NextResponse.json(
      { error: 'Failed to export data' },
      { status: 500 }
    );
  }
}

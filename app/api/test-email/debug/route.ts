import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Email validation function
const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email.trim());
};

// Check email format issues
function checkEmailFormat(email: string) {
  const issues: string[] = [];
  
  if (!email) {
    issues.push('Email is empty');
    return { valid: false, issues };
  }
  
  if (!isValidEmail(email)) {
    issues.push('Invalid email format');
  }
  
  // Check for common issues
  if (email.includes('..')) {
    issues.push('Email contains consecutive dots');
  }
  
  if (email.startsWith('.') || email.endsWith('.')) {
    issues.push('Email starts or ends with a dot');
  }
  
  const [localPart, domain] = email.split('@');
  if (localPart && localPart.length > 64) {
    issues.push('Local part is too long (>64 characters)');
  }
  
  if (domain && domain.length > 253) {
    issues.push('Domain is too long (>253 characters)');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    localPart,
    domain
  };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(email => email.trim()) || [];
    const isAdmin = adminEmails.includes(session.user.email.trim());
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { email, testType = 'validation' } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const results: any = {
      email,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    // Email format validation
    const formatCheck = checkEmailFormat(email);
    results.tests.formatValidation = formatCheck;

    // Environment check
    results.tests.environment = {
      smtpUser: !!process.env.SMTP_USER,
      azureClientId: !!process.env.AZURE_CLIENT_ID,
      azureClientSecret: !!process.env.AZURE_CLIENT_SECRET,
      azureTenantId: !!process.env.AZURE_TENANT_ID,
      allConfigured: !!(
        process.env.SMTP_USER &&
        process.env.AZURE_CLIENT_ID &&
        process.env.AZURE_CLIENT_SECRET &&
        process.env.AZURE_TENANT_ID
      )
    };

    // If requested, test actual email sending
    if (testType === 'send' && formatCheck.valid) {
      try {
        const { sendAccountApprovalEmail } = await import('@/lib/email');
        
        const startTime = Date.now();
        await sendAccountApprovalEmail({
          email: email,
          name: 'Test User'
        });
        const endTime = Date.now();
        
        results.tests.emailSend = {
          success: true,
          duration: `${endTime - startTime}ms`,
          message: 'Email sent successfully'
        };
      } catch (error: any) {
        results.tests.emailSend = {
          success: false,
          error: error.message,
          stack: error.stack
        };
      }
    }

    // Common issues analysis
    results.analysis = {
      commonIssues: [],
      recommendations: []
    };

    if (!formatCheck.valid) {
      results.analysis.commonIssues.push('Invalid email format');
      results.analysis.recommendations.push('Verify email address format');
    }

    if (email.includes('ucl.ac.uk')) {
      results.analysis.commonIssues.push('University email domain - may have strict filtering');
      results.analysis.recommendations.push('Check if recipient domain blocks external emails');
    }

    if (!results.tests.environment.allConfigured) {
      results.analysis.commonIssues.push('Missing Azure configuration');
      results.analysis.recommendations.push('Check environment variables');
    }

    return NextResponse.json(results);

  } catch (error: any) {
    console.error('Email debug error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}


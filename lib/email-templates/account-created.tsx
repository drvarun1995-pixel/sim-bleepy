import React from 'react'

interface AccountCreatedEmailProps {
  name: string
  email: string
  role: string
  password: string
  loginUrl: string
}

export const AccountCreatedEmail: React.FC<AccountCreatedEmailProps> = ({
  name,
  email,
  role,
  password,
  loginUrl
}) => {
  return (
    <div style={{ 
      fontFamily: 'Arial, sans-serif', 
      maxWidth: '600px', 
      margin: '0 auto',
      backgroundColor: '#ffffff'
    }}>
      {/* Header with enhanced design */}
      <div style={{
        background: 'linear-gradient(135deg, #1a365d 0%, #2d5a87 50%, #1a365d 100%)',
        padding: '40px 20px',
        textAlign: 'center',
        borderRadius: '12px 12px 0 0',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Background decorative elements */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '50%',
          opacity: '0.3'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: '50%',
          opacity: '0.4'
        }}></div>
        
        {/* Logo */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          width: '100px',
          height: '100px',
          margin: '0 auto 25px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: '1'
        }}>
          <div style={{
            fontSize: '36px',
            fontWeight: 'bold',
            color: '#1a365d',
            lineHeight: '1',
            textShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>SB</div>
        </div>
        
        <h1 style={{ 
          color: '#ffffff', 
          margin: '0 0 15px 0', 
          fontSize: '32px',
          fontWeight: '800',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
          position: 'relative',
          zIndex: '1'
        }}>
          Welcome to Bleepy!
        </h1>
        <p style={{ 
          color: '#e2e8f0', 
          margin: '0', 
          fontSize: '18px',
          fontWeight: '500',
          textShadow: '0 1px 2px rgba(0,0,0,0.2)',
          position: 'relative',
          zIndex: '1'
        }}>
          Your account has been created
        </p>
      </div>

      {/* Main content */}
      <div style={{ 
        padding: '40px 30px',
        backgroundColor: '#ffffff',
        borderRadius: '0 0 8px 8px',
        border: '1px solid #e5e7eb'
      }}>
        <h2 style={{ 
          color: '#1f2937', 
          fontSize: '24px', 
          marginBottom: '20px',
          fontWeight: '600'
        }}>
          Hello {name}!
        </h2>

        <p style={{ 
          color: '#374151', 
          fontSize: '16px', 
          lineHeight: '1.6',
          marginBottom: '20px'
        }}>
          Your Bleepy account has been successfully created by an administrator. 
          You now have access to our comprehensive medical education platform.
        </p>

        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '30px', 
          borderRadius: '16px',
          marginBottom: '30px',
          border: '3px solid #1a365d',
          position: 'relative',
          boxShadow: '0 4px 12px rgba(26, 54, 93, 0.1)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-15px',
            left: '30px',
            backgroundColor: '#1a365d',
            color: '#ffffff',
            padding: '8px 20px',
            borderRadius: '25px',
            fontSize: '16px',
            fontWeight: '700',
            boxShadow: '0 4px 8px rgba(26, 54, 93, 0.3)'
          }}>
            🔐 Your Login Credentials
          </div>
          
          <div style={{ marginTop: '20px' }}>
            {/* Email Row */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <span style={{ 
                fontWeight: '700', 
                color: '#1a365d',
                fontSize: '16px'
              }}>📧 Email:</span>
              <span style={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#1a365d',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                boxShadow: '0 2px 4px rgba(26, 54, 93, 0.2)'
              }}>{email}</span>
            </div>
            
            {/* Password Row */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '20px',
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <span style={{ 
                fontWeight: '700', 
                color: '#1a365d',
                fontSize: '16px'
              }}>🔑 Password:</span>
              <span style={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#dc2626',
                color: '#ffffff',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '700',
                boxShadow: '0 2px 4px rgba(220, 38, 38, 0.3)',
                border: '2px solid #b91c1c'
              }}>{password}</span>
            </div>
            
            {/* Role Row */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '16px 20px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '2px solid #e2e8f0',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <span style={{ 
                fontWeight: '700', 
                color: '#1a365d',
                fontSize: '16px'
              }}>👤 Role:</span>
              <span style={{ 
                backgroundColor: '#059669',
                color: '#ffffff',
                padding: '8px 16px',
                borderRadius: '25px',
                fontSize: '15px',
                fontWeight: '700',
                textTransform: 'capitalize',
                boxShadow: '0 2px 4px rgba(5, 150, 105, 0.3)',
                border: '2px solid #047857'
              }}>{role}</span>
            </div>
          </div>
        </div>

        <p style={{ 
          color: '#374151', 
          fontSize: '16px', 
          lineHeight: '1.6',
          marginBottom: '25px'
        }}>
          You can now login using the credentials above. After your first login, you'll be required to change your password for security.
        </p>

        <div style={{ textAlign: 'center', marginBottom: '35px' }}>
          <a 
            href={loginUrl}
            style={{
              display: 'inline-block',
              background: 'linear-gradient(135deg, #1a365d 0%, #2d5a87 100%)',
              color: '#ffffff',
              padding: '18px 40px',
              textDecoration: 'none',
              borderRadius: '12px',
              fontSize: '18px',
              fontWeight: '700',
              boxShadow: '0 6px 20px rgba(26, 54, 93, 0.3)',
              border: '2px solid #1a365d',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)'
            }}
          >
            🚀 Login to Bleepy
          </a>
        </div>

        <div style={{
          backgroundColor: '#fef3c7',
          border: '3px solid #f59e0b',
          borderRadius: '12px',
          padding: '25px',
          marginBottom: '30px',
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '15px' 
          }}>
            <span style={{ 
              fontSize: '24px', 
              marginRight: '12px' 
            }}>⚠️</span>
            <strong style={{ 
              color: '#92400e',
              fontSize: '18px',
              fontWeight: '800'
            }}>Important Security Notice</strong>
          </div>
          <p style={{ 
            margin: '0', 
            color: '#92400e',
            fontSize: '16px',
            fontWeight: '500',
            lineHeight: '1.5'
          }}>You <strong style={{ color: '#b45309' }}>must change your password</strong> on your first login for security reasons. The system will automatically redirect you to a password change page.</p>
        </div>

        <h3 style={{ 
          color: '#1f2937', 
          fontSize: '18px', 
          marginBottom: '15px',
          fontWeight: '600'
        }}>
          What's Next?
        </h3>

        <ul style={{ 
          color: '#374151', 
          fontSize: '14px', 
          lineHeight: '1.6',
          marginBottom: '25px',
          paddingLeft: '20px'
        }}>
          <li>Complete your account setup by setting a password</li>
          <li>Explore the platform and familiarize yourself with the features</li>
          <li>Access teaching events, resources, and portfolio management tools</li>
          <li>Join the community of medical professionals using Bleepy</li>
        </ul>

        <p style={{ 
          color: '#6b7280', 
          fontSize: '14px', 
          lineHeight: '1.6',
          marginBottom: '0'
        }}>
          If you have any questions or need assistance, please don't hesitate to contact our support team.
        </p>
      </div>

      {/* Footer */}
      <div style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
        padding: '25px', 
        textAlign: 'center',
        borderTop: '3px solid #1a365d',
        borderRadius: '0 0 12px 12px'
      }}>
        <p style={{ 
          color: '#1a365d', 
          fontSize: '14px', 
          margin: '0 0 15px 0',
          fontWeight: '600'
        }}>
          This email was sent because an administrator created an account for you on Bleepy.
        </p>
        
        {/* Contact Email */}
        <p style={{ 
          color: '#64748b', 
          fontSize: '13px', 
          margin: '0 0 15px 0',
          fontWeight: '500'
        }}>
          Need help? Contact us at{' '}
          <a 
            href="mailto:support@bleepy.co.uk" 
            style={{ 
              color: '#1a365d', 
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            support@bleepy.co.uk
          </a>
        </p>

        {/* Social Media Links */}
        <div style={{ 
          margin: '15px 0',
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <a 
            href="https://www.facebook.com/bleepyuk" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'flex',
              width: '32px',
              height: '32px',
              backgroundColor: '#1877f2',
              borderRadius: '6px',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none'
            }}
            aria-label="Follow us on Facebook"
          >
            <span style={{ color: '#ffffff', fontSize: '18px' }}>f</span>
          </a>
          <a 
            href="https://www.instagram.com/bleepyuk" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'flex',
              width: '32px',
              height: '32px',
              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              borderRadius: '6px',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none'
            }}
            aria-label="Follow us on Instagram"
          >
            <span style={{ color: '#ffffff', fontSize: '18px' }}>📷</span>
          </a>
          <a 
            href="https://x.com/bleepyuk" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'flex',
              width: '32px',
              height: '32px',
              backgroundColor: '#000000',
              borderRadius: '6px',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none'
            }}
            aria-label="Follow us on X (Twitter)"
          >
            <span style={{ color: '#ffffff', fontSize: '18px' }}>𝕏</span>
          </a>
          <a 
            href="https://www.linkedin.com/company/bleepyuk" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'flex',
              width: '32px',
              height: '32px',
              backgroundColor: '#0077b5',
              borderRadius: '6px',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none'
            }}
            aria-label="Follow us on LinkedIn"
          >
            <span style={{ color: '#ffffff', fontSize: '18px', fontWeight: 'bold' }}>in</span>
          </a>
          <a 
            href="https://www.youtube.com/@bleepyuk" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              display: 'flex',
              width: '32px',
              height: '32px',
              backgroundColor: '#ff0000',
              borderRadius: '6px',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none'
            }}
            aria-label="Follow us on YouTube"
          >
            <span style={{ color: '#ffffff', fontSize: '18px' }}>▶</span>
          </a>
        </div>

        <p style={{ 
          color: '#64748b', 
          fontSize: '12px', 
          margin: '15px 0 0 0',
          fontWeight: '500'
        }}>
          © 2025 Bleepy. All rights reserved.
        </p>
      </div>
    </div>
  )
}

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
      {/* Header with gradient background */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '30px 20px',
        textAlign: 'center',
        borderRadius: '8px 8px 0 0'
      }}>
        <img 
          src="https://sim.bleepy.co.uk/logo.png" 
          alt="Sim-Bleepy Logo" 
          style={{ 
            height: '60px', 
            width: 'auto',
            marginBottom: '10px'
          }}
        />
        <h1 style={{ 
          color: '#ffffff', 
          margin: '0', 
          fontSize: '28px',
          fontWeight: 'bold'
        }}>
          Welcome to Sim-Bleepy!
        </h1>
        <p style={{ 
          color: '#f0f0f0', 
          margin: '10px 0 0 0', 
          fontSize: '16px'
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
          Your Sim-Bleepy account has been successfully created by an administrator. 
          You now have access to our comprehensive medical education platform.
        </p>

        <div style={{ 
          backgroundColor: '#f8fafc', 
          padding: '25px', 
          borderRadius: '12px',
          marginBottom: '25px',
          border: '2px solid #e2e8f0',
          position: 'relative'
        }}>
          <div style={{
            position: 'absolute',
            top: '-12px',
            left: '25px',
            backgroundColor: '#1a365d',
            color: '#ffffff',
            padding: '6px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            🔐 Login Credentials
          </div>
          
          <div style={{ marginTop: '15px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '15px',
              padding: '12px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontWeight: '600', color: '#2d3748' }}>Email:</span>
              <span style={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#edf2f7',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '14px'
              }}>{email}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: '15px',
              padding: '12px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontWeight: '600', color: '#2d3748' }}>Password:</span>
              <span style={{ 
                fontFamily: 'monospace', 
                backgroundColor: '#fed7d7',
                color: '#c53030',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '14px',
                fontWeight: '600'
              }}>{password}</span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px',
              backgroundColor: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <span style={{ fontWeight: '600', color: '#2d3748' }}>Role:</span>
              <span style={{ 
                backgroundColor: '#bee3f8',
                color: '#2b6cb0',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '14px',
                fontWeight: '600',
                textTransform: 'capitalize'
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

        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <a 
            href={loginUrl}
            style={{
              display: 'inline-block',
              backgroundColor: '#667eea',
              color: '#ffffff',
              padding: '15px 30px',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            🚀 Login to Sim-Bleepy
          </a>
        </div>

        <div style={{
          backgroundColor: '#fff5f5',
          border: '1px solid #fed7d7',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '25px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            marginBottom: '10px' 
          }}>
            <span style={{ 
              fontSize: '20px', 
              marginRight: '10px' 
            }}>⚠️</span>
            <strong style={{ color: '#c53030' }}>Important Security Notice</strong>
          </div>
          <p style={{ 
            margin: '0', 
            color: '#744210',
            fontSize: '15px'
          }}>You <strong>must change your password</strong> on your first login for security reasons. The system will automatically redirect you to a password change page.</p>
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
          <li>Join the community of medical professionals using Sim-Bleepy</li>
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
        backgroundColor: '#f9fafb', 
        padding: '20px', 
        textAlign: 'center',
        borderTop: '1px solid #e5e7eb',
        borderRadius: '0 0 8px 8px'
      }}>
        <p style={{ 
          color: '#6b7280', 
          fontSize: '12px', 
          margin: '0 0 10px 0'
        }}>
          This email was sent because an administrator created an account for you on Sim-Bleepy.
        </p>
        <p style={{ 
          color: '#9ca3af', 
          fontSize: '11px', 
          margin: '0'
        }}>
          © 2025 Sim-Bleepy. All rights reserved.
        </p>
      </div>
    </div>
  )
}

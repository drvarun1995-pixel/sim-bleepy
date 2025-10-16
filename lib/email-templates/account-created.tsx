import React from 'react'

interface AccountCreatedEmailProps {
  name: string
  email: string
  role: string
  loginUrl: string
}

export const AccountCreatedEmail: React.FC<AccountCreatedEmailProps> = ({
  name,
  email,
  role,
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
          padding: '20px', 
          borderRadius: '8px',
          marginBottom: '25px',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ 
            color: '#1f2937', 
            fontSize: '18px', 
            marginBottom: '15px',
            fontWeight: '600'
          }}>
            Account Details:
          </h3>
          <ul style={{ 
            color: '#374151', 
            fontSize: '14px', 
            lineHeight: '1.6',
            margin: '0',
            paddingLeft: '20px'
          }}>
            <li><strong>Email:</strong> {email}</li>
            <li><strong>Role:</strong> {role.charAt(0).toUpperCase() + role.slice(1)}</li>
            <li><strong>Status:</strong> Account created, password setup required</li>
          </ul>
        </div>

        <p style={{ 
          color: '#374151', 
          fontSize: '16px', 
          lineHeight: '1.6',
          marginBottom: '25px'
        }}>
          To complete your account setup, you'll need to create a password and verify your email address. 
          Click the button below to get started:
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
            Complete Account Setup
          </a>
        </div>

        <div style={{ 
          backgroundColor: '#fef3c7', 
          border: '1px solid #f59e0b',
          padding: '15px', 
          borderRadius: '6px',
          marginBottom: '25px'
        }}>
          <p style={{ 
            color: '#92400e', 
            fontSize: '14px', 
            margin: '0',
            fontWeight: '500'
          }}>
            <strong>Important:</strong> You'll need to use the "Forgot Password" option on the login page 
            to set your password since this is a new account.
          </p>
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

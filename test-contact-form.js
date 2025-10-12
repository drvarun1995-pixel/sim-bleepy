// Test script to debug contact form submission
const testContactForm = async () => {
  try {
    console.log('Testing contact form submission...')
    
    const testData = {
      name: 'Test User',
      email: 'test@example.com',
      subject: 'Test Subject',
      category: 'general',
      message: 'This is a test message to verify the contact form is working correctly.'
    }
    
    console.log('Sending data:', testData)
    
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData),
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const result = await response.json()
    console.log('Response body:', result)
    
    if (response.ok) {
      console.log('✅ Contact form submission successful!')
    } else {
      console.log('❌ Contact form submission failed:', result.error)
    }
    
  } catch (error) {
    console.error('❌ Error testing contact form:', error)
  }
}

// Run the test
testContactForm()

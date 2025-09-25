// Simple test script to check the users API
const testUsersAPI = async () => {
  try {
    const response = await fetch('http://localhost:3002/api/admin/users', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    console.log('API Response:', data);
    console.log('Status:', response.status);
    
    if (data.users) {
      console.log('Found users:', data.users.length);
      data.users.forEach((user, index) => {
        console.log(`User ${index + 1}:`, {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          totalAttempts: user.totalAttempts
        });
      });
    }
  } catch (error) {
    console.error('Error testing API:', error);
  }
};

testUsersAPI();

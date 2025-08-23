// Simple test script to verify API connectivity
const testAPI = async () => {
  try {
    // Test health endpoint
    console.log('Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3002/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test registration
    console.log('\nTesting user registration...');
    const registerResponse = await fetch('http://localhost:3002/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'testpass123'
      })
    });
    
    const registerData = await registerResponse.json();
    console.log('✅ Registration test:', registerData);

    if (registerData.status === 'success') {
      // Test login
      console.log('\nTesting user login...');
      const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUsername: 'test@example.com',
          password: 'testpass123'
        })
      });
      
      const loginData = await loginResponse.json();
      console.log('✅ Login test:', loginData);
    }

  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
};

testAPI();

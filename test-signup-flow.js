// Test the signup flow issue
const { default: fetch } = require('node-fetch');

const testSignupFlow = async () => {
  try {
    console.log('🔍 Testing Signup Flow Issue...\n');

    // Test health endpoint first
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3002/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test registration with different user
    const testUser = {
      username: 'newuser' + Date.now(),
      email: 'newuser' + Date.now() + '@example.com',
      password: 'password123'
    };

    console.log('\n2. Testing user registration...');
    console.log('Registering user:', { 
      username: testUser.username, 
      email: testUser.email,
      password: '***hidden***'
    });

    const registerResponse = await fetch('http://localhost:3002/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    console.log('Registration response status:', registerResponse.status);
    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);

    if (registerData.status === 'success') {
      console.log('✅ Registration successful!');
      console.log('Token received:', registerData.data?.token ? 'Yes' : 'No');
      console.log('User data:', registerData.data?.user);

      // Test automatic login after registration
      console.log('\n3. Testing immediate login with same credentials...');
      const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailOrUsername: testUser.email,
          password: testUser.password
        })
      });
      
      console.log('Login response status:', loginResponse.status);
      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);

      if (loginData.status === 'success') {
        console.log('✅ Login after registration successful!');
        console.log('Login token received:', loginData.data?.token ? 'Yes' : 'No');
      } else {
        console.log('❌ Login after registration failed!');
      }
    } else {
      console.log('❌ Registration failed!');
      console.log('Error:', registerData.message);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Full error:', error);
  }
};

testSignupFlow();

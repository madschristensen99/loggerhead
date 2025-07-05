const axios = require('axios');

async function testGetAllWallets() {
  try {
    console.log('Testing getAllWallets API...');
    
    const response = await axios.get('http://localhost:4000/api/wallets/all', {
      headers: {
        'x-api-key': 'loggerhead-internal-api-key'
      }
    });
    
    console.log('API Response:');
    console.log(JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('Error testing getAllWallets API:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// Execute the test if this file is run directly
if (require.main === module) {
  testGetAllWallets()
    .then(() => console.log('Test completed successfully'))
    .catch(err => console.error('Test failed:', err));
}

module.exports = { testGetAllWallets };

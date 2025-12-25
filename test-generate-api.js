// Test script to verify generate-stream API error handling
async function testGenerateAPI() {
  console.log('=== Testing generate-stream API ===\n');

  try {
    const response = await fetch('http://localhost:3000/api/generate-stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token',
      },
      body: JSON.stringify({
        prompt: 'Create a simple React component',
        model: 'deepseek-chat'
      })
    });

    console.log(`Response status: ${response.status}`);
    console.log(`Response ok: ${response.ok}`);

    if (!response.ok) {
      try {
        const errorData = await response.json();
        console.log('Error response:', errorData);
      } catch (e) {
        console.log('Could not parse error response as JSON');
        const text = await response.text();
        console.log('Raw error response:', text);
      }
    } else {
      console.log('Response was successful (unexpected for this test)');
    }
  } catch (error) {
    console.error('Network error:', error.message);
  }
}

testGenerateAPI();




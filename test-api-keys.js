// Test script to check API key configuration
console.log('=== API Key Configuration Test ===\n');

const requiredKeys = [
  { env: 'DEEPSEEK_API_KEY', provider: 'DeepSeek' },
  { env: 'GLM_API_KEY', provider: 'GLM (智谱)' },
  { env: 'OPENAI_API_KEY', provider: 'OpenAI' },
  { env: 'ANTHROPIC_API_KEY', provider: 'Anthropic' }
];

let allConfigured = true;

requiredKeys.forEach(({ env, provider }) => {
  const value = process.env[env];
  const isSet = value && value !== 'your_' + env.toLowerCase().replace('_api_key', '') + '_api_key_here';
  const status = isSet ? '✅ CONFIGURED' : '❌ NOT SET';

  console.log(`${provider}: ${status}`);
  if (!isSet) {
    allConfigured = false;
  }
});

console.log('\n=== Summary ===');
if (allConfigured) {
  console.log('✅ All API keys are properly configured!');
} else {
  console.log('❌ Some API keys are missing or using placeholder values.');
  console.log('Please configure the missing API keys in your environment variables.');
}






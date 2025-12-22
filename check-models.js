#!/usr/bin/env node

/**
 * 模型API密钥配置检查脚本
 */

const fs = require('fs');
const path = require('path');

// 手动加载 .env.local 文件
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env.local 文件不存在');
      return {};
    }

    const content = fs.readFileSync(envPath, 'utf8');
    const env = {};

    content.split('\n').forEach(line => {
      line = line.trim();
      if (line && !line.startsWith('#')) {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return env;
  } catch (error) {
    console.log('❌ 读取 .env.local 文件失败:', error.message);
    return {};
  }
}

const env = loadEnvFile();

console.log('🔍 模型API密钥配置检查');
console.log('=========================\n');

// 检查各个模型的API密钥
const modelConfigs = [
  {
    name: 'DeepSeek',
    envKey: 'DEEPSEEK_API_KEY',
    description: '基础模型，支持代码生成',
    required: true
  },
  {
    name: 'OpenAI',
    envKey: 'OPENAI_API_KEY',
    description: 'GPT-4 和 GPT-4 Turbo 模型',
    required: false
  },
  {
    name: 'Anthropic',
    envKey: 'ANTHROPIC_API_KEY',
    description: 'Claude 3 系列模型',
    required: false
  }
];

console.log('📋 API密钥状态:\n');

modelConfigs.forEach(config => {
  const value = env[config.envKey];
  const isSet = value && !value.includes('your_') && !value.includes('**') && value !== '';

  console.log(`${isSet ? '✅' : '❌'} ${config.name}: ${isSet ? '已配置' : '未配置'}`);
  console.log(`   变量名: ${config.envKey}`);
  console.log(`   说明: ${config.description}`);
  console.log(`   必需: ${config.required ? '是' : '否'}`);

  if (!isSet) {
    if (config.required) {
      console.log(`   ⚠️  必需配置，否则应用无法正常工作`);
    } else {
      console.log(`   ℹ️  可选配置，缺少此密钥将无法使用相应模型`);
    }
  }
  console.log('');
});

// 检查订阅等级对应的模型可用性
console.log('🎯 订阅等级与模型可用性:\n');

const tiers = {
  free: ['deepseek-chat'],
  basic: ['deepseek-chat', 'deepseek-coder'],
  pro: ['deepseek-chat', 'deepseek-coder', 'gpt-4', 'claude-3-sonnet'],
  premium: ['deepseek-chat', 'deepseek-coder', 'gpt-4', 'gpt-4-turbo', 'claude-3-opus', 'claude-3-sonnet']
};

Object.entries(tiers).forEach(([tier, models]) => {
  console.log(`📊 ${tier.toUpperCase()} 等级:`);
  models.forEach(model => {
    const provider = model.includes('gpt') ? 'OpenAI' :
                    model.includes('claude') ? 'Anthropic' : 'DeepSeek';
    const envKey = provider === 'OpenAI' ? 'OPENAI_API_KEY' :
                   provider === 'Anthropic' ? 'ANTHROPIC_API_KEY' : 'DEEPSEEK_API_KEY';
    const isAvailable = env[envKey] && !env[envKey].includes('your_') && !env[envKey].includes('**');

    console.log(`   ${isAvailable ? '✅' : '❌'} ${model} (${provider})`);
  });
  console.log('');
});

// 提供配置指导
console.log('🔧 配置指导:\n');

if (!env.DEEPSEEK_API_KEY || env.DEEPSEEK_API_KEY.includes('your_')) {
  console.log('1. 配置 DeepSeek API (必需):');
  console.log('   - 访问: https://platform.deepseek.com/');
  console.log('   - 注册账号并获取 API 密钥');
  console.log('   - 添加到 .env.local: DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxx');
  console.log('');
}

if (!env.OPENAI_API_KEY || env.OPENAI_API_KEY?.includes('your_')) {
  console.log('2. 配置 OpenAI API (可选，用于 GPT-4):');
  console.log('   - 访问: https://platform.openai.com/');
  console.log('   - 创建 API 密钥');
  console.log('   - 添加到 .env.local: OPENAI_API_KEY=sk-xxxxxxxxxxxxxx');
  console.log('');
}

if (!env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_KEY?.includes('your_')) {
  console.log('3. 配置 Anthropic API (可选，用于 Claude):');
  console.log('   - 访问: https://console.anthropic.com/');
  console.log('   - 创建 API 密钥');
  console.log('   - 添加到 .env.local: ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxx');
  console.log('');
}

console.log('💡 重启开发服务器后配置生效: npm run dev');













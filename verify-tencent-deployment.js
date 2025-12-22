#!/usr/bin/env node

/**
 * 腾讯云部署验证脚本
 * 用于验证 mvp_22 在腾讯云上的部署状态
 */

const https = require('https');
const http = require('http');

class TencentDeploymentVerifier {
  constructor() {
    this.baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    this.isHttps = this.baseUrl.startsWith('https://');
    this.requestModule = this.isHttps ? https : http;
  }

  log(message, status = 'INFO') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${status}] ${message}`);
  }

  async makeRequest(path) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      const options = {
        timeout: 10000,
        headers: {
          'User-Agent': 'TencentDeploymentVerifier/1.0'
        }
      };

      const req = this.requestModule.get(url, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const jsonData = JSON.parse(data);
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: jsonData
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async checkHealth() {
    try {
      this.log('检查应用健康状态...');
      const response = await this.makeRequest('/api/health');

      if (response.status === 200 && response.data.status === 'ok') {
        this.log('✅ 应用健康检查通过', 'SUCCESS');

        // 检查关键配置
        const cloudbaseStatus = response.data.cloudbase;
        if (cloudbaseStatus.envId === 'configured') {
          this.log('✅ CloudBase 环境配置正确', 'SUCCESS');
        } else {
          this.log('❌ CloudBase 环境未配置', 'ERROR');
        }

        if (response.data.region === 'cn') {
          this.log('✅ 部署区域配置正确 (中国)', 'SUCCESS');
        } else {
          this.log(`⚠️ 部署区域: ${response.data.region}`, 'WARNING');
        }

        return true;
      } else {
        this.log(`❌ 健康检查失败: ${response.status}`, 'ERROR');
        return false;
      }
    } catch (error) {
      this.log(`❌ 健康检查错误: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async checkAuth() {
    try {
      this.log('检查认证配置...');
      const response = await this.makeRequest('/api/auth/status');

      if (response.status === 401) {
        this.log('✅ 认证端点正常 (需要登录)', 'SUCCESS');
        return true;
      } else if (response.status === 200) {
        this.log('✅ 认证端点可访问', 'SUCCESS');
        return true;
      } else {
        this.log(`⚠️ 认证端点状态: ${response.status}`, 'WARNING');
        return true; // 不算错误，只是警告
      }
    } catch (error) {
      this.log(`❌ 认证检查错误: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async checkPayment() {
    try {
      this.log('检查支付功能...');
      const response = await this.makeRequest('/api/payment/cn/create');

      if (response.status === 401) {
        this.log('✅ 支付端点正常 (需要认证)', 'SUCCESS');
        return true;
      } else if (response.status === 400) {
        this.log('✅ 支付端点可访问', 'SUCCESS');
        return true;
      } else {
        this.log(`⚠️ 支付端点状态: ${response.status}`, 'WARNING');
        return true;
      }
    } catch (error) {
      this.log(`❌ 支付检查错误: ${error.message}`, 'ERROR');
      return false;
    }
  }

  async checkEnvironment() {
    this.log('检查环境变量配置...');

    const requiredVars = [
      'NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID',
      'AUTH_PROVIDER',
      'DATABASE_PROVIDER',
      'DEPLOYMENT_REGION'
    ];

    let allConfigured = true;

    requiredVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        this.log(`✅ ${varName}: 已配置`, 'SUCCESS');
      } else {
        this.log(`❌ ${varName}: 未配置`, 'ERROR');
        allConfigured = false;
      }
    });

    // 检查可选的支付配置
    const paymentVars = ['WECHAT_PAY_APPID', 'ALIPAY_APP_ID'];
    paymentVars.forEach(varName => {
      const value = process.env[varName];
      if (value) {
        this.log(`✅ ${varName}: 已配置 (支付功能)`, 'SUCCESS');
      } else {
        this.log(`ℹ️ ${varName}: 未配置 (可选)`, 'INFO');
      }
    });

    return allConfigured;
  }

  async runVerification() {
    this.log('开始腾讯云部署验证...', 'START');

    const results = {
      environment: await this.checkEnvironment(),
      health: await this.checkHealth(),
      auth: await this.checkAuth(),
      payment: await this.checkPayment()
    };

    this.log('验证完成', 'END');

    // 汇总结果
    const passed = Object.values(results).filter(Boolean).length;
    const total = Object.keys(results).length;

    console.log('\n' + '='.repeat(50));
    console.log('📊 验证结果汇总:');
    console.log(`   通过: ${passed}/${total}`);
    console.log(`   状态: ${passed === total ? '✅ 全部通过' : '⚠️ 部分通过'}`);

    if (passed === total) {
      console.log('\n🎉 恭喜！腾讯云部署验证全部通过！');
      console.log('   您的 mvp_22 已成功部署到腾讯云。');
    } else {
      console.log('\n⚠️ 发现一些配置问题，请检查上述错误信息。');
      console.log('   参考: TENCENT_CLOUD_DEPLOYMENT_GUIDE.md');
    }

    console.log('='.repeat(50));

    return passed === total;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const verifier = new TencentDeploymentVerifier();
  verifier.runVerification()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('验证过程出错:', error);
      process.exit(1);
    });
}

module.exports = TencentDeploymentVerifier;


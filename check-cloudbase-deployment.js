#!/usr/bin/env node

/**
 * CloudBase 部署环境检查脚本
 * 检查 CloudBase 云部署所需的所有配置
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CloudBaseChecker {
  constructor() {
    this.projectRoot = path.resolve(__dirname);
    this.checks = [];
    this.errors = [];
    this.warnings = [];
  }

  log(message, status = 'INFO') {
    const colors = {
      INFO: '\x1b[36m',
      SUCCESS: '\x1b[32m',
      WARNING: '\x1b[33m',
      ERROR: '\x1b[31m',
      RESET: '\x1b[0m'
    };
    console.log(`${colors[status]}[${status}] ${message}${colors.RESET}`);
  }

  check(message, condition, errorMsg = null) {
    this.checks.push({
      message,
      condition,
      errorMsg
    });

    if (condition) {
      this.log(`✅ ${message}`, 'SUCCESS');
      return true;
    } else {
      this.log(`❌ ${message}`, 'ERROR');
      if (errorMsg) {
        this.errors.push(errorMsg);
      }
      return false;
    }
  }

  warn(message, condition, warningMsg = null) {
    if (!condition) {
      this.log(`⚠️ ${message}`, 'WARNING');
      if (warningMsg) {
        this.warnings.push(warningMsg);
      }
      return false;
    }
    return true;
  }

  checkNodeVersion() {
    const version = process.version;
    const major = parseInt(version.replace('v', '').split('.')[0]);
    return this.check(
      `Node.js 版本 >= 16 (当前: ${version})`,
      major >= 16,
      'Node.js 版本过低，请升级到 16+ 版本'
    );
  }

  checkCloudBaseCLI() {
    try {
      const version = execSync('cloudbase --version', { encoding: 'utf8' }).trim();
      return this.check(
        `CloudBase CLI 已安装 (${version})`,
        true
      );
    } catch (error) {
      return this.check(
        'CloudBase CLI 已安装',
        false,
        'CloudBase CLI 未安装，请运行: npm install -g @cloudbase/cli'
      );
    }
  }

  checkCloudBaseLogin() {
    try {
      execSync('cloudbase env:list --json', { stdio: 'pipe' });
      return this.check(
        'CloudBase CLI 已登录',
        true
      );
    } catch (error) {
      return this.check(
        'CloudBase CLI 已登录',
        false,
        'CloudBase CLI 未登录，请运行: cloudbase login'
      );
    }
  }

  checkConfigFile() {
    const configPath = path.join(this.projectRoot, '.cloudbaserc.json');
    const exists = fs.existsSync(configPath);
    return this.check(
      'CloudBase 配置文件存在',
      exists,
      '缺少 .cloudbaserc.json 配置文件'
    );
  }

  checkEnvironmentVariables() {
    let envVars = {};

    // 读取环境变量文件
    const envFiles = ['.env.local', '.env'];
    for (const envFile of envFiles) {
      const envPath = path.join(this.projectRoot, envFile);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf8');
        content.split('\n').forEach(line => {
          const [key, value] = line.split('=');
          if (key && value) {
            envVars[key.trim()] = value.trim();
          }
        });
        break;
      }
    }

    // 检查必需的环境变量
    const requiredVars = [
      'NEXT_PUBLIC_TENCENT_CLOUD_ENV_ID',
      'AUTH_PROVIDER',
      'DATABASE_PROVIDER'
    ];

    let allRequired = true;
    requiredVars.forEach(varName => {
      const hasVar = !!envVars[varName];
      allRequired = allRequired && hasVar;
      this.check(
        `环境变量 ${varName} 已配置`,
        hasVar,
        `缺少必需的环境变量: ${varName}`
      );
    });

    // 检查可选的环境变量
    const optionalVars = ['WECHAT_PAY_APPID', 'ALIPAY_APP_ID'];
    optionalVars.forEach(varName => {
      this.warn(
        `支付环境变量 ${varName} 已配置`,
        !!envVars[varName],
        `可选的支付功能未配置: ${varName}`
      );
    });

    return allRequired;
  }

  checkPackageJson() {
    const packagePath = path.join(this.projectRoot, 'package.json');
    const exists = fs.existsSync(packagePath);
    this.check(
      'package.json 文件存在',
      exists,
      '缺少 package.json 文件'
    );

    if (exists) {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

      // 检查必要的脚本
      const requiredScripts = ['build', 'cloudbase:deploy'];
      requiredScripts.forEach(script => {
        const hasScript = !!(packageJson.scripts && packageJson.scripts[script]);
        this.check(
          `npm 脚本 ${script} 已配置`,
          hasScript,
          `缺少 npm 脚本: ${script}`
        );
      });
    }

    return exists;
  }

  checkCloudFunctions() {
    const functionsDir = path.join(this.projectRoot, 'cloud-functions');
    const exists = fs.existsSync(functionsDir);
    this.check(
      '云函数目录存在',
      exists,
      '缺少 cloud-functions 目录'
    );

    if (exists) {
      const emailFunctionDir = path.join(functionsDir, 'sendEmailVerification');
      const hasEmailFunction = fs.existsSync(emailFunctionDir);
      this.warn(
        '邮箱验证码云函数存在',
        hasEmailFunction,
        '缺少邮箱验证码云函数 (可选功能)'
      );
    }

    return exists;
  }

  checkBuildOutput() {
    const nextDir = path.join(this.projectRoot, '.next');
    const exists = fs.existsSync(nextDir);
    this.warn(
      '项目已构建 (.next 目录存在)',
      exists,
      '项目尚未构建，请先运行构建命令'
    );

    if (exists) {
      const standaloneDir = path.join(nextDir, 'standalone');
      const hasStandalone = fs.existsSync(standaloneDir);
      this.check(
        'Standalone 构建输出存在',
        hasStandalone,
        '缺少 standalone 构建输出，请使用正确的构建配置'
      );
    }

    return exists;
  }

  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 CloudBase 部署检查报告');
    console.log('='.repeat(60));

    const totalChecks = this.checks.length;
    const passedChecks = this.checks.filter(c => c.condition).length;
    const failedChecks = totalChecks - passedChecks;

    console.log(`\n📈 检查结果:`);
    console.log(`   总检查项: ${totalChecks}`);
    console.log(`   通过: ${passedChecks}`);
    console.log(`   失败: ${failedChecks}`);
    console.log(`   状态: ${failedChecks === 0 ? '✅ 全部通过' : '❌ 有问题需要修复'}`);

    if (this.errors.length > 0) {
      console.log('\n❌ 错误 (必须修复):');
      this.errors.forEach(error => console.log(`   • ${error}`));
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️ 警告 (可选修复):');
      this.warnings.forEach(warning => console.log(`   • ${warning}`));
    }

    if (failedChecks === 0) {
      console.log('\n🎉 恭喜！所有检查都通过了，可以开始 CloudBase 部署。');
      console.log('\n🚀 部署命令:');
      console.log('   npm run cloudbase:auto-deploy    # 自动部署');
      console.log('   npm run cloudbase:full-deploy    # 手动部署');
    } else {
      console.log('\n🔧 请修复上述错误后再尝试部署。');
      console.log('\n📚 参考文档:');
      console.log('   CLOUDBASE_CLOUD_DEPLOYMENT_GUIDE.md');
    }

    console.log('='.repeat(60));

    return failedChecks === 0;
  }

  async runChecks() {
    this.log('开始 CloudBase 部署环境检查...', 'INFO');

    // 执行所有检查
    this.checkNodeVersion();
    this.checkCloudBaseCLI();
    this.checkCloudBaseLogin();
    this.checkConfigFile();
    this.checkEnvironmentVariables();
    this.checkPackageJson();
    this.checkCloudFunctions();
    this.checkBuildOutput();

    // 生成报告
    return this.generateReport();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  const checker = new CloudBaseChecker();
  checker.runChecks().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('检查过程出错:', error);
    process.exit(1);
  });
}

module.exports = CloudBaseChecker;


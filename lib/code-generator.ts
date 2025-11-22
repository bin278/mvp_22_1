export interface GeneratedProject {
  files: {
    [key: string]: string
  }
  projectName: string
}

export function generateFrontendCode(prompt: string): GeneratedProject {
  const projectName = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50) || 'generated-app'

  // Analyze prompt to determine type
  const promptLower = prompt.toLowerCase()
  
  if (promptLower.includes('dashboard') || promptLower.includes('analytics')) {
    return generateDashboard(prompt, projectName)
  } else if (promptLower.includes('landing') || promptLower.includes('homepage') || promptLower.includes('marketing')) {
    return generateLandingPage(prompt, projectName)
  } else if (promptLower.includes('form') || promptLower.includes('signup') || promptLower.includes('login')) {
    return generateFormPage(prompt, projectName)
  } else if (promptLower.includes('pricing')) {
    return generatePricingPage(prompt, projectName)
  } else if (promptLower.includes('blog') || promptLower.includes('article')) {
    return generateBlogPage(prompt, projectName)
  } else if (promptLower.includes('game') || promptLower.includes('gaming') || promptLower.includes('play')) {
    return generateGamePage(prompt, projectName)
  } else if (promptLower.includes('ai') || promptLower.includes('tool') || promptLower.includes('website') || promptLower.includes('app') || promptLower.includes('platform') || promptLower.includes('cloth')) {
    return generateAIToolWebsite(prompt, projectName)
  } else {
    return generateGenericApp(prompt, projectName)
  }
}

function generateDashboard(prompt: string, projectName: string): GeneratedProject {
  return {
    projectName,
    files: {
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.454.0',
          recharts: '^2.15.4'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.1',
          typescript: '^5.0.0',
          vite: '^5.0.0'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true
        },
        include: ['src']
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { BarChart3, Users, DollarSign, TrendingUp, Activity } from 'lucide-react'

export default function App() {
  const stats = [
    { name: 'Total Revenue', value: '$45,231', icon: DollarSign, change: '+20.1%', positive: true },
    { name: 'Active Users', value: '2,345', icon: Users, change: '+12.5%', positive: true },
    { name: 'Conversion', value: '3.24%', icon: TrendingUp, change: '-4.3%', positive: false },
    { name: 'Activity', value: '89%', icon: Activity, change: '+5.2%', positive: true },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-blue-600" />
              <h1 className="text-xl font-bold">${prompt}</h1>
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Export
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-bold mb-6">Dashboard Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <Icon className="w-8 h-8 text-blue-600" />
                  <span className={\`text-sm font-medium \${stat.positive ? 'text-green-600' : 'text-red-600'}\`}>
                    {stat.change}
                  </span>
                </div>
                <p className="text-gray-600 text-sm">{stat.name}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4 pb-4 border-b last:border-b-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Activity {i}</p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="h-64 flex items-center justify-center text-gray-400">
              Chart placeholder - Add recharts for real charts
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

## Project Structure

- \`src/App.tsx\` - Main application component
- \`src/main.tsx\` - Application entry point
- \`src/index.css\` - Global styles

Enjoy your generated frontend! 🚀
`,
      '.gitignore': `# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage

# Production
build
dist

# Misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*
`
    }
  }
}

function generateLandingPage(prompt: string, projectName: string): GeneratedProject {
  return {
    projectName,
    files: {
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.454.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.1',
          typescript: '^5.0.0',
          vite: '^5.0.0',
          tailwindcss: '^3.4.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true
        },
        include: ['src']
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { Rocket, Zap, Shield, ArrowRight, Star } from 'lucide-react'

export default function App() {
  const features = [
    { icon: Zap, title: 'Lightning Fast', description: 'Blazing fast performance out of the box' },
    { icon: Shield, title: 'Secure', description: 'Built with security best practices' },
    { icon: Rocket, title: 'Easy to Use', description: 'Simple and intuitive interface' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-indigo-600">Logo</div>
          <div className="hidden md:flex gap-8">
            <a href="#features" className="text-gray-700 hover:text-indigo-600">Features</a>
            <a href="#pricing" className="text-gray-700 hover:text-indigo-600">Pricing</a>
            <a href="#contact" className="text-gray-700 hover:text-indigo-600">Contact</a>
          </div>
          <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Get Started
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-600 text-sm font-medium mb-6">
            <Star className="w-4 h-4" />
            New Release 2024
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {prompt || 'Build Something Amazing'}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform your ideas into reality with our powerful platform. Fast, secure, and easy to use.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium flex items-center justify-center gap-2">
              Start Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-50 font-medium border-2 border-indigo-600">
              Watch Demo
            </button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-900 mb-12">
          Why Choose Us
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white p-8 rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-indigo-600 rounded-2xl p-12 text-center text-white max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl mb-8 text-indigo-100">
            Join thousands of satisfied customers today
          </p>
          <button className="px-8 py-4 bg-white text-indigo-600 rounded-lg hover:bg-gray-100 font-medium">
            Start Your Free Trial
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-gray-200">
        <p className="text-center text-gray-600">
          © 2024 Generated by mornFront. All rights reserved.
        </p>
      </footer>
    </div>
  )
}`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your generated landing page! 🚀
`,
      '.gitignore': `node_modules
dist
.DS_Store
*.log
.env.local`
    }
  }
}

function generateFormPage(prompt: string, projectName: string): GeneratedProject {
  return {
    projectName,
    files: {
      ...generateGenericApp(prompt, projectName).files,
      'src/App.tsx': `import { useState } from 'react'
import { Mail, Lock, User, AlertCircle } from 'lucide-react'

export default function App() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    
    if (!formData.name) newErrors.name = 'Name is required'
    if (!formData.email) newErrors.email = 'Email is required'
    if (!formData.password) newErrors.password = 'Password is required'
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      alert('Form submitted successfully!')
      console.log('Form data:', formData)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // Clear error when user starts typing
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{prompt || 'Sign Up Form'}</h1>
          <p className="text-gray-600">Create your account to get started</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={\`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent \${errors.name ? 'border-red-500' : 'border-gray-300'}\`}
                  placeholder="John Doe"
                />
              </div>
              {errors.name && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.name}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={\`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent \${errors.email ? 'border-red-500' : 'border-gray-300'}\`}
                  placeholder="john@example.com"
                />
              </div>
              {errors.email && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={\`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent \${errors.password ? 'border-red-500' : 'border-gray-300'}\`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && (
                <div className="flex items-center gap-1 text-red-500 text-sm mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
            >
              Create Account
            </button>
          </form>

          <p className="text-center text-sm text-gray-600 mt-6">
            Already have an account?{' '}
            <a href="#" className="text-purple-600 hover:text-purple-700 font-medium">
              Sign In
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}`
    }
  }
}

function generatePricingPage(prompt: string, projectName: string): GeneratedProject {
  return {
    projectName,
    files: {
      ...generateGenericApp(prompt, projectName).files,
      'src/App.tsx': `import { Check } from 'lucide-react'

export default function App() {
  const plans = [
    {
      name: 'Starter',
      price: '$9',
      period: '/month',
      features: [
        '10 Projects',
        '5GB Storage',
        'Basic Support',
        'Email Support'
      ],
      popular: false
    },
    {
      name: 'Pro',
      price: '$29',
      period: '/month',
      features: [
        'Unlimited Projects',
        '50GB Storage',
        'Priority Support',
        '24/7 Phone Support',
        'Advanced Analytics'
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: '/month',
      features: [
        'Unlimited Everything',
        '500GB Storage',
        'Dedicated Support',
        'Custom Integration',
        'SLA Guarantee',
        'White-label Option'
      ],
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {prompt || 'Choose Your Plan'}
          </h1>
          <p className="text-xl text-gray-600">
            Select the perfect plan for your needs
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={\`bg-white rounded-2xl shadow-lg p-8 relative \${
                plan.popular ? 'ring-2 ring-blue-500 transform scale-105' : ''
              }\`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600">{plan.period}</span>
                </div>
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-blue-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                className={\`w-full py-3 rounded-lg font-medium transition-colors \${
                  plan.popular
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }\`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 mt-12">
          All plans include 14-day free trial. No credit card required.
        </p>
      </div>
    </div>
  )
}`
    }
  }
}

function generateBlogPage(prompt: string, projectName: string): GeneratedProject {
  return {
    projectName,
    files: {
      ...generateGenericApp(prompt, projectName).files,
      'src/App.tsx': `import { Calendar, Clock, User } from 'lucide-react'

export default function App() {
  const posts = [
    {
      title: 'Getting Started with Modern Web Development',
      excerpt: 'Learn the fundamentals of building modern web applications with React and TypeScript.',
      author: 'John Doe',
      date: 'Mar 15, 2024',
      readTime: '5 min read',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop'
    },
    {
      title: 'The Future of Frontend Development',
      excerpt: 'Explore upcoming trends and technologies shaping the future of web development.',
      author: 'Jane Smith',
      date: 'Mar 12, 2024',
      readTime: '8 min read',
      image: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&h=250&fit=crop'
    },
    {
      title: 'Best Practices for React Applications',
      excerpt: 'Discover proven patterns and techniques for building scalable React applications.',
      author: 'Mike Johnson',
      date: 'Mar 10, 2024',
      readTime: '6 min read',
      image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">{prompt || 'Blog'}</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {posts.map((post, index) => (
            <article key={index} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <img
                src={post.image}
                alt={post.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 cursor-pointer">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-4">{post.excerpt}</p>
                
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {post.author}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {post.date}
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {post.readTime}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  )
}`
    }
  }
}

function generateAIToolWebsite(prompt: string, projectName: string): GeneratedProject {
  return {
    projectName,
    files: {
      ...generateGenericApp(prompt, projectName).files,
      'src/App.tsx': `import { useState } from 'react'
import { Sparkles, Zap, Brain, Wand2, ArrowRight, Check, Star, Users, Globe } from 'lucide-react'

export default function App() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [result, setResult] = useState('')

  const handleGenerate = async () => {
    setIsGenerating(true)
    // Simulate AI generation
    setTimeout(() => {
      setResult('Generated content based on your input...')
      setIsGenerating(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-cyan-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                ${prompt.includes('AI') ? 'AI' : 'Smart'} Tool
              </h1>
            </div>
            <nav className="hidden md:flex gap-8">
              <a href="#features" className="text-gray-600 hover:text-indigo-600">Features</a>
              <a href="#pricing" className="text-gray-600 hover:text-indigo-600">Pricing</a>
              <a href="#about" className="text-gray-600 hover:text-indigo-600">About</a>
            </nav>
            <button className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 rounded-full text-indigo-600 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              Powered by Advanced AI
            </div>
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              ${prompt || 'AI-Powered Tool'}
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Transform your ideas into reality with our cutting-edge AI technology. 
              Generate, create, and innovate like never before.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 font-medium flex items-center justify-center gap-2 transition-all transform hover:scale-105"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Start Creating
                  </>
                )}
              </button>
              <button className="px-8 py-4 bg-white text-indigo-600 rounded-xl hover:bg-gray-50 font-medium border-2 border-indigo-600 flex items-center justify-center gap-2">
                <Globe className="w-5 h-5" />
                View Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Powerful Features
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to bring your ideas to life
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-4">AI-Powered Generation</h4>
              <p className="text-gray-600">
                Advanced machine learning algorithms that understand context and generate high-quality content.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <Wand2 className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Smart Templates</h4>
              <p className="text-gray-600">
                Pre-built templates and components that adapt to your specific needs and requirements.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-8 rounded-2xl">
              <div className="w-12 h-12 bg-cyan-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-xl font-semibold mb-4">Lightning Fast</h4>
              <p className="text-gray-600">
                Generate complex applications in seconds, not hours. Built for speed and efficiency.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      {(isGenerating || result) && (
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h4 className="text-2xl font-semibold mb-6 text-center">Generation Results</h4>
                {isGenerating ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </div>
                    <p className="text-gray-600">AI is working on your request...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Check className="w-5 h-5" />
                      <span className="font-medium">Generation Complete</span>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-800">{result}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">10K+</div>
              <div className="text-gray-600">Projects Generated</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-indigo-600 mb-2">5★</div>
              <div className="text-gray-600">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Ideas?
            </h3>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of creators who are already using our AI-powered platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-4 bg-white text-indigo-600 rounded-xl hover:bg-gray-100 font-medium flex items-center justify-center gap-2">
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </button>
              <button className="px-8 py-4 bg-indigo-700 text-white rounded-xl hover:bg-indigo-800 font-medium">
                View Pricing
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-gray-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold">AI Tool</span>
              </div>
              <p className="text-gray-400">
                Transforming ideas into reality with the power of artificial intelligence.
              </p>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Product</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Features</a></li>
                <li><a href="#" className="hover:text-white">Pricing</a></li>
                <li><a href="#" className="hover:text-white">API</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Company</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
              </ul>
            </div>
            <div>
              <h5 className="font-semibold mb-4">Support</h5>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Status</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 AI Tool. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## 🚀 AI Tool Website

This is a modern, professional AI tool website with interactive features and beautiful design.

## 🚀 Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## ✨ Features

✅ **Modern Design** - Beautiful gradient backgrounds and glassmorphism effects
✅ **Interactive Elements** - Working buttons with hover effects and animations
✅ **AI Generation** - Simulated AI content generation with loading states
✅ **Responsive Layout** - Works perfectly on all screen sizes
✅ **Professional UI** - Clean, modern interface with proper typography
✅ **Real-time Updates** - Dynamic content updates and state management

## 🎨 Customization

You can easily customize this website:

### Styling
- Update colors in the gradient backgrounds
- Modify the color scheme (indigo/purple theme)
- Change typography and spacing
- Add custom animations

### Content
- Update the hero section text
- Modify feature descriptions
- Change the company information
- Add your own branding

### Functionality
- Connect to real AI APIs
- Add user authentication
- Implement real data fetching
- Add more interactive features

## 🔧 Technical Details

- Built with React 18 and TypeScript
- Uses Tailwind CSS for styling
- Lucide React for icons
- State management with React hooks
- Responsive design with CSS Grid and Flexbox

## 🚀 Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your AI tool website! 🚀

Visit: https://mornhub.dev
`
    }
  }
}

function generateGamePage(prompt: string, projectName: string): GeneratedProject {
  return {
    projectName,
    files: {
      ...generateGenericApp(prompt, projectName).files,
      'src/App.tsx': `import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw, Trophy, Target, Zap } from 'lucide-react'

export default function App() {
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameStatus, setGameStatus] = useState<'waiting' | 'playing' | 'paused' | 'gameOver'>('waiting')
  const [targets, setTargets] = useState<Array<{id: number, x: number, y: number, points: number}>>([])

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0) {
      setGameStatus('gameOver')
      setIsPlaying(false)
    }
  }, [timeLeft, isPlaying])

  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setTargets(prev => [
          ...prev.slice(-2), // Keep only last 2 targets
          {
            id: Date.now(),
            x: Math.random() * 80 + 10,
            y: Math.random() * 60 + 20,
            points: Math.floor(Math.random() * 50) + 10
          }
        ])
      }, 1500)

      return () => clearInterval(interval)
    }
  }, [isPlaying])

  const startGame = () => {
    setScore(0)
    setTimeLeft(60)
    setTargets([])
    setGameStatus('playing')
    setIsPlaying(true)
  }

  const pauseGame = () => {
    setIsPlaying(!isPlaying)
    setGameStatus(isPlaying ? 'paused' : 'playing')
  }

  const resetGame = () => {
    setIsPlaying(false)
    setGameStatus('waiting')
    setScore(0)
    setTimeLeft(60)
    setTargets([])
  }

  const hitTarget = (targetId: number, points: number) => {
    setScore(prev => prev + points)
    setTargets(prev => prev.filter(t => t.id !== targetId))
  }

  const getStatusMessage = () => {
    switch (gameStatus) {
      case 'waiting': return 'Click Play to start!'
      case 'paused': return 'Game Paused'
      case 'gameOver': return 'Game Over!'
      default: return 'Playing...'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-center">
            {prompt || 'Game Page'} 🎮
          </h1>
        </div>
      </header>

      {/* Game Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />
            <div className="text-2xl font-bold">{score}</div>
            <div className="text-sm opacity-80">Score</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Target className="w-8 h-8 mx-auto mb-2 text-red-400" />
            <div className="text-2xl font-bold">{timeLeft}</div>
            <div className="text-sm opacity-80">Time Left</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center">
            <Zap className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <div className="text-2xl font-bold">{targets.length}</div>
            <div className="text-sm opacity-80">Targets</div>
          </div>
        </div>

        {/* Game Controls */}
        <div className="flex justify-center gap-4 mb-6">
          {gameStatus === 'waiting' || gameStatus === 'gameOver' ? (
            <button
              onClick={startGame}
              className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-xl font-bold flex items-center gap-2 transition-colors"
            >
              <Play className="w-5 h-5" />
              {gameStatus === 'gameOver' ? 'Play Again' : 'Start Game'}
            </button>
          ) : (
            <button
              onClick={pauseGame}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold flex items-center gap-2 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isPlaying ? 'Pause' : 'Resume'}
            </button>
          )}
          
          <button
            onClick={resetGame}
            className="px-8 py-4 bg-gray-600 hover:bg-gray-700 rounded-xl font-bold flex items-center gap-2 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
            Reset
          </button>
        </div>

        {/* Game Status */}
        <div className="text-center mb-6">
          <div className="text-xl font-semibold">{getStatusMessage()}</div>
        </div>

        {/* Game Area */}
        <div className="relative bg-black/20 backdrop-blur-sm rounded-2xl border border-white/20 h-96 overflow-hidden">
          {/* Game Instructions */}
          {gameStatus === 'waiting' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold mb-2">Target Practice Game</h2>
                <p className="text-lg opacity-80 mb-4">
                  Click on targets to score points!<br />
                  You have 60 seconds to get the highest score.
                </p>
                <div className="text-sm opacity-60">
                  Different targets give different points
                </div>
              </div>
            </div>
          )}

          {/* Game Over Screen */}
          {gameStatus === 'gameOver' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-3xl font-bold mb-2">Game Over!</h2>
                <p className="text-xl mb-4">Final Score: <span className="text-yellow-400 font-bold">{score}</span></p>
                <div className="text-sm opacity-80">
                  {score > 500 ? 'Excellent!' : score > 300 ? 'Great job!' : score > 100 ? 'Good effort!' : 'Keep practicing!'}
                </div>
              </div>
            </div>
          )}

          {/* Targets */}
          {isPlaying && targets.map(target => (
            <button
              key={target.id}
              onClick={() => hitTarget(target.id, target.points)}
              className="absolute w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-full shadow-lg hover:scale-110 transition-transform animate-pulse border-2 border-white/30"
              style={{
                left: \`\${target.x}%\`,
                top: \`\${target.y}%\`,
              }}
              title={\`+\${target.points} points\`}
            >
              <div className="text-white font-bold text-sm">
                {target.points}
              </div>
            </button>
          ))}

          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 left-4 text-2xl">🎯</div>
            <div className="absolute top-8 right-8 text-xl">⭐</div>
            <div className="absolute bottom-8 left-8 text-xl">🎮</div>
            <div className="absolute bottom-4 right-4 text-2xl">🏆</div>
          </div>
        </div>

        {/* Game Info */}
        <div className="mt-6 text-center text-sm opacity-80">
          <p>Click on targets to score points • Higher targets = more points • Beat your high score!</p>
        </div>
      </div>
    </div>
  )
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## 🎮 Game Description

This is an interactive target practice game where you click on targets to score points within a time limit.

## 🚀 Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 How to Play

1. Click "Start Game" to begin
2. Click on targets that appear to score points
3. Try to get the highest score in 60 seconds
4. Use "Pause" to pause the game
5. Click "Reset" to start over

## 🏆 Scoring

- Different targets give different point values (10-60 points)
- The faster you click, the more targets you can hit
- Try to beat your high score!

## 🛠️ Customization

You can easily customize this game:

### Add New Game Mechanics
- Edit \`src/App.tsx\` to add power-ups
- Modify target spawning logic
- Add sound effects
- Implement high score saving

### Styling
- Update colors in the gradient backgrounds
- Change target appearance
- Add animations
- Modify the game area size

### Game Rules
- Adjust time limit (change \`timeLeft\` initial value)
- Modify target spawn rate (change interval in useEffect)
- Change point values for different target types

## 🎨 Features

✅ **Interactive Gameplay** - Click targets to score points  
✅ **Timer System** - 60-second countdown  
✅ **Score Tracking** - Real-time score updates  
✅ **Pause/Resume** - Control game state  
✅ **Responsive Design** - Works on all screen sizes  
✅ **Modern UI** - Beautiful gradient design with glassmorphism  
✅ **Game States** - Waiting, playing, paused, game over  
✅ **Target Spawning** - Dynamic target generation  

## 🎮 Game Controls

- **Start Game**: Click the green "Start Game" button
- **Pause**: Click "Pause" to pause/resume
- **Reset**: Click "Reset" to restart
- **Hit Targets**: Click on red targets to score points

## 🔧 Technical Details

- Built with React 18 and TypeScript
- Uses Tailwind CSS for styling
- Lucide React for icons
- State management with React hooks
- Responsive design with CSS Grid

## 🚀 Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your game! 🎮

Visit: https://mornhub.dev
`
    }
  }
}

function generateGenericApp(prompt: string, projectName: string): GeneratedProject {
  return {
    projectName,
    files: {
      'package.json': JSON.stringify({
        name: projectName,
        version: '1.0.0',
        private: true,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'lucide-react': '^0.454.0'
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.1',
          typescript: '^5.0.0',
          vite: '^5.0.0',
          tailwindcss: '^3.4.0',
          autoprefixer: '^10.4.16',
          postcss: '^8.4.32'
        }
      }, null, 2),
      'vite.config.ts': `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
})`,
      'tsconfig.json': JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true
        },
        include: ['src']
      }, null, 2),
      'index.html': `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${prompt}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
      'src/main.tsx': `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
      'src/App.tsx': `import { Sparkles } from 'lucide-react'

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-12">
        <div className="flex items-center justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-4">
          {prompt || 'Your App Idea Here'}
        </h1>
        
        <p className="text-center text-gray-600 mb-8">
          This is your generated frontend application. Customize it to match your vision!
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-medium">
            Get Started
          </button>
          <button className="px-6 py-3 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 font-medium">
            Learn More
          </button>
        </div>
      </div>
    </div>
  )
}`,
      'src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`,
      'tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
      'postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
      'README.md': `# ${prompt}

Generated by mornFront - mornhub.dev

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Build for Production

\`\`\`bash
npm run build
npm run preview
\`\`\`

Enjoy your generated app! 🚀
`,
      '.gitignore': `node_modules
dist
.DS_Store
*.log
.env.local`
    }
  }
}


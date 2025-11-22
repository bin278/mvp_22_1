import { NextRequest, NextResponse } from 'next/server'
import { generateFrontendCode } from '@/lib/code-generator'

export async function POST(request: NextRequest) {
  try {
    const { prompt } = await request.json()
    
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      )
    }

    const generatedProject = generateFrontendCode(prompt.trim())
    const appContent = generatedProject.files['src/App.tsx']
    
    if (!appContent) {
      return NextResponse.json(
        { error: 'Could not generate preview' },
        { status: 500 }
      )
    }

    // Create a simple HTML preview without external dependencies
    const previewHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${generatedProject.projectName} - Preview</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body {
        margin: 0;
        font-family: system-ui, -apple-system, sans-serif;
        background: #f8fafc;
      }
      .preview-container {
        width: 100%;
        min-height: 100vh;
      }
      .loading {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        font-size: 18px;
        color: #64748b;
      }
      .error {
        padding: 20px;
        background: #fee2e2;
        color: #dc2626;
        border-radius: 8px;
        margin: 20px;
      }
    </style>
  </head>
  <body>
    <div id="loading" class="loading">Loading preview...</div>
    <div id="root" class="preview-container" style="display: none;"></div>
    
    <script type="text/babel">
      // Simple icon components using Unicode symbols
      const Icon = ({ name, className = "w-4 h-4 inline-block", ...props }) => {
        const icons = {
          play: "▶",
          pause: "⏸",
          rotate: "🔄",
          trophy: "🏆",
          target: "🎯",
          zap: "⚡",
          sparkles: "✨",
          mail: "✉",
          lock: "🔒",
          user: "👤",
          alert: "⚠",
          check: "✓",
          calendar: "📅",
          clock: "🕐",
          arrow: "→",
          star: "⭐",
          rocket: "🚀",
          shield: "🛡",
          copy: "📋",
          download: "⬇",
          eye: "👁"
        };
        return React.createElement('span', {
          className: className,
          ...props
        }, icons[name] || "?");
      };
      
      // Create icon components
      const Play = (props) => React.createElement(Icon, { name: 'play', ...props });
      const Pause = (props) => React.createElement(Icon, { name: 'pause', ...props });
      const RotateCcw = (props) => React.createElement(Icon, { name: 'rotate', ...props });
      const Trophy = (props) => React.createElement(Icon, { name: 'trophy', ...props });
      const Target = (props) => React.createElement(Icon, { name: 'target', ...props });
      const Zap = (props) => React.createElement(Icon, { name: 'zap', ...props });
      const Sparkles = (props) => React.createElement(Icon, { name: 'sparkles', ...props });
      const Mail = (props) => React.createElement(Icon, { name: 'mail', ...props });
      const Lock = (props) => React.createElement(Icon, { name: 'lock', ...props });
      const User = (props) => React.createElement(Icon, { name: 'user', ...props });
      const AlertCircle = (props) => React.createElement(Icon, { name: 'alert', ...props });
      const Check = (props) => React.createElement(Icon, { name: 'check', ...props });
      const Calendar = (props) => React.createElement(Icon, { name: 'calendar', ...props });
      const Clock = (props) => React.createElement(Icon, { name: 'clock', ...props });
      const ArrowRight = (props) => React.createElement(Icon, { name: 'arrow', ...props });
      const Star = (props) => React.createElement(Icon, { name: 'star', ...props });
      const Rocket = (props) => React.createElement(Icon, { name: 'rocket', ...props });
      const Shield = (props) => React.createElement(Icon, { name: 'shield', ...props });
      
      try {
        // Clean up the component code
        const cleanCode = \`${appContent
          .replace('export default function App', 'function App')
          .replace(/import.*from.*lucide-react.*\n/g, '')
          .replace(/import.*from.*react.*\n/g, '')
          .replace(/\$\{/g, '\\${')
          .replace(/\`/g, '\\`')}\`;
        
        // Execute the component code
        eval(cleanCode);
        
        // Hide loading and show content
        document.getElementById('loading').style.display = 'none';
        document.getElementById('root').style.display = 'block';
        
        // Render the component
        const root = ReactDOM.createRoot(document.getElementById('root'));
        root.render(React.createElement(App));
        
      } catch (error) {
        console.error('Preview error:', error);
        document.getElementById('loading').innerHTML = \`
          <div class="error">
            <h3>Preview Error</h3>
            <p>Could not render the preview: \${error.message}</p>
            <p>This might be due to complex dependencies or unsupported features.</p>
          </div>
        \`;
      }
    </script>
  </body>
</html>
`

    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview' },
      { status: 500 }
    )
  }
}

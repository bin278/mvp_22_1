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
    
    // Return the main App.tsx content for preview
    const appContent = generatedProject.files['src/App.tsx']
    const indexContent = generatedProject.files['index.html']
    
    if (!appContent) {
      return NextResponse.json(
        { error: 'Could not generate preview' },
        { status: 500 }
      )
    }

    // Create a complete HTML page with the React component
    const previewHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${generatedProject.projectName} - Preview</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      .preview-container {
        width: 100%;
        height: 100vh;
        overflow: auto;
      }
      /* Simple icon replacements for Lucide React */
      .icon-play:before { content: "▶"; }
      .icon-pause:before { content: "⏸"; }
      .icon-rotate:before { content: "🔄"; }
      .icon-trophy:before { content: "🏆"; }
      .icon-target:before { content: "🎯"; }
      .icon-zap:before { content: "⚡"; }
      .icon-sparkles:before { content: "✨"; }
      .icon-mail:before { content: "✉"; }
      .icon-lock:before { content: "🔒"; }
      .icon-user:before { content: "👤"; }
      .icon-alert:before { content: "⚠"; }
      .icon-check:before { content: "✓"; }
      .icon-calendar:before { content: "📅"; }
      .icon-clock:before { content: "🕐"; }
      .icon-arrow:before { content: "→"; }
      .icon-star:before { content: "⭐"; }
      .icon-rocket:before { content: "🚀"; }
      .icon-shield:before { content: "🛡"; }
    </style>
  </head>
  <body>
    <div id="root" class="preview-container"></div>
    
    <script type="text/babel">
      // Simple icon component
      const Icon = ({ name, className = "w-4 h-4", ...props }) => {
        return React.createElement('span', {
          className: \`icon-\${name.toLowerCase()} \${className}\`,
          ...props
        });
      };
      
      // Icon components
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
      
      // Component code - clean up the generated code
      ${appContent
        .replace('export default function App', 'function App')
        .replace(/import.*from.*lucide-react.*\n/g, '')
        .replace(/import.*from.*react.*\n/g, '')}
      
      // Render the component
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement(App));
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

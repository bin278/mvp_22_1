import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, files, device = 'desktop' } = await request.json()

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      )
    }

    // Get all files for multi-file support
    const allFiles = files || {}
    const appCode = code.trim()

    // Clean up the component code before embedding
    let cleanCode = appCode
      // Remove export statements
      .replace(/export\s+default\s+/g, '')
      .replace(/export\s+/g, '')
      // Remove import statements (we provide everything globally)
      .replace(/import\s+.*?\s+from\s+['"\`]lucide-react['"\`];?\s*\n/g, '')
      .replace(/import\s+.*?\s+from\s+['"\`]react['"\`];?\s*\n/g, '')
      .replace(/import\s+.*?\s+from\s+['"\`]react-dom['"\`];?\s*\n/g, '')
      .replace(/import\s+.*?\s+from\s+['"\`].*?['"\`];?\s*\n/g, '')
      .replace(/import\s*\(\s*['"\`].*?['"\`]\s*\);?\s*\n/g, '')
      .replace(/const\s+\w+\s*=\s*require\s*\(['"\`].*?['"\`]\);?\s*\n/g, '')
      // Replace React hooks with React namespace
      .replace(/\buseState\b/g, 'React.useState')
      .replace(/\buseEffect\b/g, 'React.useEffect')
      .replace(/\buseCallback\b/g, 'React.useCallback')
      .replace(/\buseMemo\b/g, 'React.useMemo')
      .replace(/\buseRef\b/g, 'React.useRef')
      .replace(/\buseContext\b/g, 'React.useContext')
      .replace(/\buseReducer\b/g, 'React.useReducer')
      .replace(/\buseLayoutEffect\b/g, 'React.useLayoutEffect')
      // Handle javascript: protocol in links (ONLY replace javascript: protocol, not the word itself)
      // Only replace javascript: protocol, not standalone javascript word to avoid breaking code
      .replace(/javascript:\s*[^;]*;?/gi, 'void(0);')
      .replace(/javascript:/gi, 'void(0);')
      .trim()
    
    // Remove any standalone "javascript" word that appears at the start of lines or after return statements
    // This can happen if code cleaning left behind invalid tokens
    cleanCode = cleanCode
      .replace(/^\s*javascript\s*$/gm, '')  // Remove standalone "javascript" on its own line
      .replace(/\breturn\s*\(\s*javascript\s*/g, 'return (')  // Remove "javascript" after "return ("
      .replace(/\(\s*javascript\s+/g, '(')  // Remove "javascript" after opening parenthesis
      .replace(/\s+javascript\s*$/gm, '')  // Remove "javascript" at end of lines
      .replace(/\n\s*javascript\s*\n/g, '\n')  // Remove "javascript" on its own line between other lines
      .trim()

    console.log('Original code:', appCode.substring(0, 200) + '...')
    console.log('Clean code:', cleanCode.substring(0, 200) + '...')
    console.log('Clean code full length:', cleanCode.length)

    // Ensure the code has a proper App component declaration
    // First check if code already has App function (avoid double wrapping)
    if (!cleanCode.includes('function App') && !cleanCode.includes('const App =') && !cleanCode.includes('App = ')) {
      console.log('Code does not have App function, will wrap it')
      
      // Clean up any remaining invalid tokens before processing
      cleanCode = cleanCode
        .replace(/^\s*javascript\s*$/gm, '')
        .replace(/\breturn\s*\(\s*javascript\s*/g, 'return (')
        .replace(/\(\s*javascript\s+/g, '(')
        .replace(/\s+javascript\s*$/gm, '')
        .replace(/\n\s*javascript\s*\n/g, '\n')
        .trim()
      
      const trimmedCode = cleanCode.trim()
      
      // Check if the code is a JSX return statement (most common case)
      // BUT NOT if it starts with 'function' (that's a component function, not a return statement)
      if (trimmedCode.startsWith('return') || (trimmedCode.startsWith('(') && !trimmedCode.startsWith('function') && !trimmedCode.match(/^\(\s*function/))) {
        // It's already a return statement, wrap it in App function
        cleanCode = 'function App() {\n' + cleanCode + '\n}'
        console.log('Wrapped return statement in App function')
      } 
      // Check if it's a component function definition (function ComponentName or const ComponentName =)
      // This MUST come after checking for return statements
      // Also check if code starts with function/const after removing leading invalid tokens
      else if (/^(function\s+\w+|const\s+\w+\s*=\s*(function|\(|=>))/.test(trimmedCode) || 
               /^\s*(javascript\s+)?(function\s+\w+|const\s+\w+\s*=\s*(function|\(|=>))/.test(trimmedCode)) {
        // Remove any leading "javascript" word if present
        cleanCode = cleanCode.replace(/^\s*javascript\s+/m, '').trim()
        const finalTrimmedCode = cleanCode.trim()
        // It's a component function, extract the component name
        const functionMatch = finalTrimmedCode.match(/^function\s+(\w+)/)
        const constMatch = finalTrimmedCode.match(/^const\s+(\w+)\s*=/)
        
        let componentName = null
        if (functionMatch) {
          componentName = functionMatch[1]
          console.log('Found function component:', componentName)
        } else if (constMatch) {
          componentName = constMatch[1]
          console.log('Found const component:', componentName)
        } else {
          // Fallback: try to find any function name in the code
          const anyFunctionMatch = cleanCode.match(/(?:function|const)\s+(\w+)/)
          if (anyFunctionMatch) {
            componentName = anyFunctionMatch[1]
            console.log('Found component via fallback:', componentName)
          }
        }
        
        if (componentName) {
          // CRITICAL: Keep the component function definition OUTSIDE App function
          // Then add App function that returns it
          // The component function should remain at the top level, not inside App
          cleanCode = cleanCode + '\n\nfunction App() {\n  if (typeof ' + componentName + ' === "undefined") {\n    console.error("ERROR: Component ' + componentName + ' is not defined!");\n    return React.createElement("div", null, "Error: Component ' + componentName + ' not found");\n  }\n  return React.createElement(' + componentName + ');\n}'
          console.log('Final code structure: Component function + App function that returns it')
          console.log('Component name:', componentName)
          console.log('Code preview:', cleanCode.substring(0, 400))
        } else {
          // Last resort: wrap and return the code directly
          console.log('No component name found, wrapping code directly')
          // Check if code already has a return statement
          if (cleanCode.includes('return')) {
            cleanCode = 'function App() {\n' + cleanCode + '\n}'
          } else {
            cleanCode = 'function App() {\n  return (\n' + cleanCode + '\n  );\n}'
          }
        }
      }
      // Otherwise, assume it's JSX that needs to be returned
      else {
        cleanCode = 'function App() {\n  return (\n' + cleanCode + '\n  );\n}'
        console.log('Wrapped JSX in App function')
      }
      
      console.log('Wrapped in function App():', cleanCode.substring(0, 400) + '...')
      console.log('Final cleanCode length:', cleanCode.length)
    } else {
      console.log('Code already has App declaration, checking if it returns correctly...')
      // Check if existing App function has a return statement
      if (cleanCode.includes('function App') && !cleanCode.match(/function\s+App\s*\([^)]*\)\s*\{[^}]*return/)) {
        console.warn('WARNING: App function exists but may not have return statement!')
        console.log('App function code:', cleanCode.match(/function\s+App\s*\([^)]*\)\s*\{[^}]*\}/)?.[0] || 'not found')
      }
    }

    // Escape the code for embedding in HTML script tag
    // Need to escape: </script> tags and handle special characters
    const escapedCode = cleanCode
      .replace(/<\/script>/gi, '<\\/script>')  // Escape closing script tags (critical!)
      .replace(/<!--/g, '<\\!--')             // Escape HTML comments start
      .replace(/-->/g, '--\\>')               // Escape HTML comments end
      .replace(/<script/gi, '<\\script')       // Escape opening script tags too

    console.log('Final escaped code:', escapedCode.substring(0, 300) + '...')
    console.log('Code length:', escapedCode.length)

    // Create a complete HTML preview with the actual generated code
    const previewHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Generated App - Live Preview</title>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
    <script crossorigin src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.6/babel.min.js"></script>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/lucide-react/0.263.1/umd/lucide-react.js"></script>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
          'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        overflow: hidden;
      }

      .preview-container {
        width: 100%;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        box-sizing: border-box;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 100%;
      }

      .loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        color: white;
        text-align: center;
      }

      .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }

      .error {
        max-width: 700px;
        margin: 40px auto;
        padding: 32px;
        background: white;
        color: #dc2626;
        border-radius: 16px;
        border: 2px solid #fecaca;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .error h3 {
        margin: 0 0 12px 0;
        font-size: 20px;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .error p {
        margin: 12px 0;
        line-height: 1.6;
        color: #7f1d1d;
      }

      .error-details {
        background: #fef2f2;
        padding: 16px;
        border-radius: 8px;
        margin-top: 20px;
        font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
        font-size: 13px;
        word-break: break-all;
        border-left: 4px solid #dc2626;
      }

      .success-message {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
        color: white;
        padding: 14px 24px;
        border-radius: 12px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        font-weight: 600;
        font-size: 14px;
        opacity: 0;
        transform: translateY(100px);
        transition: all 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        z-index: 1001;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .success-message.show {
        opacity: 1;
        transform: translateY(0);
      }
    </style>
  </head>
  <body>
    <div id="loading" class="loading">
      <div class="loading-spinner"></div>
      <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Loading Preview...</div>
      <div style="font-size: 14px; opacity: 0.8;">Compiling React component</div>
    </div>

    <div id="root" class="preview-container" style="display: none;"></div>

    <div id="success-message" class="success-message">
      <span>✨</span>
      <span>Preview loaded successfully!</span>
    </div>
    
    <script type="text/babel">
      // Enhanced icon components using Lucide React
      const IconComponent = ({ name, className = "w-4 h-4", ...props }) => {
        try {
          if (window.lucideReact && window.lucideReact[name]) {
            const IconComp = window.lucideReact[name];
            return React.createElement(IconComp, {
              className: className,
              ...props
            });
          }
        } catch (e) {
          console.log('Lucide icon not available, using fallback');
        }

        // Fallback to Unicode symbols
        const icons = {
          play: "▶", pause: "⏸", rotate: "🔄", trophy: "🏆", target: "🎯",
          zap: "⚡", sparkles: "✨", mail: "✉", lock: "🔒", user: "👤",
          alert: "⚠", check: "✓", calendar: "📅", clock: "🕐", arrow: "→",
          star: "⭐", rocket: "🚀", shield: "🛡", copy: "📋", download: "⬇",
          eye: "👁", search: "🔍", cloud: "☁", sun: "☀", cloudrain: "🌧",
          wind: "💨", thermometer: "🌡", droplets: "💧", mappin: "📍",
          refreshcw: "🔄", heart: "❤", bell: "🔔", settings: "⚙", menu: "☰"
        };

        return React.createElement('span', {
          className: className + " inline-block",
          ...props
        }, icons[name] || "?");
      };

      // Initialize Lucide icons in global scope
      if (window.lucideReact) {
        const iconNames = [
          'Play', 'Pause', 'RotateCcw', 'Trophy', 'Target', 'Zap', 'Sparkles',
          'Mail', 'Lock', 'User', 'AlertCircle', 'Check', 'Calendar', 'Clock',
          'ArrowRight', 'Star', 'Rocket', 'Shield', 'Search', 'Cloud', 'Sun',
          'CloudRain', 'Wind', 'Thermometer', 'Droplets', 'MapPin', 'RefreshCw',
          'Heart', 'Bell', 'Settings', 'Menu', 'X', 'Plus', 'Minus', 'Edit',
          'Trash', 'Save', 'Download', 'Upload', 'Copy', 'Eye', 'EyeOff'
        ];
        
        iconNames.forEach(name => {
          if (window.lucideReact[name]) {
            window[name] = window.lucideReact[name];
          }
        });
      }

      // Create icon wrapper components
      const createIconWrapper = (name) => (props) => {
        if (window[name]) {
          return React.createElement(window[name], props);
        }
        return React.createElement(IconComponent, { name: name.toLowerCase(), ...props });
      };

      const Play = createIconWrapper('Play');
      const Pause = createIconWrapper('Pause');
      const RotateCcw = createIconWrapper('RotateCcw');
      const Trophy = createIconWrapper('Trophy');
      const Target = createIconWrapper('Target');
      const Zap = createIconWrapper('Zap');
      const Sparkles = createIconWrapper('Sparkles');
      const Mail = createIconWrapper('Mail');
      const Lock = createIconWrapper('Lock');
      const User = createIconWrapper('User');
      const AlertCircle = createIconWrapper('AlertCircle');
      const Check = createIconWrapper('Check');
      const Calendar = createIconWrapper('Calendar');
      const Clock = createIconWrapper('Clock');
      const ArrowRight = createIconWrapper('ArrowRight');
      const Star = createIconWrapper('Star');
      const Rocket = createIconWrapper('Rocket');
      const Shield = createIconWrapper('Shield');
      const Search = createIconWrapper('Search');
      const Cloud = createIconWrapper('Cloud');
      const Sun = createIconWrapper('Sun');
      const CloudRain = createIconWrapper('CloudRain');
      const Wind = createIconWrapper('Wind');
      const Thermometer = createIconWrapper('Thermometer');
      const Droplets = createIconWrapper('Droplets');
      const MapPin = createIconWrapper('MapPin');
      const RefreshCw = createIconWrapper('RefreshCw');
      const Heart = createIconWrapper('Heart');
      const Bell = createIconWrapper('Bell');
      const Settings = createIconWrapper('Settings');
      const Menu = createIconWrapper('Menu');
      const X = createIconWrapper('X');
      const Plus = createIconWrapper('Plus');
      const Minus = createIconWrapper('Minus');
      const Edit = createIconWrapper('Edit');
      const Trash = createIconWrapper('Trash');
      const Save = createIconWrapper('Save');
      const Download = createIconWrapper('Download');
      const Upload = createIconWrapper('Upload');
      const Copy = createIconWrapper('Copy');
      const Eye = createIconWrapper('Eye');
      const EyeOff = createIconWrapper('EyeOff');

      // Component code - Babel will compile this automatically
      // Note: Code is embedded directly here, Babel will transform JSX automatically

      ${escapedCode}
      
      // Debug: Check if App is defined after Babel compilation
      console.log('=== After Babel compilation ===');
      console.log('typeof App:', typeof App);
      console.log('Babel version:', window.Babel?.version || 'unknown');
      console.log('React version:', window.React?.version || 'unknown');
      console.log('ReactDOM version:', window.ReactDOM?.version || 'unknown');
      
      if (typeof App !== 'undefined') {
        console.log('✅ App function exists');
        try {
          const testResult = App();
          console.log('App() call result:', testResult);
          if (!testResult) {
            console.error('ERROR: App() returned null/undefined!');
            console.error('App function code:', App.toString());
            // Try to find what components are available
            console.log('Available components:', Object.keys(window).filter(k => typeof window[k] === 'function' && /^[A-Z]/.test(k)));
          } else {
            console.log('✅ App() returns valid React element');
          }
        } catch (e) {
          console.error('ERROR calling App():', e);
          console.error('Error stack:', e.stack);
        }
      } else {
        console.error('❌ ERROR: App is not defined after Babel compilation!');
        // List all functions defined
        const allFunctions = Object.keys(window).filter(k => typeof window[k] === 'function');
        console.log('Available functions:', allFunctions.slice(0, 20)); // Show first 20
        console.log('Total functions:', allFunctions.length);
        
        // Check for Babel compilation errors
        if (window.Babel && window.Babel.transform) {
          try {
            const testTransform = window.Babel.transform('function Test() { return <div>Test</div>; }', { presets: ['react'] });
            console.log('Babel transform test successful');
          } catch (babelErr) {
            console.error('Babel transform test failed:', babelErr);
          }
        }
      }

      // After Babel compiles, App should be available
      // Wait for Babel to compile and DOM to be ready
      (function() {
        let checkCount = 0;
        const maxChecks = 150; // Maximum 15 seconds (150 * 100ms)
        let babelLoadTimeout = false;
        
        const checkAndRender = function() {
          checkCount++;

          console.log('Check attempt', checkCount, 'typeof App:', typeof App, 'Babel loaded:', typeof window.Babel);

          try {
            // Check if Babel is loaded
            if (typeof window.Babel === 'undefined') {
              if (checkCount < 30) {
                // Wait for Babel to load (up to 3 seconds)
                setTimeout(checkAndRender, 100);
                return;
              } else {
                babelLoadTimeout = true;
                throw new Error('Babel compiler failed to load after 3 seconds. Please check your internet connection and try again.');
              }
            }
            
            // Verify App component exists
            if (typeof App === 'undefined') {
              // If we've checked too many times, show error with more details
              if (checkCount >= maxChecks) {
                // Check for Babel errors in console
                const errorMsg = babelLoadTimeout
                  ? 'Babel compiler failed to load. Please check your internet connection.'
                  : 'App component not found after compilation timeout. The code may have syntax errors. Check browser console for Babel compilation errors.';
                throw new Error(errorMsg);
              }
              
              // Wait a bit more for Babel to compile
              setTimeout(checkAndRender, 100);
              return;
            }

            // Hide loading and show content
            const loadingEl = document.getElementById('loading');
            const rootEl = document.getElementById('root');
            
            if (!rootEl) {
              throw new Error('Root element not found');
            }
            
            if (loadingEl) loadingEl.style.display = 'none';
            rootEl.style.display = 'block';
            
            // Ensure root element fills the container
            rootEl.style.width = '100%';
            rootEl.style.height = '100%';
            rootEl.style.minHeight = '100vh';
            rootEl.style.display = 'flex';
            rootEl.style.flexDirection = 'column';

            // Render the component
            try {
              console.log('About to render App component:', App);
              console.log('App type:', typeof App);
              const appCodeStr = App.toString();
              console.log('App function:', appCodeStr.substring(0, 500));
              
              // Check if App function returns something
              if (!appCodeStr.includes('return')) {
                console.error('ERROR: App function does not have a return statement!');
                console.error('App function code:', appCodeStr);
                throw new Error('App function must return a React element');
              }
              
              // Test if App function actually returns something
              let appResult;
              try {
                appResult = App();
                console.log('App function result:', appResult);
                if (!appResult) {
                  console.error('ERROR: App function returned null/undefined!');
                  throw new Error('App function returned null or undefined');
                }
              } catch (testError) {
                console.error('ERROR calling App function:', testError);
                throw testError;
              }
              
              // Clear any existing content
              rootEl.innerHTML = '';
              
              const root = ReactDOM.createRoot(rootEl);
              const appElement = React.createElement(App);
              console.log('Created App element:', appElement);
              root.render(appElement);
              
              console.log('Component rendered successfully');
              
              // Verify content was rendered
              setTimeout(() => {
                if (rootEl.children.length === 0) {
                  console.error('ERROR: Root element has no children after render!');
                  console.error('Root element:', rootEl);
                  console.error('Root element innerHTML:', rootEl.innerHTML);
                  // Try to render directly
                  try {
                    const directResult = App();
                    console.log('Direct App() call result:', directResult);
                    if (directResult) {
                      rootEl.innerHTML = '';
                      const directRoot = ReactDOM.createRoot(rootEl);
                      directRoot.render(directResult);
                      console.log('Rendered directly, retrying...');
                    }
                  } catch (e) {
                    console.error('Failed to render directly:', e);
                  }
                } else {
                  console.log('Root element children count:', rootEl.children.length);
                }
              }, 500);

              // Show success message
              setTimeout(function() {
                const successMsg = document.getElementById('success-message');
                if (successMsg) {
                  successMsg.classList.add('show');
                  setTimeout(function() {
                    successMsg.classList.remove('show');
                  }, 3000);
                }
              }, 500);
            } catch (renderError) {
              throw new Error('Failed to render component: ' + renderError.message);
            }
          } catch (error) {
            console.error('Render error:', error);
            console.error('Error stack:', error.stack);
            const loadingEl = document.getElementById('loading');
            if (loadingEl) {
              loadingEl.innerHTML = \`
                <div class="error">
                  <h3>❌ Render Error</h3>
                  <p><strong>Could not render the component:</strong></p>
                  <p>\${error.message}</p>
                  <div class="error-details">
                    <strong>Error Details:</strong><br>
                    \${error.stack || 'No stack trace available'}
                  </div>
                  <div class="error-details" style="margin-top: 16px;">
                    <strong>Possible causes:</strong><br>
                    • Syntax errors in generated code<br>
                    • Missing React imports<br>
                    • Invalid JSX syntax<br>
                    • Babel compilation failed<br>
                    • Component code is incomplete<br>
                    • Network issues loading Babel/React libraries
                  </div>
                  <p style="margin-top: 16px; font-size: 14px; color: #7f1d1d;">
                    💡 <strong>Tip:</strong> Open browser console (F12) to see detailed error messages. Try refreshing the preview or regenerating the code.
                  </p>
                </div>
              \`;
            }
          }
        };

        // Start checking after a short delay to allow Babel to compile
        setTimeout(checkAndRender, 500);
      })();

    </script>
  </body>
</html>
`

    return new NextResponse(previewHtml, {
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error: any) {
    console.error('Error generating preview:', error)
    return NextResponse.json(
      { error: 'Failed to generate preview: ' + error.message },
      { status: 500 }
    )
  }
}


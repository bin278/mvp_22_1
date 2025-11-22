# mornFront

**One word to app front** - A streamlined frontend application

🌐 **Live at**: [mornhub.dev](https://mornhub.dev)

## Overview

mornFront is an AI-powered frontend code generator that transforms your ideas into production-ready React applications. Simply describe your UI idea, and get a complete, downloadable project with all necessary files to run locally.

### ✨ Key Features

- 🎨 **v0.com-like Generation** - Describe your UI and get sophisticated, production-ready React/TypeScript applications
- 📦 **Complete Project Structure** - Get all files in a proper ZIP structure with dependencies, configs, and documentation
- 🚀 **Instant Live Preview** - See your generated app running immediately with full interactivity
- 🎯 **Smart Template Detection** - Automatically detects project type (AI tools, dashboards, games, landing pages, forms, pricing, blogs)
- 💻 **Production Ready** - Generated code includes modern best practices, TypeScript, Tailwind CSS, and proper architecture
- 🌟 **Professional Quality** - Like v0.com, generates real-world applications with interactive features, animations, and responsive design
- 🌍 **Bilingual Support** - Full support for English and Chinese

## Project Details

- **Project Code**: MVP_22
- **Domain**: mornhub.dev
- **Type**: Frontend Application

## Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- pnpm package manager (or npm/yarn)
- Docker (optional, for containerized deployment)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd mvp_22

# Install dependencies
pnpm install
# or npm install
```

### Development

```bash
# Start development server on port 3009
PORT=3009 pnpm dev

# or with npm
npm run dev
```

The application will be available at:
- http://localhost:3009
- http://localhost:3009/generate - Code generator interface

### Docker Deployment

This project supports Docker deployment for easy orchestration:

```bash
# Build and start all services
docker compose up -d

# Stop all services
docker compose down
```

## Deployment

### Vercel Deployment

This project is deployed on Vercel. To set up your own deployment:

1. Connect your repository to Vercel
2. Configure two DNS records pointing to your domain (mornhub.dev)
3. Deploy

### DNS Configuration

Ensure the following DNS records are configured for `mornhub.dev`:
- A record or CNAME pointing to Vercel's servers
- Additional DNS records as required by Vercel

## How to Use the Generator

### 1. Access the Generator

Navigate to http://localhost:3009/generate in your browser

### 2. Describe Your UI

Enter a description of the frontend you want to create. Examples:
- "A modern dashboard with analytics charts"
- "A pricing page with 3 tiers"
- "A signup form with email validation"
- "A blog page with article cards"
- "A landing page for a SaaS product"
- "A game page with target practice"

### 3. Generate Code

Click the "Generate UI Code" button and wait a few seconds

### 4. Browse Generated Files

- View all generated files in the file browser
- Click on any file to view its contents
- Switch between different files to explore the project structure

### 5. Live Preview

Click **"Live Preview"** to see your generated app running instantly in a new window

### 6. Download ZIP

Click **"Download ZIP"** to get all project files in a proper ZIP structure

### 7. Run Locally

```bash
# Extract the downloaded ZIP file
unzip your-project-name.zip
cd your-project-name

# Install dependencies
npm install

# Start the development server
npm run dev

# Open http://localhost:3000
```

## Project Structure

```
mvp_22/
├── app/
│   ├── page.tsx              # Home page
│   ├── generate/
│   │   └── page.tsx          # Code generator UI
│   └── api/
│       └── generate/
│           └── route.ts      # API endpoint for code generation
├── lib/
│   ├── code-generator.ts     # Code generation logic with templates
│   └── download-helper.ts    # Download functionality
├── components/               # Reusable UI components
├── frontends/                # Additional frontend projects
├── scripts/                  # Utility and automation scripts
├── backup/                   # Backup and recovery scripts
└── logs/                     # Application logs
```

## Generated Project Features

Each generated project includes:

✅ **Full TypeScript Setup** - Complete tsconfig.json with strict mode  
✅ **Vite Build System** - Lightning-fast development and builds  
✅ **Tailwind CSS** - Utility-first CSS framework pre-configured  
✅ **React 18+** - Latest React features and hooks  
✅ **Lucide Icons** - Beautiful icon library  
✅ **Production Ready** - Optimized build configuration  
✅ **Git Ready** - .gitignore file included

## Scripts

All utility scripts should be placed in the `scripts/` folder with proper documentation:
- **Backup scripts**: Stored in timeline folders with source locations and recovery methods
- **Recovery scripts**: Distinguished from backup scripts in the backup folder

## Supported Templates

mornFront intelligently detects your needs and generates appropriate code:

### 🤖 AI Tool Website
Keywords: `ai`, `tool`, `website`, `app`, `platform`, `cloth`
- Interactive AI generation with loading states
- Modern gradient design with glassmorphism
- Professional header with navigation
- Hero section with call-to-action buttons
- Features showcase with icons
- Results section with real-time updates
- Stats display and footer

### 🎯 Dashboard
Keywords: `dashboard`, `analytics`
- Analytics cards with stats
- Chart placeholders (recharts compatible)
- Activity feed
- Navigation header

### 🚀 Landing Page
Keywords: `landing`, `homepage`, `marketing`
- Hero section with CTA
- Features grid
- Testimonials section
- Modern gradient design

### 📝 Form Page
Keywords: `form`, `signup`, `login`
- Input fields with icons
- Form validation
- Error handling
- Responsive design

### 💰 Pricing Page
Keywords: `pricing`
- Multi-tier pricing cards
- Feature comparison
- Popular tier highlighting
- CTA buttons

### 📰 Blog Page
Keywords: `blog`, `article`
- Article cards with images
- Author and date information
- Responsive grid layout
- Read time estimates

### 🎮 Game Page
Keywords: `game`, `gaming`, `play`
- Interactive target practice game
- Score tracking and timer
- Pause/resume functionality
- Game states (waiting, playing, game over)
- Responsive controls

### ⚡ Generic App
- Fallback template for any description
- Clean, customizable starting point
- Modern gradient design

## Development Workflow

1. **Frontend Development**: All frontend work should be done in the `frontends/` folder
2. **Docker First**: Prefer using Docker Compose to run all services instead of manual starts
3. **Documentation**: Keep this README updated as the project evolves

## API Endpoints

### POST /api/generate

Generate frontend code based on a text description.

**Request:**
```json
{
  "prompt": "A modern dashboard with analytics"
}
```

**Response:**
```json
{
  "success": true,
  "project": {
    "projectName": "a-modern-dashboard-with-analytics",
    "files": {
      "package.json": "...",
      "src/App.tsx": "...",
      "...": "..."
    }
  }
}
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Tech Stack

### Main Application
- **Framework**: Next.js 15.2.4 with React 19
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **Icons**: Lucide React
- **Language**: TypeScript

### Generated Projects
- **Framework**: Vite + React 18
- **Styling**: Tailwind CSS v3
- **Build Tool**: Vite 5
- **Language**: TypeScript

## Troubleshooting

### Port Already in Use

If port 3009 is already in use:
```bash
# Find and kill the process
lsof -ti:3009 | xargs kill -9

# Or use a different port
PORT=3010 pnpm dev
```

### Generated Code Issues

If the generated code has issues:
1. Make sure all files are created correctly
2. Run `npm install` to install dependencies
3. Check that Node.js version is 18 or higher
4. Ensure all required directories exist (e.g., `src/`)

### Download Not Working

If downloads don't start:
1. Check browser permissions for downloads
2. Disable popup blockers temporarily
3. Try a different browser

## Future Enhancements

- 🔄 Live preview of generated UI
- 🎨 Custom styling options
- 📦 Direct ZIP file downloads
- 🤖 AI-powered code generation
- 🌐 Deploy directly to Vercel
- 🔗 GitHub repository creation
- 💾 Save and manage multiple projects

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## Support

For issues or questions, please open an issue in the repository.

## License

[Specify your license here]

---

**Built with ❤️ for mornhub.dev**

*Transform ideas into code, instantly.*


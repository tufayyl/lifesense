# LifeSense - Health Monitoring Dashboard

A modern health monitoring dashboard with AI-powered health assistant, temperature tracking, and vital signs visualization.

## Features

- 📊 **Health Dashboard** - View your health overview and quick stats
- 🌡️ **Temperature Tracking** - Monitor temperature trends with interactive charts
- ❤️ **Vital Signs** - Real-time Heart Rate and SpO₂ monitoring
- 🤖 **AI Health Assistant** - Get health-related guidance from an AI assistant
- 🎨 **Modern UI** - Beautiful, responsive design with dark mode support

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express (local) / Vercel Serverless Functions (production)
- **AI**: OpenRouter API
- **Database**: Supabase
- **Charts**: Chart.js

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file with your environment variables:
   ```
   OPENROUTER_API_KEY=your_key_here
   OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   ```

3. Run the development server:
   ```bash
   npm start
   ```

4. Open http://localhost:3000 in your browser

## Deployment to Vercel

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel project settings
4. Deploy!

See [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.

## Project Structure

```
laipsense/
├── api/
│   └── chat.js          # Vercel serverless function for chat API
├── index.html           # Main dashboard page
├── script.js            # Dashboard functionality
├── chatbot.js           # AI chat assistant
├── temp-graph.js        # Temperature chart visualization
├── vitals-graphs.js     # Heart rate and SpO₂ charts
├── styles.css           # Styling
├── server.js            # Local development server
├── package.json         # Dependencies and scripts
└── vercel.json          # Vercel configuration
```

## Environment Variables

- `OPENROUTER_API_KEY` (required) - Your OpenRouter API key
- `OPENROUTER_MODEL` (optional) - AI model to use
- `SUPABASE_URL` (optional) - Supabase project URL
- `SUPABASE_ANON_KEY` (optional) - Supabase anonymous key

## License

ISC


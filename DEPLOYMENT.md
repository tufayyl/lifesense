# Deployment Guide for Vercel

## Environment Variables

Before deploying to Vercel, make sure to set these environment variables in your Vercel project settings:

1. **OPENROUTER_API_KEY** - Your OpenRouter API key
2. **OPENROUTER_MODEL** (optional) - Default: `meta-llama/llama-3.1-8b-instruct`
3. **SUPABASE_URL** (optional) - Default: `https://bbrleisgatjcrlnxatcc.supabase.co`
4. **SUPABASE_ANON_KEY** (optional) - Your Supabase anonymous key

## Steps to Deploy

1. Push your code to GitHub
2. Import the project in Vercel
3. Add the environment variables in Vercel project settings
4. Deploy!

## Local Development

1. Install dependencies: `npm install`
2. Create a `.env` file with the environment variables
3. Run: `npm start` or `npm run dev`

## Notes

- The `server.js` file is for local development only
- Vercel uses the `api/chat.js` serverless function for production
- Static files (HTML, CSS, JS) are automatically served by Vercel


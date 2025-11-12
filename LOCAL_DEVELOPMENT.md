# Local Development Guide

## Important: Run the Development Server

**DO NOT** open `index.html` directly in your browser (file:// protocol). This will cause CORS errors and the API won't work.

## Steps to Run Locally:

1. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

2. **Create a `.env` file** in the project root:
   ```
   OPENROUTER_API_KEY=your_openrouter_api_key_here
   OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct
   SUPABASE_URL=https://bbrleisgatjcrlnxatcc.supabase.co
   SUPABASE_ANON_KEY=your_supabase_anon_key_here
   PORT=3000
   ```

3. **Start the development server**:
   ```bash
   npm start
   ```
   or
   ```bash
   node server.js
   ```

4. **Open your browser** and go to:
   ```
   http://localhost:3000
   ```

## Why Use the Server?

- The `/api/chat` endpoint only works when running through the server
- Opening HTML files directly (file://) causes CORS errors
- The server serves all static files and handles API requests

## Troubleshooting

### "Failed to fetch" or CORS errors
- Make sure you're running `npm start` or `node server.js`
- Access the site via `http://localhost:3000`, not by opening the HTML file directly

### Multiple Supabase client warnings
- This is a warning, not an error
- The app will still work, but we're working to fix it
- Make sure `supabase-init.js` loads before other scripts

### API not working
- Check that `OPENROUTER_API_KEY` is set in your `.env` file
- Make sure the server is running on port 3000
- Check the server console for error messages


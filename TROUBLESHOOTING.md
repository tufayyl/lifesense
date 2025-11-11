# Troubleshooting Guide

## Chatbot Not Working - 401 Error

### Error: "Invalid OpenRouter API key"

This means your `OPENROUTER_API_KEY` is set in Vercel but is either:
- Incorrect/typo
- Expired
- Not activated
- Missing the `sk-or-v1-` prefix

### Steps to Fix:

1. **Get a New API Key from OpenRouter:**
   - Go to https://openrouter.ai/keys
   - Sign in to your account
   - Click "Create Key"
   - Copy the key (it should start with `sk-or-v1-`)

2. **Update in Vercel:**
   - Go to your Vercel project dashboard
   - Settings → Environment Variables
   - Find `OPENROUTER_API_KEY`
   - Click Edit
   - Paste the new key (make sure there are no extra spaces)
   - Save

3. **Redeploy:**
   - Go to Deployments tab
   - Click the three dots on the latest deployment
   - Click "Redeploy"
   - Or push a new commit to trigger auto-deploy

4. **Verify:**
   - Wait for deployment to complete
   - Test the chatbot
   - Check Vercel function logs if still not working

### Common Issues:

- **Key has extra spaces:** Make sure there are no spaces before/after the key
- **Wrong environment:** Make sure the key is set for Production, Preview, AND Development
- **Key not saved:** After adding, make sure to click "Save"
- **Old deployment:** Make sure you redeploy after adding the key

### Check Your API Key Format:

A valid OpenRouter API key should:
- Start with `sk-or-v1-`
- Be about 50-60 characters long
- Have no spaces or line breaks

### Test Your API Key:

You can test your API key directly using curl:

```bash
curl https://openrouter.ai/api/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY_HERE"
```

If you get a 401, the key is invalid.
If you get a list of models, the key is valid.


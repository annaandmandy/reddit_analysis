import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Reddit API OAuth token cache
let accessToken = null;
let tokenExpiry = null;

/**
 * Get Reddit OAuth access token
 */
async function getRedditAccessToken() {
  // Return cached token if still valid
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const clientId = process.env.REDDIT_CLIENT_ID;
  const clientSecret = process.env.REDDIT_CLIENT_SECRET;
  const userAgent = process.env.REDDIT_USER_AGENT || 'reddit-3d-app/1.0.0';

  if (!clientId || !clientSecret) {
    throw new Error('Reddit API credentials not configured. Please check your .env file.');
  }

  try {
    // Create Basic Auth header
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    // Request access token
    const response = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': userAgent
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get access token: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry for safety
    tokenExpiry = Date.now() + ((data.expires_in - 300) * 1000);

    console.log('Successfully obtained Reddit access token');
    return accessToken;
  } catch (error) {
    console.error('Error getting Reddit access token:', error);
    throw error;
  }
}

/**
 * Fetch Reddit thread data
 */
app.get('/api/reddit/thread', async (req, res) => {
  try {
    const { url } = req.query;

    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // Validate Reddit URL
    if (!url.includes('reddit.com')) {
      return res.status(400).json({ error: 'Invalid Reddit URL' });
    }

    // Get access token
    const token = await getRedditAccessToken();
    const userAgent = process.env.REDDIT_USER_AGENT || 'reddit-3d-app/1.0.0';

    // Convert to JSON endpoint and use OAuth domain
    // When using OAuth tokens, Reddit requires oauth.reddit.com instead of www.reddit.com
    let jsonUrl = url.replace(/\/$/, '') + '.json';
    jsonUrl = jsonUrl.replace('www.reddit.com', 'oauth.reddit.com');
    jsonUrl = jsonUrl.replace('old.reddit.com', 'oauth.reddit.com');

    console.log(`Fetching Reddit thread: ${jsonUrl}`);

    // Fetch from Reddit API
    const response = await fetch(jsonUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': userAgent
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Reddit API error: ${response.status} ${errorText}`);
      return res.status(response.status).json({
        error: `Failed to fetch Reddit thread: ${response.status} ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();

    // Return the data
    res.json(data);
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Reddit API proxy server is running',
    hasCredentials: !!(process.env.REDDIT_CLIENT_ID && process.env.REDDIT_CLIENT_SECRET)
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Reddit API proxy server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);

  // Check for credentials
  if (!process.env.REDDIT_CLIENT_ID || !process.env.REDDIT_CLIENT_SECRET) {
    console.warn('⚠️  WARNING: Reddit API credentials not found in .env file');
    console.warn('   Please add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET to .env');
  } else {
    console.log('✅ Reddit API credentials loaded');
  }
});

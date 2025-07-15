const express = require('express');
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

/**
 * Create HTTPS agent with p12 certificate for JPMorgan API authentication
 * 
 * SECURITY NOTE: The p12 certificate contains your private key and is used for
 * mutual TLS authentication with JPMorgan's API. This certificate must be:
 * - Issued by JPMorgan for your specific organization
 * - Stored securely and never committed to version control
 * - Rotated according to JPMorgan's security policies
 * - Protected with appropriate file permissions
 */
function createHttpsAgent() {
  try {
    const certPath = process.env.P12_CERT_PATH;
    const certPassword = process.env.P12_CERT_PASSWORD;
    
    if (!certPath || !certPassword) {
      throw new Error('P12_CERT_PATH and P12_CERT_PASSWORD must be set in .env file');
    }

    // Read the p12 certificate file
    const pfx = fs.readFileSync(certPath);
    
    // Create HTTPS agent with the certificate
    return new https.Agent({
      pfx: pfx,
      passphrase: certPassword,
      rejectUnauthorized: false // Set to true in production
    });
  } catch (error) {
    console.error('Error creating HTTPS agent:', error.message);
    throw error;
  }
}

/**
 * Create an embedded UI session using JPMorgan's session transfer API
 * 
 * This implements the "Partially Hosted" integration pattern where:
 * - Your backend handles authentication (p12 certificate)
 * - JPMorgan provides the UI experience (embedded iframe)
 * - Session tokens are short-lived and single-use for security
 * 
 * @param {string} clientId - The client ID provisioned in JPMorgan's system
 * @returns {Promise<Object>} Session data including temporary token and iframe URL
 */
async function createEmbeddedSession(clientId) {
  try {
    const httpsAgent = createHttpsAgent();
    
    const requestData = {
      type: 'EMBEDDED_UI',
      target: {
        id: clientId,
        type: 'CLIENT'
      }
    };

    console.log('Making API call to create session for client:', clientId);
    
    const response = await axios.post(
      `${process.env.API_BASE_URL}/onboarding/v1/sessions`,
      requestData,
      {
        httpsAgent: httpsAgent,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Session created successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating session:', error.response?.data || error.message);
    throw error;
  }
}

/**
 * Route: GET /
 * Serves the main HTML form where users can enter their client ID
 */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * Route: POST /sessions
 * Creates a new embedded UI session and returns the iframe URL
 * Matches JPMorgan API endpoint pattern
 */
app.post('/sessions', async (req, res) => {
  try {
    const { clientId } = req.body;
    
    // Validate input
    if (!clientId || clientId.trim() === '') {
      return res.status(400).json({ 
        error: 'Client ID is required' 
      });
    }

    // Create session with JPMorgan API
    const sessionData = await createEmbeddedSession(clientId.trim());
    
    // Construct the iframe URL with token
    const iframeUrl = `${sessionData.url}?token=${sessionData.token}`;
    
    // Return session data
    res.json({
      success: true,
      sessionId: sessionData.id,
      iframeUrl: iframeUrl,
      clientId: clientId
    });
    
  } catch (error) {
    console.error('Error in /sessions:', error.message);
    res.status(500).json({ 
      error: 'Failed to create session. Please check your certificate configuration and client ID.' 
    });
  }
});

/**
 * Route: GET /embed
 * Returns the iframe HTML content for embedding in the same window
 */
app.get('/embed', (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'Missing iframe URL parameter' });
  }

  const html = `
    <iframe 
      src="${url}" 
      title="Embedded Finance Onboarding"
      class="embedded-iframe"
      sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-top-navigation"
      scrolling="auto"
      frameborder="0"
    ></iframe>
  `;
  
  res.json({ html });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Open your browser and navigate to the URL above to test the embedded finance experience`);
  console.log(`🔐 Make sure your .env file is configured with your p12 certificate details`);
}); 
# 🏦 JPMorgan Embedded Finance - Session Transfer Demo

A minimal demonstration of JPMorgan's **Partially Hosted Onboarding** integration pattern using session transfer API with certificate authentication.

## 📋 Overview

This demo implements JPMorgan's recommended session transfer approach for embedded onboarding:

1. **Certificate Authentication**: Server authenticates with JPMorgan API using p12 client certificate
2. **Session Creation**: Secure server-side API call creates temporary embedded UI session
3. **Token Handoff**: Short-lived, single-use token enables secure session transfer
4. **Embedded Experience**: Client onboarding occurs within your application context via iframe

**Integration Pattern**: Partially Hosted - your backend handles authentication, JPMorgan handles the UI experience.

## 🚀 Quick Start

### Prerequisites

- Node.js (v14 or higher)
- **Valid JPMorgan p12 certificate** issued by JPMorgan for API authentication
- **Sandbox access** to JPMorgan's embedded finance platform
- **Client ID** provisioned in JPMorgan's sandbox environment
- Basic understanding of certificate-based authentication

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```

3. **Configure your .env file:**
   ```env
   # Path to your p12 certificate file
   P12_CERT_PATH=./path/to/your/certificate.p12
   
   # Password for your p12 certificate
   P12_CERT_PASSWORD=your_certificate_password
   
   # JPMorgan API Base URL (sandbox)
   API_BASE_URL=https://api-sandbox.payments.jpmorgan.com
   
   # Server port
   PORT=3000
   
   # JPMorgan Embedded UI Base URL
   EMBEDDED_UI_BASE_URL=https://concourse-test.jpmorgan.com
   ```

4. **Place your p12 certificate file in the project directory and update the path in .env**

### Running the Demo

1. **Start the server:**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

2. **Open your browser:**
   ```
   http://localhost:3000
   ```

3. **Test the demo:**
   - Enter a client ID (e.g., `3100002010`)
   - Click "Create Embedded Session"
   - The iframe will open with the JPMorgan onboarding experience

## 🔧 How It Works

### 1. API Call Structure

The server makes a POST request to JPMorgan's sessions endpoint:

```javascript
const requestData = {
  type: 'EMBEDDED_UI',
  target: {
    id: clientId,        // Client ID from form
    type: 'CLIENT'
  }
};
```

### 2. Certificate Authentication

The server uses your p12 certificate for secure authentication:

```javascript
const httpsAgent = new https.Agent({
  pfx: fs.readFileSync(certPath),
  passphrase: certPassword,
  rejectUnauthorized: false
});
```

### 3. Session Response

JPMorgan returns a session object:

```json
{
  "id": "9000000019",
  "type": "EMBEDDED_UI",
  "target": {
    "id": "3100002010",
    "type": "CLIENT"
  },
  "url": "https://concourse-test.jpmorgan.com/smbdo/app.html",
  "token": "eyJhbGciOiJIUzUxMiJ9..."
}
```

### 4. Iframe Integration

The token is appended to the URL as a query parameter:

```javascript
const iframeUrl = `${sessionData.url}?token=${sessionData.token}`;
```

## 📁 Project Structure

```
server-session-transfer/
├── server.js              # Main Node.js server
├── package.json           # Dependencies and scripts
├── .env.example          # Environment variables template
├── .env                  # Your actual environment variables (not in repo)
├── public/
│   └── index.html        # Client-side form interface
└── README.md            # This file
```

## 🛠️ API Endpoints

### `GET /`
- Serves the main HTML form
- Users can enter their client ID

### `POST /sessions`
- Creates a new embedded UI session (matches JPMorgan API pattern)
- **Body**: `{ "clientId": "3100002010" }`
- **Response**: Session data with iframe URL and token
- **Authentication**: Server-side p12 certificate

### `GET /embed?url=<encoded_url>`
- Returns iframe HTML for embedding in same window
- **Query Parameter**: `url` - The encoded iframe URL with session token
- **Response**: JSON with HTML content for inline rendering

## 🔐 Security & Compliance Notes

### Certificate Management
- **P12 certificates contain private keys** - treat as highly sensitive credentials
- **Never commit certificates or `.env` files** to version control
- **Rotate certificates** according to JPMorgan's security policies
- **Store certificates securely** using enterprise-grade secret management

### Production Security
- **Set `rejectUnauthorized: true`** in HTTPS agent for production
- **Implement proper input validation** and sanitization
- **Add rate limiting** to prevent API abuse
- **Use HTTPS everywhere** - no mixed content
- **Implement proper logging** without exposing sensitive data

### Session Security
- **Tokens are short-lived** (typically 12 hours)
- **Tokens are single-use** - cannot be reused after session completion
- **Sessions are scoped** to specific client and operation type
- **Implement proper session cleanup** and timeout handling

## 🐛 Troubleshooting

### Common Issues

1. **Certificate Error**: Ensure your p12 file path and password are correct
2. **API 401 Unauthorized**: Check that your certificate is valid and not expired
3. **Client ID Invalid**: Verify the client ID exists in your JPMorgan account
4. **CORS Issues**: The iframe content is served from JPMorgan's domain

### Debug Mode

Add this to your .env for verbose logging:
```env
DEBUG=true
```

## 📚 References

- [Partially Hosted Onboarding Integration Guide](https://github.com/jpmorgan-payments/embedded-finance/blob/main/app/client/src/docs/PARTIALLY_HOSTED_ONBOARDING_INTEGRATION_GUIDE.md)

## 🚀 Production Implementation Guidelines

This demo provides a foundation for production implementation. For production deployment:

### Security Enhancements
- **Certificate rotation strategy** with automated renewal
- **Comprehensive input validation** and SQL injection prevention  
- **Rate limiting and DDoS protection** at application and infrastructure level
- **Comprehensive audit logging** for compliance and monitoring
- **Secrets management** using enterprise tools (HashiCorp Vault, AWS Secrets Manager, etc.)

### Operational Excellence
- **Health checks and monitoring** for certificate expiration and API connectivity
- **Error handling with user-friendly messages** while maintaining security
- **Session state management** with proper cleanup and timeout handling
- **Load balancing and high availability** for production traffic
- **Integration testing** with JPMorgan's sandbox and production environments

### Compliance Considerations
- **Follow JPMorgan's integration guidelines** and security requirements
- **Implement proper data handling** according to financial services regulations
- **Document security controls** for audit and compliance purposes
- **Regular security assessments** and penetration testing

For detailed implementation guidance, refer to the [Partially Hosted Onboarding Integration Guide](https://github.com/jpmorgan-payments/embedded-finance/blob/main/app/client/src/docs/PARTIALLY_HOSTED_ONBOARDING_INTEGRATION_GUIDE.md). 
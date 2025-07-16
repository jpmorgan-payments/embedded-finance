# 🔄 Reverse Engineering Prompt: Embedded Finance Session Transfer Platform

## 📋 Architecture Overview

You are tasked with creating a minimal, clean, and well-commented embedded finance platform that demonstrates JPMorgan's session transfer authentication approach. The platform should follow this exact architectural pattern:

### Core Components Required:

1. **Web Server** - Handles HTTP requests and serves static files
2. **Client Certificate Authentication** - Uses p12/pfx certificates for API authentication
3. **Session Management** - Creates and manages embedded UI sessions
4. **Frontend Interface** - Simple form for user input
5. **Iframe Integration** - Displays embedded finance experience

### Authentication Flow:

```
User Input (Client ID) → Server API Call → JPMorgan Session API → Token Generation → Iframe Display
```

## 🏗️ Implementation Requirements

### 1. Server Configuration
- **Port**: Configurable (default 3000)
- **Environment Variables**: All sensitive data in .env file
- **Static File Serving**: Serve HTML/CSS/JS files
- **JSON API**: Handle POST requests for session creation

### 2. Certificate Authentication
- **Certificate Type**: p12/pfx format
- **Storage**: File system, path in environment variables
- **HTTPS Agent**: Custom agent with certificate for API calls
- **Security**: Password protection for certificate files

### 3. API Integration
- **Endpoint**: `POST /onboarding/v1/sessions`
- **Request Body**: 
  ```json
  {
    "type": "EMBEDDED_UI",
    "target": {
      "id": "CLIENT_ID",
      "type": "CLIENT"
    }
  }
  ```
- **Response**: Session object with id, url, and token
- **Error Handling**: Comprehensive error responses

### 4. Frontend Interface
- **Form**: Single input field for Client ID
- **Validation**: Client-side and server-side validation
- **Loading States**: Visual feedback during API calls
- **Success/Error Messages**: Clear user feedback
- **Auto-redirect**: Automatic opening of iframe experience

### 5. Iframe Implementation
- **URL Construction**: `{session.url}?token={session.token}`
- **Responsive Design**: Full-screen iframe with navigation
- **Security**: Proper iframe sandbox attributes
- **User Experience**: Back button, loading indicators

## 🔧 Technical Specifications

### Environment Variables Required:
```env
# Certificate configuration
P12_CERT_PATH=./path/to/certificate.p12
P12_CERT_PASSWORD=certificate_password

# API configuration
API_BASE_URL=https://api-sandbox.payments.jpmorgan.com
EMBEDDED_UI_BASE_URL=https://concourse-test.jpmorgan.com

# Server configuration
PORT=3000
```

### API Endpoints Required:
- `GET /` - Serve main form interface
- `POST /create-session` - Create embedded UI session
- `GET /iframe` - Display embedded experience

### Security Considerations:
- Never expose certificate files or passwords
- Validate all user inputs
- Use HTTPS in production
- Implement proper CORS policies
- Add rate limiting for API calls

## 🎯 Framework-Specific Adaptations

### For Python/Flask:
- Use `requests` library with custom SSL context
- `cryptography` library for certificate handling
- `flask` for web framework
- `python-dotenv` for environment variables

### For C#/.NET:
- Use `HttpClient` with custom certificate handler
- `X509Certificate2` for certificate management
- ASP.NET Core for web framework
- Configuration providers for environment variables

### For Java/Spring:
- Use `RestTemplate` with custom SSL configuration
- `KeyStore` for certificate management
- Spring Boot for web framework
- `@ConfigurationProperties` for environment variables

### For Python/FastAPI:
- Use `httpx` with custom SSL context
- `pydantic` for data validation
- FastAPI for web framework
- `python-multipart` for form handling

### For Go:
- Use `net/http` with custom transport
- `crypto/tls` for certificate handling
- Gin or standard library for web framework
- `godotenv` for environment variables

### For PHP/Laravel:
- Use `GuzzleHttp` with custom SSL configuration
- `openssl` functions for certificate handling
- Laravel for web framework
- Laravel's environment configuration

## 📝 Implementation Template

```
PROJECT_STRUCTURE:
├── server.[ext]              # Main server file
├── package.json/.env/config  # Dependencies and configuration
├── .env.example             # Environment template
├── .gitignore              # Exclude sensitive files
├── public/
│   └── index.html          # Frontend interface
├── README.md               # Setup instructions
└── certificates/           # Certificate directory (gitignored)
```

## 🚀 Sample Implementation Pattern

### 1. Server Setup:
```pseudocode
INITIALIZE server framework
CONFIGURE middleware (JSON parsing, static files)
LOAD environment variables
SETUP certificate authentication
DEFINE API routes
START server
```

### 2. Certificate Authentication:
```pseudocode
FUNCTION createHttpsAgent():
    READ certificate file from P12_CERT_PATH
    PARSE certificate with P12_CERT_PASSWORD
    CREATE HTTPS agent with certificate
    RETURN configured agent
```

### 3. Session Creation:
```pseudocode
FUNCTION createSession(clientId):
    VALIDATE clientId input
    PREPARE request data
    CREATE authenticated HTTP client
    MAKE POST request to JPMorgan API
    PARSE response
    RETURN session data
```

### 4. Frontend Logic:
```pseudocode
FUNCTION handleFormSubmission():
    COLLECT form data
    SHOW loading state
    MAKE API call to server
    HANDLE response (success/error)
    REDIRECT to iframe or show error
```

## 🔍 Key Implementation Details

### Certificate Handling:
- Store certificates outside web root
- Use environment variables for paths
- Implement proper error handling for certificate loading
- Support both p12 and pfx formats

### API Error Handling:
- 400: Invalid client ID or request format
- 401: Certificate authentication failed
- 403: Client not authorized
- 500: Server configuration issues

### Frontend UX:
- Clear explanation of the demo purpose
- Visual feedback for all user actions
- Responsive design for mobile devices
- Accessibility considerations (ARIA labels, keyboard navigation)

### Security Best Practices:
- Never log sensitive data (certificates, passwords, tokens)
- Implement request timeouts
- Add CSRF protection
- Use secure headers
- Validate all inputs

## 📚 Testing Strategy

### Unit Tests:
- Certificate loading and validation
- API request formatting
- Response parsing
- Error handling scenarios

### Integration Tests:
- End-to-end session creation flow
- Certificate authentication
- API error responses
- Frontend form validation

### Manual Testing:
- Test with valid/invalid client IDs
- Test certificate authentication
- Test iframe embedding
- Test error scenarios

## 🎨 UI/UX Guidelines

### Design Principles:
- Clean, minimal interface
- Clear visual hierarchy
- Consistent color scheme (JPMorgan branding)
- Professional appearance
- Mobile-responsive design

### Content Strategy:
- Explain the demo purpose clearly
- Provide sample client ID
- Include setup instructions
- Show clear success/error states
- Provide helpful error messages

## 🔄 Adaptation Prompt

**Use this prompt to generate similar implementations:**

"Create a [FRAMEWORK] implementation of an embedded finance session transfer platform that follows the exact architecture described above. The platform should demonstrate JPMorgan's embedded UI session creation using p12 certificate authentication. Include all specified components: server setup, certificate authentication, API integration, frontend interface, and iframe implementation. Ensure the code is minimal, clean, well-commented, and follows [FRAMEWORK] best practices. Include proper error handling, security considerations, and user experience elements as specified."

**Replace [FRAMEWORK] with your target technology:**
- Python/Flask
- C#/.NET Core
- Java/Spring Boot
- Python/FastAPI
- Go/Gin
- PHP/Laravel
- Ruby/Rails
- Rust/Actix
- etc.

## 📋 Deliverables Checklist

- [ ] Server implementation with certificate authentication
- [ ] Environment configuration template
- [ ] Frontend form interface
- [ ] Iframe integration
- [ ] Error handling and validation
- [ ] Security measures implementation
- [ ] Documentation and README
- [ ] .gitignore with sensitive file exclusions
- [ ] Package/dependency management file
- [ ] Sample client ID for testing

This prompt ensures consistent implementation across different technologies while maintaining the core architectural patterns and security requirements of the JPMorgan embedded finance session transfer approach. 
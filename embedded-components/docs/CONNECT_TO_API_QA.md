# JPMC Payments EFS APIs Integration Guide

> **Note:** This Q&A is currently focused on the digital onboarding API operations and will be extended for the rest of Embedded Finance & Solutions (EF&S) later. Current API reference: https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/onboarding#/


## Quick Reference Documentation

| Document | Summary |
|----------|----------|
| [Embedded Finance Solutions Documentation](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments) | Comprehensive guide covering all aspects of the JPMC Embedded Finance Solutions platform. |
| [API Reference](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview) | Detailed API specifications with endpoint descriptions, request/response formats, and examples. |
| [Authentication Documentation](https://developer.payments.jpmorgan.com/api/authentication) | Explains the authentication mechanisms including mTLS and digital signature requirements. |
| [mTLS with Digital Signature Guide](https://developer.payments.jpmorgan.com/api/mtls-with-digital-signature) | Step-by-step instructions for implementing mTLS with digital signatures for secure API calls. |
| [Testing Catalog](https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/TESTING_CATALOG.md) | Contains test scenarios, magic values, and expected outcomes for testing integrations. |

## Quick Start Q&A

### Authentication & Certificate Setup

#### Q: What certificates do I need for authentication?
A: You need two types of certificates:
- **Transport Certificate (mTLS)** - For authentication and establishing secure connections
- **Digital Signature Certificate** - For signing POST requests

#### Q: How do I set up certificates for api-sandbox.payments.jpmorgan.com?
A: 
1. Generate certificates through an approved Certificate Authority (CA)
2. Upload certificates to the JPMC Payments Developer Portal under the Security section
3. Configure your certificate setup specifically for api-sandbox.payments.jpmorgan.com:
   ```
   Host: api-sandbox.payments.jpmorgan.com
   Certificate: <your-certificate.crt>
   Private key: <your-private-key.key>
   ```

#### Q: Do I need to encrypt the request body?
A: For the api-sandbox.payments.jpmorgan.com endpoints, encryption is not needed. The body should be sent as JSON, not XML.

### API Endpoints

#### Q: What is the base URL for the sandbox environment?
A: Sandbox: `https://api-sandbox.payments.jpmorgan.com/onboarding/v1`

### Making API Calls

#### Q: How do I make API calls to JPMC Embedded Finance APIs?
A: Use your mTLS certificates for authentication. For detailed API specifications and examples, refer to the [JPMC Embedded Finance Solutions documentation](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments) and the [API Reference](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview).

#### Q: Do I need to pass a token in the header?
A: No, authentication is handled via the mTLS certificate that you include with each request.

### Common Errors

#### Q: Why am I getting a 401 Unauthorized error?
A: Check that:
- Your certificates are valid and properly configured
- Your certificates have been uploaded to the Developer Portal
- You're using the correct key/certificate pair for the api-sandbox.payments.jpmorgan.com environment

#### Q: Why am I getting a 400 Bad Request error?
A: Common causes include:
- Sending XML instead of JSON (new endpoints require JSON)
- Malformed request payload
- Missing required fields
- Invalid document format

### Testing Scenarios

#### Q: How can I test document request scenarios?
A: In the sandbox environment, you can:
1. Use magic values in the "external Id" field to trigger specific test cases
2. Refer to the test catalog for step-by-step instructions: https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/TESTING_CATALOG.md

#### Q: How can I get a test case where a seller has outstanding documentation required?
A: You can check document-requests using client ID 3100002325 for an example of documents with "ACTIVE" status and outstanding requirements.

### Document Requests

#### Q: How do I know which party a document request is for?
A: Document requests can be targeted at:
- A party (with partyId)
- A client (with clientId)
For client document requests, you can associate them with the organization party that has the CLIENT role.

## Additional Resources

- [Embedded Finance Solutions Documentation](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments)
- [API Reference](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/overview)
- [Authentication Documentation](https://developer.payments.jpmorgan.com/api/authentication)
- [mTLS with Digital Signature Guide](https://developer.payments.jpmorgan.com/api/mtls-with-digital-signature)
- [Testing Catalog](https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/TESTING_CATALOG.md)

## Certificate Basics 102

### Certificate Types and Formats

#### Q: What's the difference between .p12, .crt, and .key files?
A:
- **.p12/.pfx** - PKCS#12 container format that bundles both the certificate and its private key together, usually password-protected. Often used in Windows environments.
- **.crt/.cer** - Certificate file containing the public key. Does not contain the private key.
- **.key** - Private key file, must be kept secure.
- **.pem** - Privacy Enhanced Mail format, base64 encoded with header/footer lines like `-----BEGIN CERTIFICATE-----`. Can contain certificates, private keys, or both.

#### Q: How do I convert between certificate formats?
A: Using OpenSSL:

```bash
# Convert PEM to DER
openssl x509 -outform der -in certificate.pem -out certificate.der

# Convert DER to PEM
openssl x509 -inform der -in certificate.der -out certificate.pem

# Convert PEM certificate and private key to PKCS#12 (.p12)
openssl pkcs12 -export -out certificate.p12 -inkey privatekey.key -in certificate.crt

# Extract certificate and key from .p12
openssl pkcs12 -in certificate.p12 -out certificate.pem -nodes
```

#### Q: What encoding types are used for certificates?
A:
- **Base64/PEM** - Text-based, can be opened in a text editor (begins with `-----BEGIN...`)
- **DER** - Binary format, cannot be viewed in text editors
- **PKCS#7** - Usually has .p7b extension, contains certificates but not private keys
- **PKCS#12** - Binary format with .p12 or .pfx extension, can contain both certificates and private keys

### Certificate Management

#### Q: How do I check certificate expiration with OpenSSL?
A:
```bash
# For .pem/.crt certificate
openssl x509 -noout -enddate -in certificate.crt

# For website certificate
openssl s_client -connect api-sandbox.payments.jpmorgan.com:443 -servername api-sandbox.payments.jpmorgan.com < /dev/null | openssl x509 -noout -enddate

# View complete certificate details
openssl x509 -text -noout -in certificate.crt
```

#### Q: How do I verify my certificate matches my private key?
A:
```bash
# Extract modulus from certificate and key
openssl x509 -noout -modulus -in certificate.crt | openssl md5
openssl rsa -noout -modulus -in privatekey.key | openssl md5

# If the output values match, the certificate and key are paired
```

#### Q: How do I view the details of a certificate?
A:
```bash
# View certificate details
openssl x509 -text -noout -in certificate.crt

# View certificate subject and issuer
openssl x509 -noout -subject -issuer -in certificate.crt
```

#### Q: How do I check if a certificate is trusted by the CA chain?
A:
```bash
# Verify a certificate against a CA certificate
openssl verify -CAfile ca-cert.pem certificate.crt
```

## API Client Setup

### Postman Setup

#### Setting up Transport Certificates for api-sandbox.payments.jpmorgan.com
1. Install Postman
2. Go to File -> Settings -> Certificates
3. Click "Add Certificate"
4. Configure Host: api-sandbox.payments.jpmorgan.com
5. Add your certificate using one of these methods:
   - Option 1: Add your .crt certificate and .key private key files separately
   - Option 2: Use a .p12/.pfx file and provide the passphrase if required
6. Turn off "SSL certificates verification" in the "General" tab

#### Setting up Digital Signature for POST Requests
1. Create a new Environment in Postman
2. Add variable `signature_cert_private_key` with your digital signature private key content
3. Enable the environment in Postman

### Bruno Setup (Alternative to Postman)

[Bruno](https://www.usebruno.com/) is an open-source API client that's an alternative to Postman, with a focus on being lightweight and Git-friendly.

#### Setting up Transport Certificates in Bruno
1. Install Bruno from https://www.usebruno.com/
2. Create a new collection
3. In the collection settings, go to the SSL tab
4. Configure Client Certificate using one of these methods:
   - **Option 1: Using separate .crt and .key files**
     ```
     Host: api-sandbox.payments.jpmorgan.com
     Certificate path: /path/to/your/certificate.crt
     Key path: /path/to/your/key.key
     Passphrase: (if applicable for the key)
     ```
   - **Option 2: Using a .p12/.pfx file**
     ```
     Host: api-sandbox.payments.jpmorgan.com
     PFX path: /path/to/your/certificate.p12
     Passphrase: (required for the .p12 file)
     ```

#### Setting up Digital Signature for POST Requests
1. Create an environment variable for your signature private key
2. Add a pre-request script to generate the signature for your POST requests
3. Use the Bruno scripting API to apply the signature to your requests

For more details on Bruno scripting, see the [Bruno documentation](https://docs.usebruno.com/).

For additional help with either tool, please contact JPMC Technical Services Support.

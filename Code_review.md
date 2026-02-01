# Security Code Review - JoblessJoe Landing Page

**Date:** February 1, 2026  
**Reviewer:** Software Security Analyst  
**Project:** JoblessJoe Landing Page  
**Files Reviewed:** `server.js`, `index.html`, `package.json`

---

## Executive Summary

This security review identifies **CRITICAL** and **HIGH** priority vulnerabilities in the landing page application that require immediate attention. The application has several significant security issues that could lead to data breaches, code injection attacks, and credential exposure.

**Overall Security Rating: ⚠️ HIGH RISK**

---

## 🔴 CRITICAL Issues (Must Fix Immediately)

### 1. **Hardcoded Credentials in Source Code**
**Severity:** 🔴 CRITICAL  
**File:** `server.js` lines 14-16  
**CWE-798:** Use of Hard-coded Credentials

```javascript
auth: {
  user: 'johannes.tebbert@gmail.com',
  pass: 'REDACTED_APP_PASSWORD' // EXPOSED APP PASSWORD
}
```

**Impact:**
- Your Gmail app password is exposed in plain text in the source code
- Anyone with access to your repository can read your email and send emails as you
- If this code is pushed to GitHub/GitLab, your credentials are **permanently** in git history
- Attackers could use this to send spam or phishing emails from your address

**Immediate Action Required:**
1. **REVOKE THIS APP PASSWORD IMMEDIATELY** via Google Account settings
2. Generate a new app password
3. Never commit it to git again

**Recommended Fix:**
```javascript
// Use environment variables
const EMAIL_CONFIG = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  to: process.env.EMAIL_TO
};

// Validate that required env vars are present
if (EMAIL_CONFIG.enabled) {
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass || !EMAIL_CONFIG.to) {
    console.error('ERROR: Email credentials missing. Set EMAIL_USER, EMAIL_PASSWORD, and EMAIL_TO');
    process.exit(1);
  }
}
```

Create a `.env` file (and add to `.gitignore`):
```bash
EMAIL_ENABLED=true
EMAIL_SERVICE=gmail
EMAIL_USER=johannes.tebbert@gmail.com
EMAIL_PASSWORD=your_app_password_here
EMAIL_TO=johannes.tebbert@icloud.com
```

Use `dotenv` package:
```bash
npm install dotenv
```

Then in `server.js`:
```javascript
require('dotenv').config();
```

---

### 2. **XSS (Cross-Site Scripting) Vulnerability in Email Templates**
**Severity:** 🔴 CRITICAL  
**File:** `server.js` lines 92-125  
**CWE-79:** Improper Neutralization of Input During Web Page Generation

```javascript
html: `
  <p><strong>From:</strong> ${data.name}</p>
  <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
  <p><strong>Subject:</strong> ${data.subject}</p>
  <p style="white-space: pre-wrap;">${data.message}</p>
`
```

**Impact:**
- User input is directly interpolated into HTML without sanitization
- An attacker can inject malicious HTML/JavaScript into your email
- When you open the email, malicious code could execute in your email client
- Could lead to credential theft, phishing, or malware distribution

**Attack Example:**
```javascript
// Attacker sends this as their name:
name: '<img src="x" onerror="alert(\'XSS\')">'
// Or malicious links:
message: '<a href="javascript:alert(document.cookie)">Click me</a>'
// Or script tags:
subject: '<script>/* malicious code */</script>'
```

**Recommended Fix:**
```javascript
// Install a sanitization library
// npm install dompurify jsdom

const createDOMPurifier = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurifier(window);

// OR use a simpler escaping function:
function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Then in email template:
html: `
  <p><strong>From:</strong> ${escapeHtml(data.name)}</p>
  <p><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></p>
  <p><strong>Subject:</strong> ${escapeHtml(data.subject)}</p>
  <p style="white-space: pre-wrap;">${escapeHtml(data.message)}</p>
`
```

---

### 3. **No Rate Limiting on Contact Form**
**Severity:** 🔴 CRITICAL  
**File:** `server.js` line 31  
**CWE-770:** Allocation of Resources Without Limits or Throttling

**Impact:**
- Attackers can spam your contact form unlimited times
- Email inbox flooding (DoS attack)
- Server resource exhaustion
- Potential Gmail account suspension for sending too many emails
- Storage exhaustion (JSON file grows indefinitely)

**Attack Scenario:**
```bash
# Attacker can run this in a loop:
while true; do
  curl -X POST http://your-site.com/contact \
    -H "Content-Type: application/json" \
    -d '{"name":"Spam","email":"spam@spam.com","subject":"Spam","message":"Spam"}'
done
```

**Recommended Fix:**
```javascript
// Install express-rate-limit
// npm install express-rate-limit

const rateLimit = require('express-rate-limit');

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: { error: 'Too many contact form submissions, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply to contact route
if (req.url === '/contact' && req.method === 'POST') {
  // Apply rate limiter here
  contactLimiter(req, res, () => {
    // ... existing contact form code
  });
}
```

---

## 🟠 HIGH Priority Issues

### 4. **No Input Validation or Sanitization**
**Severity:** 🟠 HIGH  
**File:** `server.js` lines 42-47  
**CWE-20:** Improper Input Validation

**Current Validation:**
```javascript
if (!data.name || !data.email || !data.subject || !data.message) {
  // Only checks if fields exist
}
```

**Issues:**
- No email format validation
- No length limits (attacker could send 10MB message)
- No content type validation
- Accepts any characters including control characters

**Recommended Fix:**
```javascript
// Install validator
// npm install validator

const validator = require('validator');

// Validate input
if (!data.name || !data.email || !data.subject || !data.message) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "All fields are required" }));
  return;
}

// Sanitize and validate
data.name = validator.trim(data.name);
data.email = validator.trim(data.email).toLowerCase();
data.subject = validator.trim(data.subject);
data.message = validator.trim(data.message);

// Email validation
if (!validator.isEmail(data.email)) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Invalid email address" }));
  return;
}

// Length validation
if (data.name.length > 100) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Name too long (max 100 characters)" }));
  return;
}

if (data.subject.length > 200) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Subject too long (max 200 characters)" }));
  return;
}

if (data.message.length > 5000) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Message too long (max 5000 characters)" }));
  return;
}

// Block suspicious patterns
const suspiciousPatterns = /<script|javascript:|onerror=|onclick=/i;
if (suspiciousPatterns.test(data.name + data.subject + data.message)) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Invalid input detected" }));
  return;
}
```

---

### 5. **No CSRF Protection**
**Severity:** 🟠 HIGH  
**File:** `server.js` line 31, `index.html` line 1122  
**CWE-352:** Cross-Site Request Forgery

**Impact:**
- Attackers can create malicious websites that submit forms to your endpoint
- Victims visiting attacker's site will unknowingly submit contact forms
- Can be used for spam or to flood your email

**Recommended Fix:**
```javascript
// Generate CSRF token
const crypto = require('crypto');
const csrfTokens = new Set();

function generateCSRFToken() {
  const token = crypto.randomBytes(32).toString('hex');
  csrfTokens.add(token);
  // Clean up old tokens after 1 hour
  setTimeout(() => csrfTokens.delete(token), 3600000);
  return token;
}

// When serving HTML, inject CSRF token
// In contact form, add hidden field:
// <input type="hidden" name="csrf_token" value="GENERATED_TOKEN">

// In POST handler, verify token:
if (!data.csrf_token || !csrfTokens.has(data.csrf_token)) {
  res.writeHead(403, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Invalid CSRF token" }));
  return;
}
csrfTokens.delete(data.csrf_token); // Single use token
```

---

### 6. **No Request Size Limit**
**Severity:** 🟠 HIGH  
**File:** `server.js` lines 32-36  
**CWE-400:** Uncontrolled Resource Consumption

```javascript
let body = '';
req.on('data', chunk => {
  body += chunk.toString();
});
```

**Impact:**
- Attacker can send gigabytes of data
- Server memory exhaustion
- Denial of Service (DoS)

**Recommended Fix:**
```javascript
let body = '';
let bodyLength = 0;
const MAX_BODY_SIZE = 100000; // 100KB limit

req.on('data', chunk => {
  bodyLength += chunk.length;
  
  if (bodyLength > MAX_BODY_SIZE) {
    res.writeHead(413, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Request too large" }));
    req.connection.destroy(); // Kill the connection
    return;
  }
  
  body += chunk.toString();
});
```

---

### 7. **Insecure File Storage**
**Severity:** 🟠 HIGH  
**File:** `server.js` lines 59-71  
**CWE-922:** Insecure Storage of Sensitive Information

**Issues:**
- Contact submissions stored in plain text JSON file
- Email addresses and messages are sensitive data
- No encryption
- File could grow indefinitely
- No GDPR compliance considerations

**Recommended Fix:**
```javascript
// Add encryption for sensitive data
const crypto = require('crypto');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 32 bytes
const IV_LENGTH = 16;

function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encryptedText = parts.join(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY, 'hex'), iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Encrypt sensitive fields before storing
const submission = {
  timestamp: new Date().toISOString(),
  name: encrypt(data.name),
  email: encrypt(data.email),
  subject: encrypt(data.subject),
  message: encrypt(data.message),
  emailSent: false
};
```

**Better Alternative:** Use a proper database with encryption at rest (SQLite with SQLCipher)

---

## 🟡 MEDIUM Priority Issues

### 8. **No Security Headers**
**Severity:** 🟡 MEDIUM  
**File:** `server.js` line 203  
**CWE-693:** Protection Mechanism Failure

**Recommended Fix:**
```javascript
res.writeHead(200, { 
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "no-cache",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
});
```

---

### 9. **Error Message Information Disclosure**
**Severity:** 🟡 MEDIUM  
**File:** `server.js` lines 76-78, 132  
**CWE-209:** Generation of Error Message Containing Sensitive Information

```javascript
console.error('Error saving contact submission:', err);
submission.emailError = error.message; // Exposes internal errors
```

**Recommended Fix:**
```javascript
// Log detailed errors server-side only
console.error('[Security] Error saving submission:', {
  timestamp: new Date().toISOString(),
  error: err.message,
  stack: err.stack
});

// Send generic error to client
res.writeHead(500, { "Content-Type": "application/json" });
res.end(JSON.stringify({ error: "An error occurred. Please try again later." }));
```

---

### 10. **No HTTPS Enforcement**
**Severity:** 🟡 MEDIUM  
**File:** `server.js` line 211  
**CWE-319:** Cleartext Transmission of Sensitive Information

**Current:**
```javascript
server.listen(3000, "127.0.0.1", () => {
  console.log("Landingpage läuft auf http://127.0.0.1:3000");
});
```

**Recommendation:**
- Use HTTPS in production
- Implement HTTP to HTTPS redirect
- Use Let's Encrypt for free SSL certificates
- Consider using a reverse proxy (nginx) with SSL termination

---

### 11. **Path Traversal Vulnerability**
**Severity:** 🟡 MEDIUM  
**File:** `server.js` lines 160-201  
**CWE-22:** Improper Limitation of a Pathname to a Restricted Directory

**Current Code:**
```javascript
let filePath = path.join(__dirname, req.url === '/' ? '/index.html' : req.url);
```

**Issue:**
- Attacker could request files like `/../../../etc/passwd`
- Need to validate that resolved path is within intended directory

**Recommended Fix:**
```javascript
let requestedPath = req.url === '/' ? '/index.html' : req.url;

// Sanitize path
requestedPath = path.normalize(requestedPath).replace(/^(\.\.[\/\\])+/, '');

let filePath = path.join(__dirname, requestedPath);

// Ensure the resolved path is within the intended directory
if (!filePath.startsWith(__dirname)) {
  res.writeHead(403, { "Content-Type": "text/plain" });
  res.end("403 Forbidden");
  return;
}
```

---

### 12. **No Logging or Monitoring**
**Severity:** 🟡 MEDIUM  
**CWE-778:** Insufficient Logging

**Recommendation:**
```javascript
// Add proper logging
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Log security events
logger.info('Contact form submission', {
  timestamp: new Date().toISOString(),
  ip: req.connection.remoteAddress,
  email: data.email,
  success: true
});
```

---

## 🔵 LOW Priority Issues

### 13. **Outdated Dependencies**
**Severity:** 🔵 LOW

Check for vulnerabilities:
```bash
npm audit
npm audit fix
```

---

### 14. **No Input Encoding**
**Severity:** 🔵 LOW

The plain text email doesn't have this issue, but for consistency, encode special characters.

---

### 15. **Binding to 127.0.0.1 Only**
**Severity:** 🔵 LOW / ℹ️ INFO

```javascript
server.listen(3000, "127.0.0.1", ...);
```

**Current:** Only accessible from localhost (good for development)  
**Recommendation for Production:** Use environment variable for host binding

```javascript
const HOST = process.env.HOST || '127.0.0.1';
const PORT = process.env.PORT || 3000;

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
});
```

---

## Summary of Fixes Needed

### Immediate (Do Today):
1. ✅ **REVOKE the exposed Gmail app password**
2. ✅ Move credentials to environment variables
3. ✅ Implement XSS protection (HTML escaping)
4. ✅ Add rate limiting

### This Week:
5. ✅ Add input validation and sanitization
6. ✅ Implement request size limits
7. ✅ Add CSRF protection
8. ✅ Add security headers

### Before Going to Production:
9. ✅ Implement HTTPS
10. ✅ Add proper logging
11. ✅ Encrypt stored data
12. ✅ Fix path traversal vulnerability
13. ✅ Add monitoring and alerting

---

## Recommended Security Tools

1. **npm audit** - Check for vulnerable dependencies
2. **OWASP ZAP** - Web application security scanner
3. **Snyk** - Continuous security monitoring
4. **helmet** - Security headers middleware for Express
5. **express-rate-limit** - Rate limiting
6. **validator** - Input validation library
7. **dompurify** - HTML sanitization
8. **dotenv** - Environment variable management

---

## Additional Recommendations

### 1. Use Express.js Framework
Instead of raw `http` module, use Express for better security defaults:

```javascript
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// Security middleware
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
}));

// Your routes here
```

### 2. Add .gitignore
Ensure sensitive files aren't committed:

```
node_modules/
.env
contact-submissions.json
*.log
```

### 3. Implement GDPR Compliance
- Add privacy policy
- Implement data retention policy (delete old submissions)
- Add "right to be forgotten" functionality
- Get consent before storing personal data

### 4. Add Honeypot Field
Prevent bot submissions:

```html
<!-- Add hidden field -->
<input type="text" name="website" style="display:none" tabindex="-1" autocomplete="off">
```

```javascript
// Reject if honeypot is filled
if (data.website) {
  res.writeHead(400, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Invalid submission" }));
  return;
}
```

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Review Completed:** February 1, 2026  
**Next Review Recommended:** After implementing fixes

**Questions?** Feel free to reach out for clarification on any of these issues.

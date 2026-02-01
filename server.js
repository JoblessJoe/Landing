const http = require("http");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
require('dotenv').config();

// HTML sanitization for XSS protection
const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');
const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

// Contact form submissions file
const CONTACT_FILE = path.join(__dirname, "contact-submissions.json");

// Email configuration - NOW USES ENVIRONMENT VARIABLES
const EMAIL_CONFIG = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  to: process.env.EMAIL_TO
};

// Validate email configuration
if (EMAIL_CONFIG.enabled) {
  if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass || !EMAIL_CONFIG.to) {
    console.error('❌ ERROR: Email credentials missing!');
    console.error('Please set EMAIL_USER, EMAIL_PASSWORD, and EMAIL_TO in .env file');
    process.exit(1);
  }
  console.log('✓ Email configuration loaded from environment variables');
}

// HTML escape function for XSS protection
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Create email transporter
let transporter = null;
if (EMAIL_CONFIG.enabled) {
  transporter = nodemailer.createTransport({
    service: EMAIL_CONFIG.service,
    auth: EMAIL_CONFIG.auth
  });
}

// Rate limiting - Track submissions by IP
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 3; // Max 3 submissions per window

function checkRateLimit(ip) {
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, [now]);
    return true;
  }
  
  const timestamps = rateLimitMap.get(ip).filter(time => now - time < RATE_LIMIT_WINDOW);
  
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return false; // Rate limit exceeded
  }
  
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return true;
}

// Clean up old rate limit entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [ip, timestamps] of rateLimitMap.entries()) {
    const validTimestamps = timestamps.filter(time => now - time < RATE_LIMIT_WINDOW);
    if (validTimestamps.length === 0) {
      rateLimitMap.delete(ip);
    } else {
      rateLimitMap.set(ip, validTimestamps);
    }
  }
}, 60 * 60 * 1000);

const server = http.createServer((req, res) => {
  // Handle contact form submission
  if (req.url === '/contact' && req.method === 'POST') {
    // Get client IP
    const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    
    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      console.log(`⚠️  Rate limit exceeded for IP: ${clientIp}`);
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ 
        error: "Too many requests. Please try again in 15 minutes." 
      }));
      return;
    }
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        
        // Validate input
        if (!data.name || !data.email || !data.subject || !data.message) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "All fields are required" }));
          return;
        }
        
        // Create submission entry
        const submission = {
          timestamp: new Date().toISOString(),
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          emailSent: false // Will be updated after email is sent
        };
        
        // Read existing submissions or create new array
        let submissions = [];
        if (fs.existsSync(CONTACT_FILE)) {
          try {
            const fileContent = fs.readFileSync(CONTACT_FILE, 'utf8');
            submissions = JSON.parse(fileContent);
          } catch (err) {
            console.error('Error reading contact file:', err);
          }
        }
        
        // Add new submission
        submissions.push(submission);
        
        // Save to file
        fs.writeFile(CONTACT_FILE, JSON.stringify(submissions, null, 2), (err) => {
          if (err) {
            console.error('Error saving contact submission:', err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to save submission" }));
            return;
          }
          
          console.log(`✓ Contact form submitted by ${data.name} (${data.email})`);
          console.log(`  Subject: ${data.subject}`);
          console.log(`  Saved to: ${CONTACT_FILE}`);
          
          // Send email notification if enabled
          if (EMAIL_CONFIG.enabled && transporter) {
            // Sanitize all user input to prevent XSS attacks
            const safeName = escapeHtml(data.name);
            const safeEmail = escapeHtml(data.email);
            const safeSubject = escapeHtml(data.subject);
            const safeMessage = escapeHtml(data.message);
            
            const mailOptions = {
              from: EMAIL_CONFIG.auth.user,
              to: EMAIL_CONFIG.to,
              subject: `🔔 New Contact Form: ${safeSubject}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">New Contact Form Submission</h2>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>From:</strong> ${safeName}</p>
                    <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
                    <p><strong>Subject:</strong> ${safeSubject}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h3 style="margin-top: 0; color: #334155;">Message:</h3>
                    <p style="white-space: pre-wrap; color: #475569;">${safeMessage}</p>
                  </div>
                  <div style="margin-top: 20px; padding: 15px; background: #f1f5f9; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #64748b;">
                      💡 Reply directly to <a href="mailto:${safeEmail}">${safeEmail}</a> to respond to this inquiry.
                    </p>
                  </div>
                </div>
              `,
              text: `
New Contact Form Submission

From: ${data.name}
Email: ${data.email}
Subject: ${data.subject}
Time: ${new Date().toLocaleString()}

Message:
${data.message}

---
Reply to: ${data.email}
              `
            };
            
            transporter.sendMail(mailOptions, (error, info) => {
              if (error) {
                console.error('✗ Error sending email notification:', error);
                submission.emailSent = false;
                submission.emailError = error.message;
              } else {
                console.log('✓ Email notification sent:', info.messageId);
                submission.emailSent = true;
                submission.emailSentAt = new Date().toISOString();
                
                // Update the file with the email sent status
                fs.writeFile(CONTACT_FILE, JSON.stringify(submissions, null, 2), (err) => {
                  if (err) {
                    console.error('Warning: Could not update email sent status:', err);
                  }
                });
              }
            });
          }
          
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ success: true }));
        });
      } catch (error) {
        console.error('Error processing contact form:', error);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid request" }));
      }
    });
    return;
  }
  
  // Handle static files (logo, photo, etc.)
  const staticFilePatterns = ['/logo', '/photo'];
  if (staticFilePatterns.some(pattern => req.url.startsWith(pattern))) {
    const ext = path.extname(req.url);
    const filePath = path.join(__dirname, req.url);
    
    const contentTypes = {
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.ico': 'image/x-icon'
    };
    
    fs.readFile(filePath, (err, content) => {
      if (err) {
        console.error('Error loading file:', filePath, err.message);
        res.writeHead(404);
        res.end("File not found");
        return;
      }
      
      console.log(`✓ Serving: ${req.url} (${content.length} bytes)`);
      res.writeHead(200, { 
        "Content-Type": contentTypes[ext] || "application/octet-stream",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Access-Control-Allow-Origin": "*"
      });
      res.end(content);
    });
    return;
  }
  
  // Serve index.html for all other routes
  const filePath = path.join(__dirname, "index.html");
  
  fs.readFile(filePath, "utf8", (err, content) => {
    if (err) {
      res.writeHead(500, { "Content-Type": "text/plain" });
      res.end("Error loading page");
      return;
    }
    
    res.writeHead(200, { 
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-cache"
    });
    res.end(content);
  });
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Landingpage läuft auf http://127.0.0.1:3000");
});

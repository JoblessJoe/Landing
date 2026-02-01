const http = require("http");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");

// Contact form submissions file
const CONTACT_FILE = path.join(__dirname, "contact-submissions.json");

// Email configuration
// You'll need to configure this with your email settings
const EMAIL_CONFIG = {
  enabled: true, // Email notifications are now active!
  service: 'gmail', // or 'outlook', 'yahoo', etc.
  auth: {
    user: 'johannes.tebbert@gmail.com', // Your email
    pass: 'REDACTED_APP_PASSWORD' // Your email app password (NOT your regular password)
  },
  to: 'johannes.tebbert@icloud.com' // Where to send notifications
};

// Create email transporter
let transporter = null;
if (EMAIL_CONFIG.enabled) {
  transporter = nodemailer.createTransport({
    service: EMAIL_CONFIG.service,
    auth: EMAIL_CONFIG.auth
  });
}

const server = http.createServer((req, res) => {
  // Handle contact form submission
  if (req.url === '/contact' && req.method === 'POST') {
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
            const mailOptions = {
              from: EMAIL_CONFIG.auth.user,
              to: EMAIL_CONFIG.to,
              subject: `🔔 New Contact Form: ${data.subject}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #2563eb;">New Contact Form Submission</h2>
                  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>From:</strong> ${data.name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
                    <p><strong>Subject:</strong> ${data.subject}</p>
                    <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
                  </div>
                  <div style="background: #ffffff; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h3 style="margin-top: 0; color: #334155;">Message:</h3>
                    <p style="white-space: pre-wrap; color: #475569;">${data.message}</p>
                  </div>
                  <div style="margin-top: 20px; padding: 15px; background: #f1f5f9; border-radius: 8px;">
                    <p style="margin: 0; font-size: 14px; color: #64748b;">
                      💡 Reply directly to <a href="mailto:${data.email}">${data.email}</a> to respond to this inquiry.
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

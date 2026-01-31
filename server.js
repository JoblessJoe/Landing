const http = require("http");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Email configuration (hidden from public)
const CONTACT_EMAIL = "johannes.tebbert@icloud.com";

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
        
        // Create email content
        const emailSubject = `[JoblessJoe Contact] ${data.subject}`;
        const emailBody = `
New contact form submission from JoblessJoe website:

From: ${data.name}
Email: ${data.email}
Subject: ${data.subject}

Message:
${data.message}

---
Sent from JoblessJoe Landing Page
        `.trim();
        
        // Send email using macOS mail command
        const mailCommand = `echo ${JSON.stringify(emailBody)} | mail -s ${JSON.stringify(emailSubject)} "${CONTACT_EMAIL}"`;
        
        exec(mailCommand, (error) => {
          if (error) {
            console.error('Error sending email:', error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Failed to send email" }));
            return;
          }
          
          console.log(`Contact form submitted by ${data.name} (${data.email})`);
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
  const staticFilePatterns = ['/logo.', '/photo.'];
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
        res.writeHead(404);
        res.end("File not found");
        return;
      }
      
      res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
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
    
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(content);
  });
});

server.listen(3000, "127.0.0.1", () => {
  console.log("Landingpage läuft auf http://127.0.0.1:3000");
});

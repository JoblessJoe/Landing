const http = require("http");
const fs = require("fs");
const path = require("path");

// Contact form submissions file
const CONTACT_FILE = path.join(__dirname, "contact-submissions.json");

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
          message: data.message
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

server.listen(3003, "127.0.0.1", () => {
  console.log("Landingpage läuft auf http://127.0.0.1:3003");
});

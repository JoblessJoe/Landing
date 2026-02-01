# Email Notifications Setup

Your landing page contact form now supports email notifications! When someone submits the contact form, you'll receive an email with their details.

## Setup Instructions

### 1. Choose Your Email Service

The server supports various email services:
- **Gmail** (recommended for personal use)
- **Outlook** / **Hotmail**
- **Yahoo**
- Any other SMTP service

### 2. Get an App Password (Gmail Example)

**Important:** Don't use your regular email password! You need an "App Password" for security.

#### For Gmail:
1. Go to your Google Account: https://myaccount.google.com/
2. Click on "Security" in the left menu
3. Enable "2-Step Verification" (required for app passwords)
4. Go back to Security settings
5. Click on "App passwords" (you'll see this after enabling 2FA)
6. Select "Mail" as the app and "Other" as the device
7. Enter "JoblessJoe Landing Page" as the name
8. Click "Generate"
9. **Copy the 16-character password** (you won't be able to see it again!)

#### For Outlook/Hotmail:
1. Go to https://account.microsoft.com/security
2. Enable "Two-step verification"
3. Go to "App passwords"
4. Create a new app password

### 3. Configure the Server

Open `server.js` and update the `EMAIL_CONFIG` section:

```javascript
const EMAIL_CONFIG = {
  enabled: true, // Change this to true!
  service: 'gmail', // or 'outlook', 'yahoo', etc.
  auth: {
    user: 'your-email@gmail.com', // Your email address
    pass: 'abcd efgh ijkl mnop' // Your app password (16 characters)
  },
  to: 'your-email@gmail.com' // Where to send notifications (can be the same or different)
};
```

### 4. Restart the Server

After updating the configuration, restart your server:

```bash
# If running normally:
# Press Ctrl+C to stop, then:
node server.js

# If using PM2:
pm2 restart landing-server
```

### 5. Test It!

1. Go to your landing page
2. Fill out the contact form
3. Submit it
4. Check your email inbox!

## What You'll Receive

When someone submits the form, you'll get a nicely formatted email with:
- ✉️ Subject line: "🔔 New Contact Form: [their subject]"
- 👤 Their name
- 📧 Their email address (clickable to reply)
- 📝 Their message
- 🕐 Timestamp

You can reply directly to their email from your inbox!

## Troubleshooting

### Email not sending?
- Check that `enabled: true` in the config
- Verify you're using an **app password**, not your regular password
- Check the server console for error messages
- Make sure 2-Factor Authentication is enabled on your account

### Still not working?
- Try a different email service
- Check your spam folder
- Verify your email credentials are correct
- The form submissions are still saved to `contact-submissions.json` even if email fails

## Alternative: Just Check the JSON File

If you don't want to set up email notifications, all submissions are automatically saved to:
```
joblessjoe-landing/Landing/contact-submissions.json
```

You can check this file anytime to see all submissions!

## Security Notes

- ✅ Never commit your `server.js` with real credentials to Git!
- ✅ Consider using environment variables for production
- ✅ App passwords are safer than regular passwords
- ✅ The contact form has basic validation to prevent spam

## Need Help?

If you have issues setting this up, let me know and I can help troubleshoot!

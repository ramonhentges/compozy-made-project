import { EmailTemplate } from '../value_objects/email_template';

export const welcomeTemplate: EmailTemplate = {
  name: 'welcome',
  subject: 'Welcome to our platform!',
  htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    .container { max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }
    .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .footer { background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome, {{name}}!</h1>
    </div>
    <div class="content">
      <p>Thank you for joining our platform. We're excited to have you on board!</p>
      <p>Your account has been successfully created with the email: <strong>{{email}}</strong></p>
      <p>If you have any questions, feel free to reach out to our support team.</p>
    </div>
    <div class="footer">
      <p>&copy; 2026 Our Platform. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
`.trim(),
  textBody: `
Welcome to our platform, {{name}}!

Thank you for joining our platform. We're excited to have you on board!

Your account has been successfully created with the email: {{email}}

If you have any questions, feel free to reach out to our support team.

© 2026 Our Platform. All rights reserved.
`.trim(),
};

export function renderWelcomeTemplate(data: { name: string; email: string }): {
  html: string;
  text: string;
} {
  const html = welcomeTemplate.htmlBody
    .replace(/{{name}}/g, data.name)
    .replace(/{{email}}/g, data.email);

  const text = welcomeTemplate.textBody
    .replace(/{{name}}/g, data.name)
    .replace(/{{email}}/g, data.email);

  return { html, text };
}

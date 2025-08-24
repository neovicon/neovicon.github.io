const nodemailer = require('nodemailer');
const { EmailDigest } = require('../models');
const { htmlToText } = require('html-to-text');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    this.transporter.verify((error) => {
      if (error) {
        console.error('Email transporter verification failed:', error);
      } else {
        console.log('Email server is ready to take messages');
      }
    });
  }

  async sendEmail(to, subject, htmlContent, textContent = null) {
    try {
      const mailOptions = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to,
        subject,
        html: htmlContent,
        text: textContent || htmlToText(htmlContent)
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);
      return info;

    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  async sendVerificationEmail(email, name, verificationUrl) {
    const subject = 'Verify Your Intelixir Account';
    const htmlContent = this.generateVerificationEmailHTML(name, verificationUrl);
    return this.sendEmail(email, subject, htmlContent);
  }

  async sendPasswordResetEmail(email, name, resetUrl) {
    const subject = 'Reset Your Intelixir Password';
    const htmlContent = this.generatePasswordResetEmailHTML(name, resetUrl);
    return this.sendEmail(email, subject, htmlContent);
  }

  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to Intelixir!';
    const htmlContent = this.generateWelcomeEmailHTML(name);
    return this.sendEmail(email, subject, htmlContent);
  }

  async sendDigestEmail(user, posts, digestType = 'daily') {
    try {
      const subject = `Your ${digestType} Intelixir Digest - ${new Date().toDateString()}`;
      const htmlContent = this.generateDigestEmailHTML(user, posts, digestType);

      await this.sendEmail(user.email, subject, htmlContent);

      const emailDigest = new EmailDigest({
        user: user._id,
        posts: posts.map((post) => post._id),
        digestType,
        sentAt: new Date()
      });

      await emailDigest.save();
      return emailDigest;
    } catch (error) {
      console.error('Error sending digest email:', error);
      throw error;
    }
  }

  async sendBreakingNewsEmail(user, post) {
    const subject = '🚨 Breaking News from Intelixir';
    const htmlContent = this.generateBreakingNewsEmailHTML(user, post);
    return this.sendEmail(user.email, subject, htmlContent);
  }

  async sendContactFormNotification(contactData) {
    const subject = `New Contact Form Submission from ${contactData.name}`;
    const htmlContent = this.generateContactNotificationHTML(contactData);
    return this.sendEmail(process.env.ADMIN_EMAIL, subject, htmlContent);
  }

  generateVerificationEmailHTML(name, verificationUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
        <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #2B2B2B; margin: 0; padding: 0; background-color: #F5F7FA; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #00A4EF 0%, #0056b3 100%); color: white; padding: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; padding: 15px 30px; background: #00A4EF; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #0056b3; }
            .footer { background: #F5F7FA; padding: 20px; text-align: center; font-size: 14px; color: #666; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Intelixir</div>
                <p>AI-Powered Social News Platform</p>
            </div>
            <div class="content">
                <h2>Welcome ${name}!</h2>
                <p>Please verify your email address to complete your registration and start exploring personalized news and social features.</p>
                <div style="text-align: center;">
                    <a href="${verificationUrl}" class="button">Verify My Email</a>
                </div>
                <div class="warning">
                    <strong>Security Notice:</strong> This verification link will expire in 24 hours. If you didn't create an account with Intelixir, please ignore this email.
                </div>
                <p>If the button doesn't work, copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #00A4EF;">${verificationUrl}</p>
            </div>
            <div class="footer">
                <p>© 2024 Intelixir. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
  }

  generatePasswordResetEmailHTML(name, resetUrl) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
        <style>
            body { font-family: 'Poppins', Arial, sans-serif; line-height: 1.6; color: #2B2B2B; margin: 0; padding: 0; background-color: #F5F7FA; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #00A4EF 0%, #0056b3 100%); color: white; padding: 30px; text-align: center; }
            .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; padding: 15px 30px; background: #00A4EF; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
            .button:hover { background: #0056b3; }
            .footer { background: #F5F7FA; padding: 20px; text-align: center; font-size: 14px; color: #666; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Intelixir</div>
                <p>AI-Powered Social News Platform</p>
            </div>
            <div class="content">
                <h2>Hello ${name},</h2>
                <p>We received a request to reset your password for your Intelixir account.</p>
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Reset My Password</a>
                </div>
                <div class="warning">
                    <strong>Security Notice:</strong> This password reset link will expire in 1 hour. If you did not request a password reset, please ignore this email or contact support if you're concerned.
                </div>
                <p>If the button doesn't work, copy and paste this link in your browser:</p>
                <p style="word-break: break-all; color: #00A4EF;">${resetUrl}</p>
            </div>
            <div class="footer">
                <p>© 2024 Intelixir. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>`;
  }
}

module.exports = new EmailService();
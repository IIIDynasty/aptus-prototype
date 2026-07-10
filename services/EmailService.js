const { Resend } = require('resend');

class EmailService {
  constructor() {
    this.resend = null;
    this.initialized = false;
  }

  initialize() {
    if (process.env.RESEND_API_KEY) {
      this.resend = new Resend(process.env.RESEND_API_KEY);
      this.initialized = true;
      console.log('✅ Email service initialized (Resend)');
    } else {
      console.log('⚠️ RESEND_API_KEY not found. Emails will be mocked (Check console logs).');
    }
  }

  async sendEmail(to, subject, html) {
    if (!this.initialized) {
      console.log(`\n[MOCK EMAIL SENT]`);
      console.log(`To: ${to}`);
      console.log(`Subject: ${subject}`);
      console.log(`Content length: ${html.length} chars\n`);
      return { success: true, mocked: true };
    }

    try {
      const data = await this.resend.emails.send({
        // Note: For free Resend accounts, you can only send FROM onboarding@resend.dev
        // TO the email address you signed up with.
        from: 'Aptus Recruitment <onboarding@resend.dev>',
        to: [to],
        subject: subject,
        html: html
      });
      return { success: true, data };
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendInterviewInvite(candidateEmail, candidateName, jobTitle) {
    const subject = `Interview Invitation: ${jobTitle} at Aptus`;
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #1a56db;">Interview Invitation</h2>
        <p>Dear ${candidateName},</p>
        <p>Thank you for applying for the <strong>${jobTitle}</strong> position. We were impressed with your background and would like to invite you to an interview.</p>
        <p>Our recruitment team will be in touch shortly to schedule a convenient time for a call.</p>
        <br/>
        <p>Best regards,<br/><strong>The Aptus Recruitment Team</strong></p>
      </div>
    `;
    return this.sendEmail(candidateEmail, subject, html);
  }

  async sendRejectionEmail(candidateEmail, candidateName, jobTitle) {
    const subject = `Update on your application for ${jobTitle}`;
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <p>Dear ${candidateName},</p>
        <br/>
        <p>Thank you for taking the time to apply for the <strong>${jobTitle}</strong> position. We genuinely appreciate your interest and the effort you put into your application.</p>
        <p>After careful review of all applications received, we regret to inform you that we will not be moving forward with your candidacy at this time. This decision was not easy — the quality of applications was high, and we had to make difficult choices.</p>
        <p>We would encourage you to continue developing your profile and apply for future opportunities that match your experience.</p>
        <br/>
        <p>Warm regards,<br/><strong>The Aptus Recruitment Team</strong></p>
      </div>
    `;
    return this.sendEmail(candidateEmail, subject, html);
  }

  async sendCommunityNotification(adminEmail, communityName, jobLink) {
    const subject = `New Community Distribution Request: ${communityName}`;
    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #1a56db;">Job Distribution Alert</h2>
        <p>A recruiter has requested to distribute a job to the following community:</p>
        <div style="background: #f8fafc; padding: 15px; border-left: 4px solid #1a56db; margin: 15px 0;">
          <strong>${communityName}</strong>
        </div>
        <p><strong>Job Link:</strong> <br/><a href="${jobLink}" style="color: #1a56db;">${jobLink}</a></p>
        <p style="font-size: 13px; color: #666; margin-top: 30px;">This is an automated notification from the Aptus platform.</p>
      </div>
    `;
    return this.sendEmail(adminEmail, subject, html);
  }
}

// Export as a singleton
const emailService = new EmailService();
module.exports = emailService;

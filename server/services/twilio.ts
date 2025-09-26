import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_TOKEN || '';
const twilioPhone = process.env.TWILIO_PHONE_NUMBER || process.env.TWILIO_PHONE || '';

const client = twilio(accountSid, authToken);

export interface SMSMessage {
  to: string;
  message: string;
  mediaUrl?: string;
}

export class TwilioService {
  async sendSMS(sms: SMSMessage): Promise<string> {
    try {
      if (!accountSid || !authToken || !twilioPhone) {
        console.log('Twilio not configured, SMS simulation:', sms);
        return 'mock_message_sid';
      }

      const message = await client.messages.create({
        body: sms.message,
        from: twilioPhone,
        to: sms.to,
        ...(sms.mediaUrl && { mediaUrl: [sms.mediaUrl] }),
      });

      return message.sid;
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw new Error('Failed to send SMS notification');
    }
  }

  async sendDonationAlert(donorPhone: string, donationTitle: string, amount: string): Promise<void> {
    const message = `Thank you for your generous donation! 🙏

Your donation "${donationTitle}" of ${amount} has been received and will make a real difference in someone's life.

Track your impact: https://lumina.app/donations

- Lumina Team`;

    await this.sendSMS({
      to: donorPhone,
      message,
    });
  }

  async sendMatchNotification(userPhone: string, userName: string, matchType: string, matchTitle: string): Promise<void> {
    const message = `Hi ${userName}! 🌟

We found a perfect match for you:
${matchType}: "${matchTitle}"

Check it out: https://lumina.app/matches

Help is just a click away!
- Lumina`;

    await this.sendSMS({
      to: userPhone,
      message,
    });
  }

  async sendVolunteerReminder(volunteerPhone: string, activityTitle: string, startTime: string, location: string): Promise<void> {
    const message = `Volunteer Reminder! 📅

"${activityTitle}"
⏰ ${startTime}
📍 ${location}

Your time and effort will make a real difference. Thank you for being a changemaker!

- Lumina Team`;

    await this.sendSMS({
      to: volunteerPhone,
      message,
    });
  }

  async sendEmergencyAlert(phone: string, alertType: string, location: string, instructions: string): Promise<void> {
    const message = `🚨 EMERGENCY ALERT 🚨

${alertType.toUpperCase()}
📍 ${location}

${instructions}

Stay safe! More info: https://lumina.app/emergency

- Lumina Emergency Response`;

    await this.sendSMS({
      to: phone,
      message,
    });
  }

  async sendRequestFulfilled(requesterPhone: string, requestTitle: string, donorName: string): Promise<void> {
    const message = `Great news! 🎉

Your request "${requestTitle}" has been fulfilled by ${donorName}.

You'll be contacted soon for coordination.

Thank you for being part of our community!
- Lumina`;

    await this.sendSMS({
      to: requesterPhone,
      message,
    });
  }
}

export const twilioService = new TwilioService();

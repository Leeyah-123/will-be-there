import { SeaMailerClient } from 'seamailer-nodejs';
import seamailer from '../../lib/seamailer';

interface EmailAttachment {
  filename: string;
  contentType: string;
  base64Content: string;
}

export class EmailService {
  private readonly seamailer: SeaMailerClient;

  constructor() {
    this.seamailer = seamailer();
  }

  async sendEmail({
    subject,
    recipient,
    message,
    templateId,
    variables,
    attachments,
  }: {
    subject: string;
    recipient: string;
    message?: string;
    templateId?: number;
    variables?: Record<string, string>;
    attachments?: EmailAttachment[];
  }) {
    await this.seamailer.sendMail({
      from: {
        email: 'junaidaaliyah260@gmail.com',
        name: 'Will Be There',
      },
      to: [{ email: recipient }],
      textPart: message,
      subject,
      templateId,
      variables,
      attachments,
    });
  }

  async sendBulkEmail({
    subject,
    recipients,
    message,
    templateId,
    variables,
    attachments,
  }: {
    subject: string;
    recipients: string[];
    message?: string;
    templateId?: number;
    variables?: Record<string, string>;
    attachments?: EmailAttachment[];
  }) {
    await this.seamailer.sendMail({
      from: {
        email: 'junaidaaliyah260@gmail.com',
        name: 'Will Be There',
      },
      to: recipients.map((recipient) => ({ email: recipient })),
      textPart: message,
      subject,
      templateId,
      variables,
      attachments,
    });
  }
}

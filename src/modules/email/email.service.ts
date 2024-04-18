import { SeaMailerClient } from 'seamailer-nodejs';
import seamailer from '../../lib/seamailer';

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
  }: {
    subject: string;
    recipient: string;
    message?: string;
    templateId?: number;
    variables?: Record<string, string>;
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
    });
  }

  async sendBulkEmail({
    subject,
    recipients,
    message,
    templateId,
    variables,
  }: {
    subject: string;
    recipients: string[];
    message?: string;
    templateId?: number;
    variables?: Record<string, string>;
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
    });
  }
}

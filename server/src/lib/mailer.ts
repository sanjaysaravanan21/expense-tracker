import nodemailer from 'nodemailer';
import { getEnv } from '@/config/env';
import { HttpError } from './http-error';

export async function sendMail(to: string, subject: string, text: string): Promise<void> {
  const { MAIL_USER, MAIL_KEY, MAIL_TRANSPORT } = getEnv();
  if (MAIL_TRANSPORT === 'disabled') return;
  if (!MAIL_USER || !MAIL_KEY) throw new HttpError(503, 'Email delivery is not configured');

  const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: MAIL_USER, pass: MAIL_KEY } });
  await transporter.sendMail({ from: MAIL_USER, to, subject, text });
}

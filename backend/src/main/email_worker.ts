import pino from 'pino';
import { getEmailConfig } from '../config/email_config';
import { SendGridAdapter } from '../modules/email/infrastructure/adapters/sendgrid_adapter';
import { SendWelcomeEmailHandler } from '../modules/email/application/send_welcome_email/handler';
import { UserRegisteredConsumer } from '../modules/email/infrastructure/kafka/user_registered_consumer';

const logger = pino({
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
});

async function bootstrap() {
  logger.info('Starting email worker...');

  const config = getEmailConfig();

  const sendGridAdapter = new SendGridAdapter({
    apiKey: config.sendgrid.apiKey,
    fromEmail: config.sendgrid.fromEmail,
    fromName: config.sendgrid.fromName,
  });

  const sendWelcomeEmailHandler = new SendWelcomeEmailHandler({
    emailService: sendGridAdapter,
    fromEmail: config.sendgrid.fromEmail,
    fromName: config.sendgrid.fromName,
  });

  const consumer = new UserRegisteredConsumer(
    {
      brokers: config.kafka.brokers,
      clientId: 'email-worker',
      groupId: config.kafka.groupId,
      topic: config.kafka.topic,
      maxRetries: config.retry.maxRetries,
      initialDelayMs: config.retry.initialDelayMs,
      maxDelayMs: config.retry.maxDelayMs,
    },
    sendWelcomeEmailHandler,
    logger
  );

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'email.worker.shutting_down');
    await consumer.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await consumer.start();
  logger.info('Email worker started successfully');
}

bootstrap().catch((error) => {
  logger.error({ error: String(error) }, 'email.worker.failed');
  process.exit(1);
});

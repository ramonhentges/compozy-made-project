import pino from 'pino';
import { getEmailConfig } from '../config/email_config';
import { SendGridAdapter } from '../modules/email/infrastructure/adapters/sendgrid_adapter';
import { SendWelcomeEmailHandler } from '../modules/email/application/send_welcome_email/handler';
import { createUserRegisteredConsumer, getKafkaProducerConfig } from '../modules/email/infrastructure/kafka/consumer_config';

const logger = pino({
  transport: process.env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
});

async function bootstrap() {
  logger.info('Starting email worker...');

  const config = getEmailConfig();

  const sendGridAdapter = new SendGridAdapter({
    apiKey: config.sendgrid.apiKey,
    defaultFrom: config.sendgrid.fromEmail,
  });

  const sendWelcomeEmailHandler = new SendWelcomeEmailHandler({
    emailService: sendGridAdapter,
    fromEmail: config.sendgrid.fromEmail,
    fromName: config.sendgrid.fromName,
  });

  const consumer = createUserRegisteredConsumer(
    config,
    sendWelcomeEmailHandler,
    logger
  );

  const kafkaProducerConfig = getKafkaProducerConfig(config);

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'email.worker.shutting_down');
    await consumer.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await consumer.start(kafkaProducerConfig);
  logger.info('Email worker started successfully');
}

bootstrap().catch((error) => {
  logger.error({ error: String(error) }, 'email.worker.failed');
  process.exit(1);
});

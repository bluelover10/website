require('dotenv').config();
const crypto = require('crypto');
const app = require('./app');
const connectDB = require('./config/db');
const { runSeeds } = require('./services/seed.service');

const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

const KNOWN_SECRETS = new Set([
  'change-me-to-a-long-random-string',
  'change-me',
  'changeme',
  'secret',
  'password',
  'admin1234',
]);

/**
 * Fail fast (or warn loudly) on insecure boot configuration so a bad deploy
 * can't ship with forgeable JWTs.
 */
function validateBootConfig() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (isProd) {
      throw new Error('JWT_SECRET is required in production. Generate one with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    }
    process.env.JWT_SECRET = crypto.randomBytes(48).toString('hex');
    // eslint-disable-next-line no-console
    console.warn('⚠️  JWT_SECRET not set — generated an EPHEMERAL secret. Every restart invalidates sessions. Set JWT_SECRET in server/.env');
    return;
  }
  if (secret.length < 32) {
    if (isProd) {
      throw new Error('JWT_SECRET must be at least 32 characters long.');
    }
    // eslint-disable-next-line no-console
    console.warn('⚠️  JWT_SECRET is shorter than 32 characters — use a long random value.');
  }
  if (KNOWN_SECRETS.has(secret.toLowerCase())) {
    if (isProd) {
      throw new Error('JWT_SECRET is a known placeholder — replace it before deploying publicly.');
    }
    // eslint-disable-next-line no-console
    console.warn('🚨  JWT_SECRET is a well-known placeholder. REPLACE IT before any public exposure.');
  }
}

async function start() {
  validateBootConfig();
  await connectDB();
  // eslint-disable-next-line no-console
  console.log('MongoDB connected');
  try {
    const result = await runSeeds();
    if (result.templatesSeeded) {
      // eslint-disable-next-line no-console
      console.log(`Seeded template library (v${result.seedVersion || 2})`);
    }
    if (result.created) {
      // eslint-disable-next-line no-console
      console.log(`Seeded public demo site for ${result.demoUser.email}`);
    }
    if (result.adminCreated) {
      // eslint-disable-next-line no-console
      console.log(`Seeded platform admin account ${result.adminUser.email}`);
    }
  } catch (err) {
    if (isProd) {
      // Booting production without seeds (e.g. no admin account) is a broken deploy.
      throw err;
    }
    // eslint-disable-next-line no-console
    console.error('Seeding warning (continuing):', err.message);
  }
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`SiteForge server running on port ${PORT}`);
  });
}

if (require.main === module) {
  start().catch((err) => {
    // eslint-disable-next-line no-console
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { app, start };

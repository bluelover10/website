require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { runSeeds } = require('./services/seed.service');

const PORT = process.env.PORT || 5000;

async function start() {
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
  } catch (err) {
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

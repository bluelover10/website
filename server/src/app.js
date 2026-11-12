const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');

const { errorHandler, notFound } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const websiteRoutes = require('./routes/websites.routes');
const pagesRoutes = require('./routes/pages.routes');
const versionsRoutes = require('./routes/versions.routes');
const templateRoutes = require('./routes/templates.routes');
const mediaRoutes = require('./routes/media.routes');
const formsRoutes = require('./routes/forms.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const membersRoutes = require('./routes/members.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim()),
    credentials: true,
  })
);
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Static uploads
const uploadDirName = process.env.UPLOAD_DIR || 'uploads';
const uploadPath = path.isAbsolute(uploadDirName)
  ? uploadDirName
  : path.join(__dirname, '..', uploadDirName);
app.use('/uploads', express.static(uploadPath));

// Health
app.get('/healthz', (req, res) => {
  res.json({ success: true, message: 'OK', data: { status: 'ok', time: new Date().toISOString() } });
});
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'OK', data: { status: 'ok' } });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/websites', websiteRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/forms', formsRoutes);
// Standalone aliases (websiteId via params/query/body + authorize)
app.use('/api/pages', pagesRoutes);
app.use('/api/versions', versionsRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/media', mediaRoutes);
// Platform admin (account role, enforced by requireAdmin)
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;

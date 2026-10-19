// Server startup file
// Connects to database, starts Express server on configured port
// Handles graceful shutdown and uncaught exceptions

const app = require('./app');
const config = require('./config/environment');
const notificationEngine = require('./services/notification/notificationEngine');
const { seedDefaultTemplates } = require('./services/notification/defaultTemplates');

const PORT = config.PORT || 5000;

const server = app.listen(PORT, async () => {
    console.log(`\n🔗 API URL (SERVER) : http://localhost:${PORT}/api`);
    // Seed default notification templates and start background scheduler
    try {
        await seedDefaultTemplates();
        notificationEngine.startScheduler(60000);
    } catch (e) {
        console.error('Notification startup initialization error:', e);
    }
});

// GRACEFUL SHUTDOWN 
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    notificationEngine.stopScheduler();
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT signal received: closing HTTP server');
    notificationEngine.stopScheduler();
    server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
    });
});

process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
});

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    server.close(() => process.exit(1));
});

module.exports = server;
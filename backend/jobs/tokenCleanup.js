import cron from "node-cron";
import { cleanupExpiredTokens } from "../utils/tokenManager.js";

/**
 * Token cleanup job - runs every day at 2 AM
 * Removes expired and inactive refresh tokens
 */
export const startTokenCleanupJob = () => {
	// Run cleanup every day at 2:00 AM
	cron.schedule('0 2 * * *', async () => {
		try {
			console.log('Starting token cleanup job...');
			const deletedCount = await cleanupExpiredTokens();
			console.log(`Token cleanup completed. Removed ${deletedCount} expired tokens.`);
		} catch (error) {
			console.error('Token cleanup job failed:', error);
		}
	}, {
		scheduled: true,
		timezone: "Asia/Kolkata" // Adjust to your timezone
	});

	console.log('Token cleanup job scheduled to run daily at 2:00 AM');
};

/**
 * Manual cleanup function for immediate execution
 */
export const runTokenCleanup = async () => {
	try {
		console.log('Running manual token cleanup...');
		const deletedCount = await cleanupExpiredTokens();
		console.log(`Manual cleanup completed. Removed ${deletedCount} expired tokens.`);
		return deletedCount;
	} catch (error) {
		console.error('Manual token cleanup failed:', error);
		throw error;
	}
};

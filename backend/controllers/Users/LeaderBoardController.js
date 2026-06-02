import User from "../../models/User/Users.js";
import LeaderBoard from "../../models/User/LeaderBoard.js";
import cron from "node-cron";
import { configDotenv } from "dotenv";
configDotenv();

/**
 * Internal function to build leaderboard
 * Uses Exp field from User model
 * Ranks users by experience points
 */
const rebuildLeaderboardInternal = async () => {
	try {
		// Fetch all SAKEC users with their Exp field
		const users = await User.find({
			College_name: { $regex: /^SAKEC$/i }
		}).select("_id Exp");

		if (!users || users.length === 0) {
			console.log("No users found for leaderboard");
			return;
		}

		// Sort users by Exp in descending order
		const sortedUsers = users
			.map(user => ({
				userId: user._id,
				exp: user.Exp || 0
			}))
			.sort((a, b) => b.exp - a.exp);

		// Delete all existing leaderboard entries - completely clear the collection
		const deleteResult = await LeaderBoard.deleteMany({});
		console.log(`Deleted ${deleteResult.deletedCount} old leaderboard entries`);

		// Bulk insert leaderboard data with ranks
		const leaderboardData = sortedUsers.map((user, index) => ({
			user: user.userId,
			exp: user.exp,
			rank: index + 1
		}));

		const insertResult = await LeaderBoard.insertMany(leaderboardData);
		console.log(`Leaderboard rebuilt successfully with ${insertResult.length} users`);
	} catch (error) {
		console.error("Error rebuilding leaderboard:", error);
	}
};

/**
 * Fetch and return complete leaderboard
 */
export const getCompleteLeaderboard = async (req, res) => {
	try {
		const { page = 1, limit = 20 } = req.query;
		const skip = (parseInt(page) - 1) * parseInt(limit);

		const totalCount = await LeaderBoard.countDocuments();
		const leaderboard = await LeaderBoard.find()
			.populate("user", "name student_prn email Gender Department College_name Year")
			.sort({ rank: 1 })
			.skip(skip)
			.limit(parseInt(limit));

		if (!leaderboard || leaderboard.length === 0) {
			return res.status(404).json({
				message: "No leaderboard data found",
				success: false
			});
		}

		return res.status(200).json({
			message: "Leaderboard fetched successfully",
			success: true,
			data: {
				leaderboard,
				pagination: {
					currentPage: parseInt(page),
					totalPages: Math.ceil(totalCount / parseInt(limit)),
					totalUsers: totalCount,
					itemsPerPage: parseInt(limit)
				}
			}
		});
	} catch (error) {
		console.error("Error fetching leaderboard:", error);
		return res.status(500).json({
			message: "Failed to fetch leaderboard",
			success: false,
			error: error.message
		});
	}
};

/**
 * Manually trigger leaderboard build
 */
export const buildLeaderboard = async (req, res) => {
	try {
		await rebuildLeaderboardInternal();

		const leaderboard = await LeaderBoard.find()
			.populate("user", "name student_prn email Department")
			.sort({ rank: 1 })
			.limit(10);

		return res.status(200).json({
			message: "Leaderboard built successfully",
			success: true,
			data: {
				totalUsers: await LeaderBoard.countDocuments(),
				topUsers: leaderboard
			}
		});
	} catch (error) {
		console.error("Error building leaderboard:", error);
		return res.status(500).json({
			message: "Failed to build leaderboard",
			success: false,
			error: error.message
		});
	}
};

/**
 * Initialize automatic leaderboard updates
 * Updates leaderboard at 11:00 PM daily and every 5 minutes
 */
export const initializeLeaderboardScheduler = () => {
	// Initial build on startup
	rebuildLeaderboardInternal();
	
	// Schedule daily update at 11:00 PM (23:00)
	// Cron format: minute hour day month weekday
	cron.schedule('0 23 * * *', () => {
		console.log(`[${new Date().toISOString()}] Running scheduled leaderboard update at 11:00 PM...`);
		rebuildLeaderboardInternal();
	});
	
	console.log("Leaderboard scheduler initialized - Daily update at 11:00 PM + polling every 5 minutes");
	
	// Additional polling every 5 minutes for near real-time updates
	setInterval(() => {
		console.log(`[${new Date().toISOString()}] Polling leaderboard update...`);
		rebuildLeaderboardInternal();
	}, 300000); // 5 minutes
};

/**
 * Clean leaderboard - removes eventsAttended field and rebuilds with exp only
 * Fixes data migration issues
 */
export const cleanLeaderboard = async (req, res) => {
	try {
		console.log("Cleaning leaderboard - removing old fields");
		
		// Find all documents with eventsAttended field
		const oldDocs = await LeaderBoard.find({ eventsAttended: { $exists: true } });
		console.log(`Found ${oldDocs.length} documents with old eventsAttended field`);
		
		// Delete all old documents
		await LeaderBoard.deleteMany({});
		
		// Drop collection
		try {
			await LeaderBoard.collection.drop();
			console.log("Dropped leaderboard collection");
		} catch (e) {
			console.log("Could not drop collection");
		}
		
		// Wait for deletion
		await new Promise(resolve => setTimeout(resolve, 200));
		
		// Get fresh user data
		const users = await User.find({
			College_name: { $regex: /^SAKEC$/i }
		}).select("_id Exp");
		
		console.log(`Found ${users.length} users to add to leaderboard`);
		
		const sortedUsers = users
			.map(user => ({
				userId: user._id,
				exp: user.Exp || 0
			}))
			.sort((a, b) => b.exp - a.exp);
		
		// Create new clean entries
		const leaderboardData = sortedUsers.map((user, index) => ({
			user: user.userId,
			exp: user.exp,
			rank: index + 1
		}));
		
		const result = await LeaderBoard.insertMany(leaderboardData);
		console.log(`Created ${result.length} clean leaderboard entries with exp field only`);
		
		// Verify
		const sample = await LeaderBoard.findOne({});
		console.log("Sample clean entry:", JSON.stringify(sample, null, 2));
		
		return res.status(200).json({
			message: "Leaderboard cleaned successfully - eventsAttended removed, exp field only",
			success: true,
			data: {
				oldEntriesRemoved: oldDocs.length,
				newEntriesCreated: result.length,
				sampleEntry: sample,
				timestamp: new Date()
			}
		});
	} catch (error) {
		console.error("Error cleaning leaderboard:", error);
		return res.status(500).json({
			message: "Failed to clean leaderboard",
			success: false,
			error: error.message
		});
	}
};
export const forceRebuildLeaderboard = async (req, res) => {
	try {
		console.log("Force rebuild triggered - clearing ALL leaderboard data");
		
		// Method 1: Delete all existing entries
		const deleteResult = await LeaderBoard.deleteMany({});
		console.log(`Deleted ${deleteResult.deletedCount} old leaderboard entries`);
		
		// Method 2: Drop the entire collection and recreate
		try {
			await LeaderBoard.collection.drop();
			console.log("Dropped entire leaderboard collection");
		} catch (dropError) {
			console.log("Collection drop info:", dropError.message);
		}
		
		// Wait a moment for deletion to complete
		await new Promise(resolve => setTimeout(resolve, 100));
		
		// Rebuild from scratch
		console.log("Starting fresh leaderboard rebuild...");
		await rebuildLeaderboardInternal();
		
		// Verify the rebuild
		const verifyEntries = await LeaderBoard.find({}).limit(1);
		console.log("Sample entry after rebuild:", JSON.stringify(verifyEntries[0], null, 2));
		
		const count = await LeaderBoard.countDocuments();
		
		return res.status(200).json({
			message: "Leaderboard force rebuilt successfully - old data cleared",
			success: true,
			data: {
				totalEntries: count,
				deletedOldEntries: deleteResult.deletedCount,
				sampleEntry: verifyEntries[0],
				timestamp: new Date()
			}
		});
	} catch (error) {
		console.error("Error force rebuilding leaderboard:", error);
		return res.status(500).json({
			message: "Failed to force rebuild leaderboard",
			success: false,
			error: error.message
		});
	}
};

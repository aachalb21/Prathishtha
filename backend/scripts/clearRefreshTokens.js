#!/usr/bin/env node
/**
 * Clear all old refresh tokens from database
 * This is needed after the schema change from storing plain tokens to only storing token hashes
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const clearTokens = async () => {
	try {
		console.log("🔄 Connecting to MongoDB...");
		
		await mongoose.connect(process.env.MONGO_URI, {
			dbName: process.env.MONGO_DATABASE,
		});
		
		console.log("✅ Connected to MongoDB");

		const db = mongoose.connection.db;
		
		// Drop the entire RefreshToken collection
		try {
			await db.collection("refreshtokens").drop();
			console.log("✅ Cleared all refresh tokens from database");
		} catch (err) {
			if (err.code === 26) {
				// namespace does not exist (collection doesn't exist)
				console.log("✅ Collection already empty or doesn't exist");
			} else {
				throw err;
			}
		}

		await mongoose.disconnect();
		console.log("✅ Disconnected from MongoDB");
		console.log("\n✨ Refresh tokens cleared successfully!");
		console.log("📝 New tokens will be created with the correct schema on next login.\n");
		
		process.exit(0);
	} catch (error) {
		console.error("❌ Error clearing tokens:", error.message);
		process.exit(1);
	}
};

clearTokens();

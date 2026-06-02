#!/usr/bin/env node
/**
 * Clean MongoDB RefreshToken collection completely
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const cleanTokenCollection = async () => {
	try {
		console.log("🔄 Connecting to MongoDB...");
		
		await mongoose.connect(process.env.MONGO_URI, {
			dbName: process.env.MONGO_DATABASE,
		});
		
		console.log("✅ Connected to MongoDB");

		const db = mongoose.connection.db;
		
		// Drop the entire RefreshToken collection and recreate it clean
		try {
			const collections = await db.listCollections().toArray();
			const hasCollection = collections.some(c => c.name === 'refreshtokens');
			
			if (hasCollection) {
				await db.collection("refreshtokens").drop();
				console.log("✅ Dropped refreshtokens collection");
			} else {
				console.log("ℹ️  refreshtokens collection doesn't exist");
			}
		} catch (err) {
			console.log("ℹ️  Collection doesn't exist or error:", err.message);
		}

		// Also remove any indexes that might be causing issues
		try {
			await db.collection("refreshtokens").dropIndexes();
			console.log("✅ Dropped all indexes");
		} catch (err) {
			console.log("ℹ️  No indexes to drop");
		}

		await mongoose.disconnect();
		console.log("✅ Disconnected from MongoDB");
		console.log("\n✨ Database cleaned successfully!");
		console.log("📝 New tokens will be created with the correct schema on next login.\n");
		
		process.exit(0);
	} catch (error) {
		console.error("❌ Error cleaning tokens:", error.message);
		process.exit(1);
	}
};

cleanTokenCollection();

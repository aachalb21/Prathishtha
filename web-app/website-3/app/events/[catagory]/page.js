"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import Footer from "@/components/layout/Footer";
import { useEvents, useEventLoading, useEventError, useEventActions } from "../../Service/Stores";
import logger from "@/utils/logger";

const getCategoryInfo = (category) => {
	const categoryData = {
		aurum: {
			title: "Aurum",
			subtitle: "Technical Excellence",
			description: "Showcase your technical skills through coding competitions, hackathons, and innovation challenges.",
			gradient: "from-yellow-400 to-amber-400",
			bgGradient: "from-yellow-100 to-amber-100",
		},
		olympus: {
			title: "Olympus",
			subtitle: "Sports & Fitness",
			description: "Compete in various sports activities and showcase your athletic prowess.",
			gradient: "from-purple-400 to-violet-400",
			bgGradient: "from-purple-100 to-violet-100",
		},
		verve: {
			title: "Verve",
			subtitle: "Cultural Events",
			description: "Express your creativity through cultural performances, arts, and literary competitions.",
			gradient: "from-pink-400 to-rose-400",
			bgGradient: "from-pink-100 to-rose-100",
		},
		yuva: {
			title: "Yuva",
			subtitle: "Inugural Events",
			description: "Celebrate new beginnings with events designed for freshers and newcomers.",
			gradient: "from-green-400 to-emerald-400",
			bgGradient: "from-green-100 to-emerald-100",
		},
	};
	return categoryData[category?.toLowerCase()] || categoryData.aurum;
};



export default function CategoryEventsPage() {
	const params = useParams();
	const category = params.catagory;
	const categoryInfo = getCategoryInfo(category);

	// Use event store hooks
	const allEvents = useEvents();
	const loading = useEventLoading();
	const error = useEventError();
	const { fetchEventsByCategory } = useEventActions();

	// Filter events by category
	const categoryEvents = allEvents.filter(event =>
		event.event_catagory.toLowerCase() === category?.toLowerCase()
	);

	useEffect(() => {
		// Fetch events by category on component mount
		if (category) {
			// Capitalize the first letter of the category for API
			const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
			fetchEventsByCategory(capitalizedCategory);
		}
	}, [category, fetchEventsByCategory]);

	// Debug logging
	useEffect(() => {
		const capitalizedCategory = category ? category.charAt(0).toUpperCase() + category.slice(1).toLowerCase() : category;
		logger.log('Category (original):', category);
		logger.log('Category (capitalized):', capitalizedCategory);
		logger.log('All events:', allEvents);
		logger.log('Category events:', categoryEvents);
		logger.log('Loading:', loading);
		logger.log('Error:', error);
	}, [category, allEvents, categoryEvents, loading, error]);

	if (loading) {
		return (
			<div className="min-h-screen bg-yellow-50 flex items-center justify-center comic-font">
				<div className="text-3xl text-black border-4 border-dashed border-yellow-400 p-8 rounded-xl shadow-comic">
					Loading {categoryInfo.title} Events...
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="min-h-screen bg-red-50 flex items-center justify-center comic-font">
				<div className="text-center">
					<div className="text-3xl text-red-600 border-4 border-dashed border-red-400 p-8 rounded-xl shadow-comic mb-4">
						Oops! Something went wrong
					</div>
					<p className="text-red-500 mb-4">{error}</p>
					<button
						onClick={() => {
							const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
							fetchEventsByCategory(capitalizedCategory);
						}}
						className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white flex flex-col gap-4 pt-20 comic-font">
			{/* Hero Section */}
			<div className={`bg-linear-to-br ${categoryInfo.bgGradient}  border-4 border-black relative overflow-hidden`}>
				<div className="relative container mx-auto px-6 py-16">
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
						className="text-center max-w-4xl mx-auto"
					>
						<h1 className={`text-7xl font-bold text-black mb-4 comic-font`}>
							{categoryInfo.title}
						</h1>
						<p className="text-2xl text-black/90 mb-4 comic-font">{categoryInfo.subtitle}</p>
						<p className="text-black/70 text-lg max-w-2xl mx-auto comic-font">{categoryInfo.description}</p>
					</motion.div>
				</div>
			</div>

			<div className="bg-yellow-50 border-4 -skew-y-1 border-black px-6 py-8">
				{/* Back to All Events */}
				<motion.div
					initial={{ opacity: 0, x: -50 }}
					animate={{ opacity: 1, x: 0 }}
					transition={{ duration: 0.6 }}
					className="mb-8"
				>
					<Link
						href="/events"
						className="inline-flex items-center text-yellow-600 hover:text-yellow-800 transition-colors comic-font"
					>
						<span className="mr-2">←</span>
						Back to All Events
					</Link>
				</motion.div>

				{/* Events Grid */}
				{categoryEvents.length === 0 ? (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className="text-center py-12"
					>
						<p className="text-black/60 text-lg">No {categoryInfo.title} events found.</p>
					</motion.div>
				) : (
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ duration: 0.6, delay: 0.4 }}
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
					>
						{categoryEvents.map((event) => (
							<motion.div
								key={event._id}
								initial={{ opacity: 0, y: 50 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6 }}
								className="group bg-white border-4 border-black rounded-xl overflow-hidden shadow-comic hover:scale-105 transition-transform duration-300 comic-panel"
							>
								{/* Event Image */}
								{event.event_poster && (
									<div className="h-48 bg-gray-200 relative overflow-hidden border-b-4 border-black">
										<Image
											src={event.event_poster}
											alt={event.event_name}
											width={400}
											height={192}
											className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
										/>
									</div>
								)}
								{/* Event Content */}
								<div className="p-6">
									<h3 className="text-2xl font-bold text-black mb-2 comic-font">{event.event_name}</h3>
									<p className="text-black/70 text-sm mb-4 line-clamp-2 comic-font">{event.event_description}</p>
									<div className="space-y-2 mb-4 text-sm">
										<div className="flex items-center text-black/70">
											<span className="w-4 h-4 mr-2">📅</span>
											{new Date(event.event_date).toLocaleDateString("en-US", {
												weekday: "short",
												year: "numeric",
												month: "short",
												day: "numeric",
											})}
										</div>
										<div className="flex items-center text-black/70">
											<span className="w-4 h-4 mr-2">👥</span>
											{event.team_type === "Individual" ? "Solo" : event.team_type} ({event.team_size} member{event.team_size > 1 ? "s" : ""})
										</div>
										<div className="flex items-center text-black/70">
											<span className="w-4 h-4 mr-2">🏆</span>
											{event.event_type}
										</div>
										<div className="flex items-center text-black/70">
											<span className="w-4 h-4 mr-2">💰</span>
											<span className="font-semibold">
												{event.event_fee && event.event_fee > 0 ? `₹${event.event_fee}` : "Free"}
											</span>
										</div>
										{/* {event.max_participants && (
											<div className="flex items-center text-black/70">
												<span className="w-4 h-4 mr-2">🎯</span>
												{event.current_participants || 0} / {event.max_participants} registered
											</div>
										)} */}
									</div>
									<Link
										href={`/events/${category}/${event.event_slug}`}
										className={`block w-full text-center px-4 py-2 bg-yellow-300 border-2 border-black hover:bg-yellow-400 text-black rounded-lg font-bold transition-all duration-300 comic-font`}
									>
										View Details & Register
									</Link>
								</div>
							</motion.div>
						))}
					</motion.div>
				)}
			</div>
            <Footer/>
		</div>
        
	);
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useEvents, useEventLoading, useEventError, useEventActions } from "../Service/Stores";
import logger from "@/utils/logger";

// --- Comic Style Helper (add comic font, border, etc. in CSS) ---
// You can add a comic font in your global CSS and use className="comic-font" below

const getCategoryColor = (category) => {
	switch (category) {
		case "Aurum": return "from-yellow-400 to-amber-400";
		case "Olympus": return "from-purple-400 to-violet-400";
		case "Verve": return "from-pink-400 to-rose-400";
		default: return "from-gray-400 to-gray-500";
	}
};


export default function EventsPage() {
	// Use event store hooks
	const allEvents = useEvents();
	const loading = useEventLoading();
	const error = useEventError();
	const { fetchEvents } = useEventActions();

	// Pagination state
	const [currentPage, setCurrentPage] = useState(1);
	const eventsPerPage = 9; // Show 9 events per page (3x3 grid)
	const eventsContainerRef = useRef(null);

	// Calculate pagination
	const totalPages = Math.ceil(allEvents.length / eventsPerPage);
	const indexOfLastEvent = currentPage * eventsPerPage;
	const indexOfFirstEvent = indexOfLastEvent - eventsPerPage;
	const currentEvents = allEvents.slice(indexOfFirstEvent, indexOfLastEvent);

	// Smooth scroll to top of events section when page changes
	const scrollToEvents = () => {
		if (eventsContainerRef.current) {
			eventsContainerRef.current.scrollIntoView({ 
				behavior: 'smooth', 
				block: 'start'
			});
		}
	};

	// Handle page change with smooth scroll
	const handlePageChange = (newPage) => {
		setCurrentPage(newPage);
		setTimeout(() => scrollToEvents(), 100);
	};

	// Reset to page 1 when events change
	useEffect(() => {
		if (allEvents.length > 0) {
			setCurrentPage(1);
		}
	}, [allEvents.length]);

	useEffect(() => {
		// Fetch public events on component mount
		fetchEvents();
	}, [fetchEvents]);

	// Debug logging
	useEffect(() => {
		logger.log('Events data:', allEvents);
		logger.log('Loading:', loading);
		logger.log('Error:', error);
	}, [allEvents, loading, error]);

	if (loading) {
		return (
			<div className="min-h-screen bg-yellow-50 flex items-center justify-center comic-font">
				<div className="text-3xl text-black border-4 border-dashed border-yellow-400 p-8 rounded-xl shadow-comic">
					Loading Comic Events...
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
						onClick={() => fetchPublicEvents()}
						className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
					>
						Try Again
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen relative pt-20 comic-font">
			{/* Comic background image with black overlay */}
			<div className="absolute inset-0 z-0">
				<Image
					src="/Assets/Background/event-bg.png"
					alt="Comic Background"
					fill
					className="object-cover w-full h-full"
					priority
				/>
				<div className="absolute inset-0 bg-black/30" />
			</div>
			<div className="container mx-auto px-6 py-8 relative z-10">
				{/* Comic Header */}
				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8 }}
					className="text-center mb-12"
				>
					<h1 className="text-6xl font-extrabold text-white drop-shadow-comic mb-4 comic-font">
						🎉 Comic Events 🎉
					</h1>
					<p className="text-xl text-white max-w-2xl mx-auto comic-font">
						Dive into a world of fun, quirky, and competitive events!
					</p>
				</motion.div>

				{/* Comic Events Grid */}
				<motion.div
					ref={eventsContainerRef}
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.4 }}
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
				>
					{allEvents.length === 0 ? (
						<div className="col-span-full text-center py-12">
							<div className="text-4xl text-white border-4 border-dashed border-yellow-400 p-8 rounded-xl shadow-comic comic-font">
								No events available right now! 🎭
							</div>
							<p className="text-white/80 mt-4 comic-font">
								Check back later for exciting events and competitions!
							</p>
						</div>
					) : (
						currentEvents.map((event, index) => (
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
										loading="eager"
										priority={index < 3 && currentPage === 1}
									/>
									{/* Category Badge */}
									<div className="absolute top-3 left-3">
										<span className={`px-3 py-1 rounded-full text-xs font-bold bg-linear-to-r ${getCategoryColor(event.event_catagory)} text-black border-2 border-black comic-font`}>
											{event.event_catagory}
										</span>
									</div>
								</div>
							)}

							{/* Event Content */}
							<div className="p-6">
								<h3 className="text-2xl font-bold text-black mb-2 comic-font">
									{event.event_name}
								</h3>
								<p className="text-black/70 text-sm mb-4 line-clamp-2 comic-font">
									{event.event_description}
								</p>
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
									{event.max_participants && (
										<div className="flex items-center text-black/70">
											<span className="w-4 h-4 mr-2">🎯</span>
											{event.current_participants || 0} / {event.max_participants} registered
										</div>
									)}
								</div>
								<Link
									href={`/events/${event.event_catagory.toLowerCase()}/${event.event_slug}`}
									className="block w-full text-center px-4 py-2 bg-yellow-300 border-2 border-black hover:bg-yellow-400 text-black rounded-lg font-bold transition-all duration-300 comic-font"
								>
									View Details & Register
								</Link>
							</div>
						</motion.div>
						))
					)}
				</motion.div>

				{/* Pagination Controls */}
				{allEvents.length > eventsPerPage && (
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.5 }}
						className="flex justify-center items-center gap-2 mt-12"
					>
						{/* Previous Button */}
						<button
						onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
							disabled={currentPage === 1}
							className={`px-4 py-2 border-2 border-black rounded-lg font-bold comic-font transition-all duration-300 ${
								currentPage === 1
									? 'bg-gray-300 text-gray-500 cursor-not-allowed'
									: 'bg-yellow-300 text-black hover:bg-yellow-400 hover:scale-105'
							}`}
						>
							← Previous
						</button>

						{/* Page Numbers */}
						<div className="flex gap-2">
							{Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
								// Show first page, last page, current page, and pages around current
								const showPage = 
									pageNum === 1 ||
									pageNum === totalPages ||
									Math.abs(pageNum - currentPage) <= 1;

								// Show ellipsis
								const showEllipsisBefore = pageNum === currentPage - 2 && currentPage > 3;
								const showEllipsisAfter = pageNum === currentPage + 2 && currentPage < totalPages - 2;

								if (showEllipsisBefore || showEllipsisAfter) {
									return (
										<span key={pageNum} className="px-3 py-2 text-white comic-font">
											...
										</span>
									);
								}

								if (!showPage) return null;

								return (
									<button
										key={pageNum}
										onClick={() => handlePageChange(pageNum)}
										className={`px-4 py-2 border-2 border-black rounded-lg font-bold comic-font transition-all duration-300 ${
											currentPage === pageNum
												? 'bg-pink-400 text-black scale-110'
												: 'bg-white text-black hover:bg-yellow-300 hover:scale-105'
										}`}
									>
										{pageNum}
									</button>
								);
							})}
						</div>

						{/* Next Button */}
						<button
						onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
							disabled={currentPage === totalPages}
							className={`px-4 py-2 border-2 border-black rounded-lg font-bold comic-font transition-all duration-300 ${
								currentPage === totalPages
									? 'bg-gray-300 text-gray-500 cursor-not-allowed'
									: 'bg-yellow-300 text-black hover:bg-yellow-400 hover:scale-105'
							}`}
						>
							Next →
						</button>
					</motion.div>
				)}

				{/* Pagination Info */}
				{allEvents.length > 0 && (
					<div className="text-center mt-6">
						<p className="text-white/90 comic-font">
							Showing {indexOfFirstEvent + 1} - {Math.min(indexOfLastEvent, allEvents.length)} of {allEvents.length} events
						</p>
					</div>
				)}

				{/* Comic Category Quick Links */}
				<motion.div
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.6 }}
					className="mt-16"
				>
					<h2 className="text-3xl font-bold text-white text-center mb-8 comic-font">
						Browse by Category
					</h2>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-6">
						{[
							{ name: "Aurum", gradient: "from-yellow-400 to-amber-400", description: "Technical Excellence" },
							{ name: "Olympus", gradient: "from-purple-400 to-violet-400", description: "Sports & Fitness" },
							{ name: "Verve", gradient: "from-pink-400 to-rose-400", description: "Cultural Events" },
						].map((category) => (
							<Link
								key={category.name}
								href={`/events/${category.name.toLowerCase()}`}
								className={`block p-6 bg-linear-to-br ${category.gradient} border-2 border-black rounded-lg text-black font-bold text-center hover:scale-105 transition-transform duration-300 shadow-comic comic-font`}
							>
								<h3 className="text-2xl mb-2 comic-font">{category.name}</h3>
								<p className="text-black/80 text-sm comic-font">{category.description}</p>
							</Link>
						))}
					</div>
				</motion.div>
			</div>
		</div>
	);
}

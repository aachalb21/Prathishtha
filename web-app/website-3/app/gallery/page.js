"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import GalleryAPI from "../Service/Api/GalleryAPI";
import { ImageIcon } from "lucide-react";
import Image from "next/image";
import logger from "@/utils/logger";

export default function Gallery() {
  const [photos, setPhotos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Category mapping
  const categories = [
    { name: "All", value: "all", icon: "📸" },
    { name: "Yuva", value: "Yuva", icon: "🤝" },
    { name: "Olympus", value: "Olympus", icon: "⚽" },
    { name: "Verve", value: "Verve", icon: "🎭" },
    { name: "Aurum", value: "Aurum", icon: "💻" },
    { name: "Others", value: "Others", icon: "🌟" },
  ];

  // Helper function to check if image is recently added (within 7 days)
  const isRecentlyAdded = (createdAt) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return new Date(createdAt) > sevenDaysAgo;
  };

  // Fetch photos from API
  const fetchPhotos = async (category = "all", page = 1) => {
    try {
      setIsLoading(true);
      setError(null);

      const filters = {
        page,
        limit: 12,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      // Add category filter if not "all"
      if (category !== "all") {
        filters.eventCategory = category;
      }

      const response = await GalleryAPI.getGalleryPhotos(filters);

      if (response.success && response.data) {
        setPhotos(response.data);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        setError(response.message || "Failed to load gallery");
        setPhotos([]);
      }
    } catch (err) {
      logger.error("Error fetching photos:", err);
      setError("Failed to load gallery photos");
      setPhotos([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPhotos(selectedCategory, currentPage);
  }, [selectedCategory, currentPage]);

  const filteredPhotos = photos; // API already handles filtering

  return (
    <section className="relative w-full min-h-screen py-20 mt-10 border-y-4 border-black bg-amber-700 ">
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle,black_2px,transparent_2px)] bg-size-[16px_16px]"></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="flex justify-center mb-12">
          <div className="bg-white px-8 py-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] rotate-2">
            <h2 className="font-bangers text-5xl md:text-6xl text-black">
              Memories
            </h2>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="md:flex grid grid-cols-2 justify-center gap-4 mb-8">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`px-4 py-2 font-bold border-2 border-black rounded-xl shadow-lg transition-all ${
                selectedCategory === cat.value
                  ? "bg-yellow-400 text-black"
                  : "bg-white text-gray-700 hover:bg-yellow-200"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {filteredPhotos.length === 0 ? (
            <div className="col-span-2 md:col-span-4 flex flex-col items-center justify-center py-12">
              <div className="bg-red-100 border-4 border-red-600 rounded-2xl p-6 mb-4">
                <p className="text-red-800 font-black text-lg">
                  No events found for this category.
                </p>
              </div>
              <div className="text-gray-600 font-bold">
                Try another filter or check back later!
              </div>
            </div>
          ) : (
            filteredPhotos.map((item, index) => {
              logger.log("Gallery item:", item);
              return (
                <div
                  key={item._id || item.id || `photo-${index}`}
                  className={`bg-white p-2 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:scale-105 transition-transform duration-200 ${
                    index % 2 === 0 ? "rotate-1" : "-rotate-1"
                  }`}
                >
                  <div className="h-32 md:h-40 bg-gray-100 border-2 border-black mb-2 overflow-hidden flex items-center justify-center relative group">
                    {item.imageUrl ? (
                      <Image
                        width={120}
                        height={120}
                        src={item.imageUrl}
                        alt={item.name || "Gallery Photo"}
                        className="object-cover w-full h-full group-hover:scale-110 transition"
                      />
                    ) : (
                      <ImageIcon className="text-gray-400 w-12 h-12 group-hover:scale-110 transition" />
                    )}
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition"></div>
                    {isRecentlyAdded(item.createdAt) && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded shadow-lg z-10">
                        NEW
                      </span>
                    )}
                  </div>
                  <div className="bg-[#FFD700] font-comic text-xs uppercase tracking-wide text-black border-2 border-black p-2">
                    <p>{item.name}</p>
                    <p>#{item.description}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

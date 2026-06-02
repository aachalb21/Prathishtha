"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import {
  useEvent,
  useEventLoading,
  useEventError,
  useEventActions,
  useAuthStore,
} from "../../../Service/Stores";
import {
  useUser,
  useIsAuthenticated,
  useAuthActions,
} from "../../../Service/Stores";
import EventAPI from "../../../Service/Api/EventAPI";
import logger from "@/utils/logger";
import PaymentAPI from "../../../Service/Api/PaymentAPI";

// Memoized category info to prevent recalculation
const CATEGORY_DATA = {
  aurum: {
    title: "Aurum",
    gradient: "from-yellow-400 to-amber-400",
    bgGradient: "from-yellow-100 to-amber-100",
  },
  olympus: {
    title: "Olympus",
    gradient: "from-purple-400 to-violet-400",
    bgGradient: "from-purple-100 to-violet-100",
  },
  verve: {
    title: "Verve",
    gradient: "from-pink-400 to-rose-400",
    bgGradient: "from-pink-100 to-rose-100",
  },
};

const getCategoryInfo = (category) => {
  return CATEGORY_DATA[category?.toLowerCase()] || CATEGORY_DATA.aurum;
};

// Memoized helper functions for performance
const isRegistrationAvailable = (event) => {
  if (!event) return false;
  if (!event.registration_open) return false;
  if (
    event.max_participants &&
    event.current_participants >= event.max_participants
  )
    return false;
  if (
    event.team_type === "Team" &&
    event.max_teams &&
    event.current_teams >= event.max_teams
  )
    return false;
  return true;
};

const getRegistrationStatusMessage = (event) => {
  if (!event) return "";
  if (!event.registration_open) return "Registration Closed";
  if (
    event.max_participants &&
    event.current_participants >= event.max_participants
  )
    return "Event Full";
  if (
    event.team_type === "Team" &&
    event.max_teams &&
    event.current_teams >= event.max_teams
  )
    return "All Teams Full";
  return "";
};

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { catagory, slug } = params || {};
  const categoryInfo = getCategoryInfo(catagory);
  const event = useEvent();
  const loading = useEventLoading();
  const error = useEventError();
  const { fetchEventBySlug } = useEventActions();
  const isAuthenticated = useIsAuthenticated();
  const { setUser } = useAuthActions();
  const { user } = useAuthStore();

  // Registration state - memoized with useCallback
  const [registrationInfo, setRegistrationInfo] = useState(null);
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState(null);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationMode, setRegistrationMode] = useState("create");
  const [teamName, setTeamName] = useState("");
  const [joinToken, setJoinToken] = useState("");
  const [teamInfo, setTeamInfo] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Fetch event details - optimized with useCallback
  useEffect(() => {
    if (slug) {
      fetchEventBySlug(slug);
      // Clear previous registration info
      setRegistrationInfo(null);
      setRegError(null);
      setTeamInfo(null);
    }
  }, [slug, fetchEventBySlug]);

  // Check if event is casual (allows multiple registrations)
  const isCasualEvent = useMemo(() => event?.event_type === 'Casual', [event?.event_type]);

  // Check if user is already registered - memoized with useMemo
  // For Casual events, always return false to allow multiple registrations
  const isUserRegistered = useMemo(() => {
    if (!event) return false;
    if (isCasualEvent) return false; // Allow multiple registrations for casual events
    // Handle different user data structures from auth store
    const userEvents = user?.data?.user?.Events_registered 
      || user?.data?.Events_registered 
      || user?.Events_registered 
      || [];
    return userEvents.some((e) => {
      if (e.event_id && event._id && String(e.event_id) === String(event._id)) return true;
      if (e.event_slug && event.event_slug && String(e.event_slug) === String(event.event_slug)) return true;
      if (e.event_id && event.event_id && String(e.event_id) === String(event.event_id)) return true;
      return false;
    });
  }, [event, isCasualEvent, user?.data?.user?.Events_registered, user?.data?.Events_registered, user?.Events_registered]);

  // Update registration info when user is already registered (skip for casual events)
  useEffect(() => {
    if (isUserRegistered && !registrationInfo?.registered && !isCasualEvent) {
      setRegistrationInfo({
        registered: true,
        message: "You are already registered for this event",
      });
    }
  }, [isUserRegistered, registrationInfo?.registered, isCasualEvent]);

  // Registration logic - memoized to prevent recalculation (MUST BE BEFORE EARLY RETURNS)
  // Casual events always allow registration (multiple registrations permitted)
  const canRegister = useMemo(
    () => isRegistrationAvailable(event) && (isCasualEvent || (!isUserRegistered && !registrationInfo?.registered)),
    [event, isCasualEvent, isUserRegistered, registrationInfo?.registered]
  );
  const registrationMessage = useMemo(
    () => registrationInfo?.message || "",
    [registrationInfo?.message]
  );
  const isTeamEvent = useMemo(() => event?.team_type === "Team", [event?.team_type]);

  // Utility functions
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    });
  }, []);

  // Registration handler - must be defined before handleRegisterClick
  const handleRegister = useCallback(async () => {
    setRegError(null);
    setTeamInfo(null);
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    // Allow casual events to always register (multiple registrations permitted)
    if (!canRegister || (!isCasualEvent && registrationInfo?.registered)) {
      // Already registered - show message if not already shown (non-casual events only)
      if (!registrationInfo?.registered && !isCasualEvent) {
        setRegistrationInfo({
          registered: true,
          message: "You are already registered for this event",
        });
      }
      return;
    }
    setRegLoading(true);
    try {
      if (isTeamEvent && registrationMode === "join") {
        if (!joinToken.trim()) {
          setRegError("Please enter a team join token");
          setRegLoading(false);
          return;
        }
        const apiResp = await EventAPI.joinTeam(joinToken.trim(), {});
        if (apiResp && (apiResp.message || apiResp.team)) {
          setRegError(null);
          setRegistrationInfo({
            registered: true,
            message: apiResp?.message || "Successfully joined team.",
          });
          setShowRegistrationModal(false);
          setJoinToken("");
          setRegistrationMode("create");
          // Refresh user data after joining team
          if (setUser && typeof setUser === "function") {
            try {
              const userProfile = await EventAPI.getUserProfile?.();
              if (userProfile) setUser(userProfile);
            } catch (e) {
              // Silently fail on user refresh
            }
          }
        } else {
          setRegError(apiResp?.message || "Failed to join team.");
        }
        setRegLoading(false);
        return;
      }
      // Create new team or individual registration
      const registrationData = {};
      if (isTeamEvent && registrationMode === "create" && teamName.trim()) {
        registrationData.teamName = teamName.trim();
      }
      const apiResp = await EventAPI.registerForEvent(slug, registrationData);

      // Handle paid events - requires payment
      if (apiResp.success && apiResp.requiresPayment) {
        setRegistrationInfo({
          registered: false,
          requiresPayment: true,
          message: apiResp?.message || "Proceed to payment",
          orderId: apiResp.orderId,
          amount: apiResp.amount,
          currency: apiResp.currency,
          eventName: apiResp.eventName,
        });
        if (apiResp.teamId) {
          setTeamInfo({
            teamId: apiResp.teamId,
            joinToken: apiResp.teamJoinToken,
          });
        }
        setShowRegistrationModal(false);
        setTeamName("");
        setRegistrationMode("create");
        // TODO: Redirect to payment page or show payment modal
        // router.push(`/payment/${apiResp.orderId}`);
        return;
      }

      // Handle free events - registered directly
      if (apiResp.success || apiResp.registered) {
        setRegistrationInfo({
          registered: true,
          requiresPayment: false,
          message: apiResp?.message || "Registration successful.",
        });
        if (apiResp.team) {
          setTeamInfo({
            teamId: apiResp.team.id,
            joinToken: apiResp.team.join_token,
            joinLink: apiResp.team.join_link,
          });
        }
        setShowRegistrationModal(false);
        setTeamName("");
        setRegistrationMode("create");
      } else {
        setRegError(apiResp?.message || "Registration failed.");
      }
    } catch (err) {
      const errorMessage = err?.response?.data?.message || err.message || "Registration failed.";
      setRegError(errorMessage);
      
      // If already registered (409), refresh user data to sync state
      if (err?.response?.status === 409) {
        // Mark as registered in UI immediately
        setRegistrationInfo({
          registered: true,
          message: errorMessage,
        });
        try {
          const { default: AuthAPI } = await import("../../../Service/Api/AuthAPI");
          const userResponse = await AuthAPI.getCurrentUser();
          if (userResponse.success && setUser) {
            setUser(userResponse.data.user || userResponse.data);
          }
        } catch (refreshErr) {
          // Silently fail on user refresh
        }
        setShowRegistrationModal(false);
      }
    } finally {
      setRegLoading(false);
    }
  }, [isAuthenticated, canRegister, isCasualEvent, registrationInfo?.registered, isTeamEvent, registrationMode, joinToken, teamName, slug, setUser, router]);

  // Registration click handler
  const handleRegisterClick = useCallback(() => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    if (!canRegister) return;
    if (isTeamEvent) {
      setShowRegistrationModal(true);
    } else {
      handleRegister();
    }
  }, [isAuthenticated, canRegister, isTeamEvent, router, handleRegister]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center comic-font">
        <div className="text-3xl text-black border-4 border-dashed border-yellow-400 p-8 rounded-xl shadow-comic">
          Loading Event Details...
        </div>
      </div>
    );
  }
  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center comic-font">
        <div className="text-center">
          <div className="text-3xl text-red-600 border-4 border-dashed border-red-400 p-8 rounded-xl shadow-comic mb-4">
            Oops! Something went wrong
          </div>
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => fetchEventBySlug(slug)}
            className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  // Not found state
  if (!event) {
    return (
      <div className="min-h-screen bg-yellow-50 flex items-center justify-center comic-font">
        <div className="text-3xl text-red-600 border-4 border-dashed border-red-400 p-8 rounded-xl shadow-comic">
          Event Not Found
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 pt-20 comic-font">
      {/* Hero Section */}
      <div
        className={`bg-linear-to-br ${categoryInfo.bgGradient} relative overflow-hidden`}
      >
        {/* Event Poster as Background with Overlay */}
        {event.event_poster && (
          <div className="absolute inset-0 z-0">
            <Image
              src={event.event_poster}
              alt={event.event_name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
              className="object-cover w-full h-full opacity-30"
              priority
              quality={75}
              loading="eager"
            />
            <div className="absolute inset-0" />
          </div>
        )}
        <div className="relative container mx-auto px-6 py-16 z-10">
          {/* Breadcrumb */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-2 text-black/70">
              <Link
                href="/events"
                className="hover:text-yellow-700 transition-colors"
              >
                Events
              </Link>
              <span>→</span>
              <Link
                href={`/events/${catagory}`}
                className="hover:text-yellow-700 transition-colors"
              >
                {categoryInfo.title}
              </Link>
              <span>→</span>
              <span className="text-black font-bold">{event.event_name}</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Event Details */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center gap-4 mb-4">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-bold bg-linear-to-r ${categoryInfo.gradient} text-black border-2 border-black comic-font`}
                >
                  {event.event_catagory}
                </span>
                <span className="px-3 py-1 rounded-full text-sm font-medium border-2 border-black bg-yellow-200 text-black comic-font">
                  {event.event_status || "upcoming"}
                </span>
              </div>

              <motion.h1
                className="text-5xl font-bold text-black mb-6 comic-font"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {event.event_name}
              </motion.h1>

              {event.event_description && (
                <motion.p
                  className="text-black/80 text-lg leading-relaxed mb-8 comic-font"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  {event.event_description}
                </motion.p>
              )}

              {/* Rulebook Section */}
              {event.rulebook_drive_link && (
                <motion.div
                  className="bg-gradient-to-r from-blue-100 to-cyan-100 border-3 border-black rounded-lg p-6 mb-8 shadow-comic"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.45 }}
                >
                  <h2 className="text-2xl font-bold text-black mb-4 comic-font flex items-center">
                    <span className="mr-3">📋</span> Rulebook
                  </h2>
                  <p className="text-black/70 mb-4">
                    Read the complete rules and guidelines for this event.
                  </p>
                  <a
                    href={event.rulebook_drive_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-6 py-3 border-2 border-black rounded-lg font-bold bg-blue-300 hover:bg-blue-400 text-black transition-all duration-300 comic-font hover:scale-105"
                  >
                    <span className="mr-2">📄</span>
                    View Rulebook (PDF)
                    <span className="ml-2">→</span>
                  </a>
                </motion.div>
              )}

              {/* Event Coordinators Section */}
              {event.event_coordinators && event.event_coordinators.length > 0 && (
                <motion.div
                  className="bg-white border-3 border-black rounded-lg p-6 mb-8 shadow-comic"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <h2 className="text-2xl font-bold text-black mb-6 comic-font flex items-center">
                    <span className="mr-3">👥</span> Event Coordinators
                  </h2>
                  <div className="space-y-4">
                    {event.event_coordinators.map((coordinator, index) => (
                      <div
                        key={index}
                        className="border-2 border-black rounded-lg p-4 bg-yellow-50 hover:bg-yellow-100 transition-colors"
                      >
                        <p className="font-bold text-black text-lg mb-3 comic-font">
                          {coordinator.name}
                        </p>
                        <div className="space-y-2 text-black/80">
                          <div className="flex items-center">
                            <span className="mr-3">📧</span>
                            <a
                              href={`mailto:${coordinator.email}`}
                              className="text-blue-600 hover:underline break-all"
                            >
                              {coordinator.email}
                            </a>
                          </div>
                          <div className="flex items-center">
                            <span className="mr-3">📱</span>
                            <a
                              href={`tel:${coordinator.contact}`}
                              className="text-blue-600 hover:underline"
                            >
                              {coordinator.contact}
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Registration Card */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="lg:col-span-1"
            >
              <div className="bg-white border-4 border-black rounded-lg p-6 sticky top-24 shadow-comic">
                <h3 className="text-2xl font-bold text-black mb-6 comic-font">
                  Registration Info
                </h3>
                <div className="mb-6">
                  <div className="px-4 py-3 rounded-lg border-2 border-black bg-yellow-200 text-center comic-font">
                    <span
                      className={`font-medium ${event.registration_open
                        ? "text-green-600"
                        : "text-red-600"
                        }`}
                    >
                      {event.registration_open
                        ? "Registration Open"
                        : "Registration Closed"}
                    </span>
                  </div>
                </div>
                <div className="space-y-3 mb-6 text-sm">
                  <div className="flex items-center text-black/70">
                    <span className="w-5 h-5 mr-3">📅</span>
                    <div>
                      <p className="text-xs text-black/50">Event Date</p>
                      <p>
                        {new Date(event.event_date).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-black/70">
                    <span className="w-5 h-5 mr-3">👥</span>
                    <div>
                      <p className="text-xs text-black/50">Team Format</p>
                      <p>
                        {event.team_type === "Individual"
                          ? "Solo"
                          : event.team_type}{" "}
                        ({event.team_size} member
                        {event.team_size > 1 ? "s" : ""})
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center text-black/70">
                    <span className="w-5 h-5 mr-3">🏆</span>
                    <div>
                      <p className="text-xs text-black/50">Event Type</p>
                      <p>{event.event_type}</p>
                    </div>
                  </div>
                  {/* {event.max_participants && (
                    <div className="flex items-center text-black/70">
                      <span className="w-5 h-5 mr-3">🎯</span>
                      <div>
                        <p className="text-xs text-black/50">Participants</p>
                        <p>
                          {event.current_participants || 0} /{" "}
                          {event.max_participants} registered
                        </p>
                      </div>
                    </div>
                  )} */}
                  {event.max_teams && (
                    <div className="flex items-center text-black/70">
                      <span className="w-5 h-5 mr-3">👥</span>
                      <div>
                        <p className="text-xs text-black/50">Teams</p>
                        <p>
                          {event.current_teams || 0} / {event.max_teams} teams
                        </p>
                      </div>
                    </div>
                  )}
                  {/* Event Fee */}
                  <div className="flex items-center text-black/70">
                    <span className="w-5 h-5 mr-3">💰</span>
                    <div>
                      <p className="text-xs text-black/50">Registration Fee</p>
                      <p className="font-semibold">
                        {event.event_fee && event.event_fee > 0
                          ? `₹${event.event_fee}`
                          : "Free"}
                      </p>
                    </div>
                  </div>
                </div>

                {canRegister ? (
                  <button
                    onClick={handleRegisterClick}
                    disabled={regLoading}
                    className={`w-full px-6 py-4 border-2 border-black rounded-lg font-bold text-lg transition-all duration-300 comic-font bg-yellow-300 hover:bg-yellow-400 text-black ${regLoading ? "opacity-70 cursor-wait" : "hover:scale-105"
                      }`}
                  >
                    {regLoading
                      ? "Processing..."
                      : event.event_fee && event.event_fee > 0
                        ? `Register Now - ₹${event.event_fee}`
                        : "Register Now - Free"}
                  </button>
                ) : (
                  <div className="w-full">
                    <button
                      disabled
                      className="w-full px-6 py-4 bg-gray-300 text-gray-500 rounded-lg font-medium text-lg cursor-not-allowed"
                    >
                      {isUserRegistered
                        ? "Already Registered"
                        : getRegistrationStatusMessage(event) || "Registration Unavailable"}
                    </button>
                    {(getRegistrationStatusMessage(event) || registrationInfo?.message) && (
                      <p className="text-black/60 text-sm mt-2 text-center">
                        {getRegistrationStatusMessage(event) || registrationInfo?.message}
                      </p>
                    )}
                    {regError && (
                      <p className="text-red-400 text-sm mt-2 text-center">
                        {regError}
                      </p>
                    )}
                  </div>
                )}
                {/* Team Info Display (after successful team registration) */}
                {teamInfo && !registrationInfo?.requiresPayment && (
                  <div className="mt-4 p-4 bg-green-200 border border-green-500/30 rounded-lg">
                    <h4 className="text-green-700 font-bold mb-3 text-center">
                      🎉 Team Created Successfully!
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-black/70">Team Join Token:</p>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 px-2 py-1 bg-black/10 rounded text-green-700 text-xs break-all">
                            {teamInfo.joinToken}
                          </code>
                          <button
                            onClick={() => copyToClipboard(teamInfo.joinToken)}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                          >
                            Copy
                          </button>
                        </div>
                      </div>
                      <p className="text-black/60 text-xs">
                        📧 Team details with QR code have been sent to your
                        email!
                      </p>
                      <p className="text-black/60 text-xs">
                        Share the token with your team members so they can join!
                      </p>
                    </div>
                  </div>
                )}

                {/* Payment Required Info Display */}
                {registrationInfo?.requiresPayment && (
                  <div className="mt-4 p-4 bg-yellow-100 border-2 border-yellow-500 rounded-lg">
                    <h4 className="text-yellow-800 font-bold mb-3 text-center comic-font">
                      💳 Payment Required
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="bg-white p-3 rounded border border-yellow-300">
                        <p className="text-black/70 text-xs">Event</p>
                        <p className="font-bold text-black">{registrationInfo.eventName || event.event_name}</p>
                      </div>
                      <div className="bg-white p-3 rounded border border-yellow-300">
                        <p className="text-black/70 text-xs">Amount to Pay</p>
                        <p className="font-bold text-2xl text-green-600">
                          ₹{registrationInfo.amount}
                        </p>
                      </div>
                      <button
                        onClick={async () => {
                          if (!registrationInfo?.orderId) {
                            setRegError("Order not found. Please try registering again.");
                            return;
                          }
                          setPaymentLoading(true);
                          setRegError(null);
                          try {
                            const paymentData = await PaymentAPI.createPaymentOrder(registrationInfo.orderId);

                            if (paymentData.success && paymentData.data) {
                              const { merchantid, bdorderid, rdata } = paymentData.data;

                              logger.log('BillDesk redirect params:', {
                                merchantid,
                                bdorderid,
                                rdata,
                              });

                              if (merchantid && bdorderid && rdata) {
                                const redirectUrl =
                                  `https://pratishtha-api.sakec.ac.in/api/payments/forward` +
                                  `?merchantid=${encodeURIComponent(merchantid)}` +
                                  `&bdorderid=${encodeURIComponent(bdorderid)}` +
                                  `&rdata=${encodeURIComponent(rdata)}`;

                                window.location.href = redirectUrl;
                              } else {
                                setRegError("Payment gateway did not return valid redirect parameters");
                              }
                            }
                          } catch (err) {
                            setRegError(err?.response?.data?.message || err.message || "Payment initiation failed");
                          } finally {
                            setPaymentLoading(false);
                          }
                        }}
                        disabled={paymentLoading}
                        className={`w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors comic-font ${paymentLoading ? "opacity-70 cursor-wait" : ""
                          }`}
                      >
                        {paymentLoading ? "Processing..." : `Proceed to Pay ₹${registrationInfo.amount}`}
                      </button>
                      <p className="text-black/50 text-xs text-center">
                        Complete payment to confirm your registration
                      </p>
                    </div>
                  </div>
                )}
                <div className="mt-6 pt-6 border-t border-black/20">
                  <p className="text-black/50 text-xs text-center">
                    For questions, contact the event organizers
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Event Image Gallery */}
      {event.event_poster && (
        <div className="container mx-auto px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold text-black mb-8 text-center comic-font">
              Event Poster
            </h2>
            <div className="max-w-2xl mx-auto">
              <Image
                src={event.event_poster}
                alt={event.event_name}
                width={800}
                height={600}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 800px, 800px"
                className="w-full h-auto rounded-lg shadow-comic"
                loading="lazy"
                quality={80}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Related Events or Category Link */}
      <div className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-black mb-6 comic-font">
            Explore More Events
          </h2>
          <Link
            href={`/events/${catagory}`}
            className={`inline-block px-8 py-4 bg-linear-to-r ${categoryInfo.gradient} text-black border-2 border-black rounded-lg font-bold text-lg hover:bg-yellow-200 transition-opacity comic-font`}
          >
            View All {categoryInfo.title} Events
          </Link>
        </motion.div>
      </div>

      {/* Team Registration Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border-4 border-black rounded-lg p-8 max-w-md w-full mx-4"
          >
            <h3 className="text-2xl font-bold text-black mb-4">
              Team Registration
            </h3>
            <p className="text-black/70 mb-6">
              This is a team event with {event.team_size} member
              {event.team_size > 1 ? "s" : ""}. Choose how you want to
              participate.
            </p>
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => {
                  setRegistrationMode("create");
                  setRegError(null);
                }}
                disabled={regLoading}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${registrationMode === "create"
                  ? `bg-yellow-300 text-black`
                  : "bg-gray-200 text-black/70 hover:bg-gray-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Create Team
              </button>
              <button
                onClick={() => {
                  setRegistrationMode("join");
                  setRegError(null);
                }}
                disabled={regLoading}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all ${registrationMode === "join"
                  ? `bg-yellow-300 text-black`
                  : "bg-gray-200 text-black/70 hover:bg-gray-300"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Join Team
              </button>
            </div>
            {registrationMode === "create" && (
              <div className="mb-6">
                <label
                  htmlFor="teamName"
                  className="block text-black/80 mb-2 font-medium"
                >
                  Team Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="teamName"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="Enter your team name"
                  className="w-full px-4 py-3 bg-gray-100 border border-black/20 rounded-lg text-black placeholder-black/40 focus:outline-none focus:border-yellow-400 transition-colors"
                  disabled={regLoading}
                />
                <p className="text-black/50 text-xs mt-2">
                  You will be the team leader. Share the team join link with
                  other members after creation.
                </p>
              </div>
            )}
            {registrationMode === "join" && (
              <div className="mb-6">
                <label
                  htmlFor="joinToken"
                  className="block text-black/80 mb-2 font-medium"
                >
                  Team Join Token <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  id="joinToken"
                  value={joinToken}
                  onChange={(e) => setJoinToken(e.target.value)}
                  placeholder="Enter team join token"
                  className="w-full px-4 py-3 bg-gray-100 border border-black/20 rounded-lg text-black placeholder-black/40 focus:outline-none focus:border-yellow-400 transition-colors"
                  disabled={regLoading}
                />
                <p className="text-black/50 text-xs mt-2">
                  Get the join token from your team leader to join their team.
                </p>
              </div>
            )}
            {regError && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-500 text-sm">{regError}</p>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRegistrationModal(false);
                  setTeamName("");
                  setJoinToken("");
                  setRegistrationMode("create");
                  setRegError(null);
                }}
                disabled={regLoading}
                className="flex-1 px-4 py-3 bg-gray-300 hover:bg-gray-200 text-black rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleRegister}
                disabled={
                  regLoading ||
                  (registrationMode === "create" && !teamName.trim()) ||
                  (registrationMode === "join" && !joinToken.trim())
                }
                className={`flex-1 px-4 py-3 bg-yellow-300 hover:bg-yellow-400 text-black rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {regLoading
                  ? registrationMode === "create"
                    ? "Creating..."
                    : "Joining..."
                  : registrationMode === "create"
                    ? "Create Team"
                    : "Join Team"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

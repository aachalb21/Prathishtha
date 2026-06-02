import User from "../../models/User/Users.js";
import Event from "../../models/Event/Event.js";

/**
 * Get user's registered events with full event details
 * @route GET /api/user/registered-events
 */
export const getRegisteredEvents = async (req, res) => {
  try {
    // User ID should come from auth middleware (req.user.id)
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        code: "NOT_AUTHENTICATED"
      });
    }

    // Find user and populate event details
    const user = await User.findById(userId)
      .select('Events_registered')
      .populate({
        path: 'Events_registered.event_id',
        select: 'event_id event_name event_type event_catagory event_date event_description event_poster event_fee team_type team_size registration_open event_coordinators rulebook_drive_link'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Filter out any events that might have been deleted (null event_id after populate)
    const registeredEvents = user.Events_registered
      .filter(reg => reg.event_id !== null)
      .map(reg => {
        const event = reg.event_id;
        return {
          registrationId: reg._id,
          eventId: event._id,
          eventCustomId: event.event_id,
          eventName: event.event_name,
          eventType: event.event_type,
          eventCategory: event.event_catagory,
          eventDate: event.event_date,
          eventDescription: event.event_description,
          eventPoster: event.event_poster,
          eventFee: event.event_fee,
          teamType: event.team_type,
          teamSize: event.team_size,
          registrationOpen: event.registration_open,
          eventCoordinators: event.event_coordinators,
          rulebookLink: event.rulebook_drive_link,
          // Registration specific details
          registrationDate: reg.registration_date,
          paymentStatus: reg.Payment_status,
          isParticipated: reg.isParticipated,
          isWinner: reg.isWinner,
          teamId: reg.team_id,
          teamRole: reg.team_role
        };
      });

    res.status(200).json({
      success: true,
      message: "Registered events fetched successfully",
      count: registeredEvents.length,
      data: {
        registeredEvents: registeredEvents
      }
    });

  } catch (error) {
    console.error("Get registered events error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch registered events",
      code: "INTERNAL_ERROR",
      error: error.message
    });
  }
};

/**
 * Get specific registered event details
 * @route GET /api/user/registered-events/:eventId
 */
export const getRegisteredEventById = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { eventId } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
        code: "NOT_AUTHENTICATED"
      });
    }

    // Find user and their specific event registration
    const user = await User.findById(userId)
      .select('Events_registered')
      .populate({
        path: 'Events_registered.event_id',
        select: 'event_id event_name event_type event_catagory event_date event_description event_poster event_fee team_type team_size registration_open event_coordinators rulebook_drive_link max_participants current_participants'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Find the specific event registration
    const eventRegistration = user.Events_registered.find(
      reg => reg.event_id && String(reg.event_id._id) === String(eventId)
    );

    if (!eventRegistration || !eventRegistration.event_id) {
      return res.status(404).json({
        success: false,
        message: "Event registration not found",
        code: "EVENT_NOT_FOUND"
      });
    }

    const event = eventRegistration.event_id;

    const eventDetails = {
      registrationId: eventRegistration._id,
      eventId: event._id,
      eventCustomId: event.event_id,
      eventName: event.event_name,
      eventType: event.event_type,
      eventCategory: event.event_catagory,
      eventDate: event.event_date,
      eventDescription: event.event_description,
      eventPoster: event.event_poster,
      eventFee: event.event_fee,
      teamType: event.team_type,
      teamSize: event.team_size,
      registrationOpen: event.registration_open,
      maxParticipants: event.max_participants,
      currentParticipants: event.current_participants,
      eventCoordinators: event.event_coordinators,
      rulebookLink: event.rulebook_drive_link,
      // Registration specific details
      registrationDate: eventRegistration.registration_date,
      paymentStatus: eventRegistration.Payment_status,
      isParticipated: eventRegistration.isParticipated,
      isWinner: eventRegistration.isWinner,
      teamId: eventRegistration.team_id,
      teamRole: eventRegistration.team_role
    };

    res.status(200).json({
      success: true,
      message: "Event details fetched successfully",
      data: eventDetails
    });

  } catch (error) {
    console.error("Get registered event by ID error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch event details",
      code: "INTERNAL_ERROR",
      error: error.message
    });
  }
};

export default {
  getRegisteredEvents,
  getRegisteredEventById
};

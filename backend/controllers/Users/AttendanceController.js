import User from "../../models/User/Users.js";
import Event from "../../models/Event/Event.js";
import AttendanceLog from "../../models/User/AttendanceLog.js";

/**
 * Verify user attendance and get user details with event registration status
 * @route POST /api/user/verify-attendance
 */
export const verifyUserAttendance = async (req, res) => {
  try {
    const { userId, eventId } = req.body;
    console.log("Verifying attendance for User ID:", userId, "Event ID:", eventId);

    // Validate input
    if (!userId || !eventId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Event ID are required",
        code: "MISSING_PARAMETERS"
      });
    }

    // Find user by ID
    const user = await User.findById(userId).select(
      'name student_prn email Gender year Department College_name Events_registered Exp'
    );

    console.log("User found:", user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Find event by ID
    const event = await Event.findOne({ event_id: eventId });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
        code: "EVENT_NOT_FOUND"
      });
    }

    // Check if user is registered for this event (robust: check both registeredEvents and Events_registered, compare as string)
    const regEvents = user.registeredEvents || user.Events_registered || [];
    const isRegistered = regEvents.some(
      (regEvent) => regEvent.event_id && String(regEvent.event_id) === String(event._id)
    );

    // Prepare user data
    const userData = {
      id: user._id,
      name: user.name,
      prn: user.student_prn,
      email: user.email,
      phone: user.contact_no,
      year: user.year,
      branch: user.branch,
      college: user.college_name,
      currentExpPoints: user.expPoints || 0,
      isRegistered: isRegistered,
      registeredEvents: user.registeredEvents || []
    };

    // Prepare event data
    const eventData = {
      eventId: event.event_id,
      eventName: event.event_name,
      eventType: event.event_type,
      eventCategory: event.event_catagory
    };

    res.status(200).json({
      success: true,
      message: isRegistered 
        ? "User is registered for this event" 
        : "User is not registered for this event",
      data: {
        user: userData,
        event: eventData,
        canGivePoints: isRegistered
      }
    });

  } catch (error) {
    console.error("Verify attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * Mark user attendance for event participation
 * @route POST /api/user/mark-attendance
 */
export const markAttendance = async (req, res) => {
  try {
    const { userId, eventId } = req.body;

    // Validate input
    if (!userId || !eventId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Event ID are required",
        code: "MISSING_PARAMETERS"
      });
    }

    // Find user by ID
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }
    
    // Find event by ID
    const event = await Event.findOne({ event_id: eventId });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
        code: "EVENT_NOT_FOUND"
      });
    }

    

    // Check if user is registered for this event (robust: check both registeredEvents and Events_registered, compare as string)
    const regEvents =  user.Events_registered || [];
    const isRegistered = regEvents.some(
      (regEvent) => regEvent.event_id && String(regEvent.event_id) === String(event._id)
    );
    

    if (!isRegistered) {
      return res.status(403).json({
        success: false,
        message: "User is not registered for this event",
        code: "NOT_REGISTERED"
      });
    }

    // Find the registration entry for this event
    const regEntry = regEvents.find(
      (regEvent) => regEvent.event_id && String(regEvent.event_id) === String(event._id)
    );

    // Create attendance log entry with all relevant data
    const attendanceLog = new AttendanceLog({
      user: user._id,
      event: event._id,
      eventSnapshot: {
        event_id: event.event_id,
        event_name: event.event_name,
        event_slug: event.event_slug,
        event_type: event.event_type,
        event_catagory: event.event_catagory,
        event_date: event.event_date,
        event_fee: event.event_fee || 0
      },
      userSnapshot: {
        name: user.name,
        student_prn: user.student_prn,
        email: user.email,
        Department: user.Department,
        Year: user.Year,
        College_name: user.College_name
      },
      registrationDetails: {
        registration_date: regEntry?.registration_date,
        Payment_status: regEntry?.Payment_status,
        team_id: regEntry?.team_id,
        team_role: regEntry?.team_role
      },
      markedAt: new Date()
    });

    // Save the attendance log
    await attendanceLog.save();

    // Remove the event from user's Events_registered array
    user.Events_registered = user.Events_registered.filter(
      (regEvent) => String(regEvent.event_id) !== String(event._id)
    );

    // Increment events attended count
    user.eventsAttendedCount = (user.eventsAttendedCount || 0) + 1;

    // Save updated user
    await user.save();

    res.status(200).json({
      success: true,
      message: `Attendance marked successfully for ${user.name}`,
      data: {
        userId: user._id,
        userName: user.name,
        prn: user.student_prn,
        eventId: eventId,
        eventName: event.event_name,
      }
    });

  } catch (error) {
    console.error("Mark attendance error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark attendance",
      code: "INTERNAL_ERROR"
    });
  }
};

/**
 * Get user's event history
 * @route GET /api/user/:userId/event-history
 */
export const getUserEventHistory = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by ID and populate event details for pending registrations
    const user = await User.findById(userId)
      .select('name student_prn Events_registered')
      .populate({
        path: 'Events_registered.event_id',
        select: 'event_id event_name event_type event_catagory event_date event_fee team_type team_size'
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        code: "USER_NOT_FOUND"
      });
    }

    // Get pending/registered events (not yet attended)
    const registeredEvents = user.Events_registered?.map(regEvent => {
      const event = regEvent.event_id;
      return {
        eventId: event?._id,
        eventName: event?.event_name || 'Unknown Event',
        eventType: event?.event_type || 'N/A',
        eventCategory: event?.event_catagory || 'N/A',
        eventDate: event?.event_date,
        eventFee: event?.event_fee || 0,
        teamType: event?.team_type,
        registeredAt: regEvent.registration_date,
        paymentStatus: regEvent.Payment_status,
        status: 'registered'
      };
    }) || [];

    // Get attendance history from AttendanceLog
    const attendanceLogs = await AttendanceLog.find({ user: userId })
      .sort({ markedAt: -1 });

    const attendedEvents = attendanceLogs.map(log => ({
      eventId: log.event,
      eventName: log.eventSnapshot?.event_name || 'Unknown Event',
      eventType: log.eventSnapshot?.event_type || 'N/A',
      eventCategory: log.eventSnapshot?.event_catagory || 'N/A',
      eventDate: log.eventSnapshot?.event_date,
      eventFee: log.eventSnapshot?.event_fee || 0,
      registeredAt: log.registrationDetails?.registration_date,
      paymentStatus: log.registrationDetails?.Payment_status,
      attendedAt: log.markedAt,
      isWinner: log.isWinner,
      winnerPosition: log.winnerPosition,
      status: 'attended'
    }));

    res.status(200).json({
      success: true,
      message: "User event history retrieved successfully",
      data: {
        userId: user._id,
        userName: user.name,
        prn: user.student_prn,
        eventsAttended: attendedEvents.length,
        registeredEventsCount: registeredEvents.length,
        registeredEvents: registeredEvents,
        attendedEvents: attendedEvents
      }
    });

  } catch (error) {
    console.error("Get user event history error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      code: "INTERNAL_ERROR"
    });
  }
};

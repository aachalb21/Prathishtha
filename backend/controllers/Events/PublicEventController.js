import Event from "../../models/Event/Event.js";
import User from "../../models/User/Users.js";
import Team from "../../models/Event/Team.js";
import Order from "../../models/Payment/order.js";
import { generateTeamQRBuffer } from "../../utils/qrGenerator.js";
import { sendTeamJoinEmail } from "../../utils/Email/SendTeamJoinEmail.js";

// Get All Public Events
export const getAllPublicEvents = async (req, res) => {
    try {
        const {
            category,
            search,
            eventType,
            status,
            registration_status,
            page = 1,
            limit = 500,
            sortBy = 'event_date',
            order = 'asc'
        } = req.query;

        // Build query filter - only show events that should be public
        let filter = {};
        
        // Apply filters
        if (category) {
            filter.event_catagory = category;
        }
        
        if (eventType) {
            filter.event_type = eventType;
        }
        
        if (status) {
            filter.event_status = status;
        }
        
        if (registration_status === 'open') {
            filter.registration_open = true;
        } else if (registration_status === 'closed') {
            filter.registration_open = false;
        }
        
        if (search) {
            filter.$or = [
                { event_name: { $regex: search, $options: 'i' } },
                { event_description: { $regex: search, $options: 'i' } },
                { event_type: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get total count for pagination
        const totalEvents = await Event.countDocuments(filter);
        
        // Get events with pagination and sorting
        const events = await Event.find(filter, {
            // Only include fields that should be public
            event_id: 1,
            event_name: 1,
            event_date: 1,
            event_description: 1,
            rulebook_drive_link: 1,
            event_poster: 1,
            event_coordinators: 1,
            event_catagory: 1,
            event_slug: 1,
            team_type: 1,
            team_size: 1,
            event_type: 1,
            registration_open: 1,
            event_fee: 1,
            max_participants: 1,
            current_participants: 1,
            createdAt: 1
        })
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit));

        const eventsWithData = events.map(event => {
            return event.toObject();
        });

        res.status(200).json({
            message: "Public events fetched successfully",
            events: eventsWithData,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalEvents / parseInt(limit)),
                totalEvents,
                hasNext: skip + events.length < totalEvents,
                hasPrev: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error("Error fetching public events:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get Events by Category (Public)
export const getPublicEventsByCategory = async (req, res) => {
    try {
        const { category } = req.params;
        const {
            search,
            eventType,
            status,
            registration_status,
            page = 1,
            limit = 40,
            sortBy = 'event_date',
            order = 'asc'
        } = req.query;

        const validCategories = ["Aurum", "Olympus", "Yuva", "Verve"];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ message: "Invalid event category" });
        }

        // Build query filter
        let filter = { event_catagory: category };
        
        if (eventType) {
            filter.event_type = eventType;
        }
        
        if (status) {
            filter.event_status = status;
        }
        
        if (registration_status === 'open') {
            filter.registration_open = true;
        } else if (registration_status === 'closed') {
            filter.registration_open = false;
        }
        
        if (search) {
            filter.$or = [
                { event_name: { $regex: search, $options: 'i' } },
                { event_description: { $regex: search, $options: 'i' } }
            ];
        }

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get total count for pagination
        const totalEvents = await Event.countDocuments(filter);
        
        // Get events
        const events = await Event.find(filter, {
            event_id: 1,
            event_name: 1,
            event_date: 1,
            event_description: 1,
            rulebook_drive_link: 1,
            event_poster: 1,
            event_fee: 1,
            event_coordinators: 1,
            event_catagory: 1,
            event_slug: 1,
            team_type: 1,
            team_size: 1,
            event_type: 1,
            registration_open: 1,
            registration_start_date: 1,
            registration_end_date: 1,
            event_status: 1,
            max_participants: 1,
            current_participants: 1,
            createdAt: 1
        })
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit));

        res.status(200).json({
            message: `Public ${category} events fetched successfully`,
            category,
            events,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalEvents / parseInt(limit)),
                totalEvents,
                hasNext: skip + events.length < totalEvents,
                hasPrev: parseInt(page) > 1
            }
        });

    } catch (error) {
        console.error("Error fetching public events by category:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get Single Event by Slug (Public)
export const getPublicEventBySlug = async (req, res) => {
    try {
        const { slug } = req.params;
        
        const event = await Event.findOne({ event_slug: slug }, {
            event_id: 1,
            event_name: 1,
            event_date: 1,
            event_description: 1,
            rulebook_drive_link: 1,
            event_poster: 1,
            event_fee: 1,
            event_coordinators: 1,
            event_catagory: 1,
            event_slug: 1,
            team_type: 1,
            team_size: 1,
            event_type: 1,
            registration_open: 1,
            registration_start_date: 1,
            registration_end_date: 1,
            max_participants: 1,
            current_participants: 1,
            createdAt: 1
        });
        
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Auto-close registration if past end date
        let eventData = event.toObject();
        const now = new Date();
        if (eventData.registration_end_date && now > new Date(eventData.registration_end_date) && eventData.registration_open) {
            eventData.registration_open = false;
            // Update in database asynchronously
            Event.findByIdAndUpdate(event._id, { registration_open: false, updatedAt: now })
                .catch(err => console.error('Error auto-closing registration:', err));
        }

        res.status(200).json({
            message: "Event fetched successfully",
            event: eventData
        });

    } catch (error) {
        console.error("Error fetching public event by slug:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Handle Event Registration 

export const eventRegistration = async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.user?.id; // checkAuth middleware attaches req.user if authenticated
        console.log("Event Registration Request:", { slug });
        const event = await Event.findOne({ event_slug: slug }, {
            event_name: 1,
            registration_open: 1,
            registration_start_date: 1,
            registration_end_date: 1,
            max_participants: 1,
            current_participants: 1
        });
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        // Compute registration availability
        const now = new Date();
        const regStart = event.registration_start_date ? new Date(event.registration_start_date) : null;
        const regEnd = event.registration_end_date ? new Date(event.registration_end_date) : null;
        const registrationAvailable = !!(event.registration_open && (!regStart || now >= regStart) && (!regEnd || now <= regEnd) && !(event.max_participants && event.current_participants >= event.max_participants));

        // If we have a userId, check whether the user is already registered.
        // Be flexible in the check: previously saved registrations may store
        // `event_id` (ObjectId or numeric), `event_slug`, or other identifiers.
        let isRegistered = false;
        if (userId) {
            try {
                const user = await User.findById(userId);
                if (user) {
                    isRegistered = !!user.Events_registered?.some(r => {
                        try {
                            const byObjectId = r.event_id && String(r.event_id) === String(event._id);
                            const byEventId = r.event_id && event.event_id && String(r.event_id) === String(event.event_id);
                            const bySlug = r.event_slug && event.event_slug && String(r.event_slug) === String(event.event_slug);
                            return byObjectId || byEventId || bySlug;
                        } catch (e) {
                            return false;
                        }
                    });
                }
            } catch (err) {
                // ignore user lookup errors for public endpoint
                console.error('Error checking user registration status:', err);
            }
        }

        console.log("Event registration info fetched successfully");
        res.status(200).json({
            message: "Event registration info fetched successfully",
            event: event,
            registrationAvailable,
            isRegistered,
            spotsRemaining: event.max_participants ? Math.max(0, event.max_participants - (event.current_participants || 0)) : null
        });
       
    } catch (error) {
        console.error("Error fetching event registration info:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Handle actual registration (requires authenticated user)
export const registerForEvent = async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.user.id;
        const { teamName } = req.body; // For team events

        // Find the event
        const event = await Event.findOne({ event_slug: slug });
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Check if registration is open
        if (!event.registration_open) {
            return res.status(400).json({ message: "Registration is closed for this event" });
        }

        // Check registration dates
        const now = new Date();
        if (event.registration_start_date && now < new Date(event.registration_start_date)) {
            return res.status(400).json({ message: "Registration has not started yet" });
        }
        if (event.registration_end_date && now > new Date(event.registration_end_date)) {
            return res.status(400).json({ message: "Registration deadline has passed" });
        }

        // Check capacity
        if (event.team_type === 'Individual') {
            if (event.max_participants && event.current_participants >= event.max_participants) {
                return res.status(400).json({ message: "Event is full" });
            }
        } else if (event.team_type === 'Team') {
            if (event.max_teams && event.current_teams >= event.max_teams) {
                return res.status(400).json({ message: "Maximum teams reached" });
            }
        }

        // Get user
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Check if already registered (skip for Casual events - allow multiple registrations)
        const isCasualEvent = event.event_type === 'Casual';
        const alreadyRegistered = user.Events_registered?.some(r => {
            const byObjectId = r.event_id && String(r.event_id) === String(event._id);
            const bySlug = r.event_slug && String(r.event_slug) === String(event.event_slug);
            return byObjectId || bySlug;
        });

        if (alreadyRegistered && !isCasualEvent) {
            return res.status(409).json({ message: "You are already registered for this event" });
        }

        // Check if event is paid
        const isPaidEvent = event.event_fee && event.event_fee > 0;

        // For PAID events - create order and return for payment
        if (isPaidEvent) {
            // Check if there's already a pending/created order
            const existingOrder = await Order.findOne({
                userId,
                eventId: event._id,
                status: { $in: ['CREATED', 'PENDING'] }
            });

            if (existingOrder) {
                return res.status(200).json({
                    success: true,
                    requiresPayment: true,
                    message: "Proceed to payment",
                    orderId: existingOrder.orderId,
                    amount: existingOrder.amount,
                    currency: existingOrder.currency,
                    eventName: event.event_name
                });
            }

            // Create new order
            const orderId = `ORD_${Date.now()}_${userId.toString().slice(-6)}`;
            
            // For team events, validate team name but DON'T create team yet
            // Team will be created only after successful payment
            let isTeamEvent = event.team_type === 'Team';
            let storedTeamName = null;

            if (isTeamEvent) {
                if (!teamName || !teamName.trim()) {
                    return res.status(400).json({ message: "Team name is required for team events" });
                }
                storedTeamName = teamName.trim();
            }

            const order = new Order({
                orderId,
                eventId: event._id,
                userId,
                teamId: null, // Team will be created after payment
                teamName: storedTeamName, // Store team name for later creation
                isTeamEvent: isTeamEvent,
                amount: event.event_fee,
                currency: 356, // INR
                status: "CREATED"
            });
            await order.save();

            return res.status(200).json({
                success: true,
                requiresPayment: true,
                message: "Proceed to payment",
                orderId: order.orderId,
                amount: order.amount,
                currency: order.currency,
                eventName: event.event_name,
                isTeamEvent: isTeamEvent
            });
        }

        // For FREE events - register directly
        let teamId = null;
        let teamInfo = null;

        if (event.team_type === 'Team') {
            if (!teamName || !teamName.trim()) {
                return res.status(400).json({ message: "Team name is required for team events" });
            }

            // Generate join token
            const joinToken = `${slug}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

            const team = new Team({
                name: teamName.trim(),
                event: event._id,
                leader: userId,
                members: [userId],
                max_size: event.team_size,
                join_token: joinToken
            });
            await team.save();

            teamId = team._id;
            teamInfo = {
                id: team._id,
                name: team.name,
                join_token: joinToken,
                join_link: `${process.env.FRONTEND_URL || ''}/events/join-team/${joinToken}`
            };

            // Increment team count
            event.current_teams = (event.current_teams || 0) + 1;
        }

        // Add registration to user
        user.Events_registered = user.Events_registered || [];
        user.Events_registered.push({
            event_id: event._id,
            event_slug: event.event_slug,
            registration_date: new Date(),
            Payment_status: 'Completed', // Free event
            team_id: teamId,
            team_role: teamId ? 'leader' : null
        });
        await user.save();

        // Increment participant count
        event.current_participants = (event.current_participants || 0) + 1;

        // Close registration if capacity reached
        if (event.team_type === 'Individual' && event.max_participants && event.current_participants >= event.max_participants) {
            event.registration_open = false;
        }
        if (event.team_type === 'Team' && event.max_teams && event.current_teams >= event.max_teams) {
            event.registration_open = false;
        }

        await event.save();

        // Send team QR code email for team events
        if (teamId && teamInfo) {
            try {
                // Generate team QR code
                // const qrBuffer = await generateTeamQRBuffer(
                //     teamId.toString(),
                //     event._id.toString(),
                //     teamInfo.name,
                //     event.event_name,
                //     teamInfo.join_token
                // );

                // Send email with QR code to team leader
                await sendTeamJoinEmail(user.email, {
                    teamName: teamInfo.name,
                    joinToken: teamInfo.join_token,
                    eventName: event.event_name,
                    teamSize: event.team_size || 'Not specified',
                    leaderName: user.name
                });

                console.log(`Team QR code email sent to ${user.email} for team ${teamInfo.name}`);
            } catch (emailError) {
                console.error('Error sending team QR email:', emailError);
                // Don't fail the registration if email fails
            }
        }

        return res.status(200).json({
            success: true,
            registered: true,
            requiresPayment: false,
            message: event.team_type === 'Team' 
                ? "Team created successfully! Share the join link with your teammates. Check your email for the team QR code." 
                : "Registration successful!",
            team: teamInfo
        });

    } catch (error) {
        console.error("Error in event registration:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};


// Get team details and join link (requires authentication - only team leader or members)
export const getTeamDetails = async (req, res) => {
    try {
        const { teamId } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Authentication required' });

        const team = await Team.findById(teamId)
            .populate('event', 'event_name event_slug team_size')
            .populate('leader', 'name email')
            .populate('members', 'name email');
            
        if (!team) return res.status(404).json({ message: 'Team not found' });

        // Check if user is team leader or member
        const isLeader = String(team.leader._id) === String(userId);
        const isMember = team.members.some(m => String(m._id) === String(userId));
        
        if (!isLeader && !isMember) {
            return res.status(403).json({ message: 'You are not authorized to view this team' });
        }

        // Calculate available spots
        const maxSize = team.max_size || team.event?.team_size || 0;
        const spotsRemaining = maxSize ? Math.max(0, maxSize - team.members.length) : 0;

        return res.status(200).json({
            message: 'Team details fetched successfully',
            team: {
                id: team._id,
                name: team.name,
                join_token: team.join_token,
                join_link: `${process.env.FRONTEND_URL || ''}/events/join-team/${team.join_token}`,
                event: {
                    id: team.event._id,
                    name: team.event.event_name,
                    slug: team.event.event_slug
                },
                leader: {
                    id: team.leader._id,
                    name: team.leader.name,
                    email: team.leader.email
                },
                members: team.members.map(m => ({
                    id: m._id,
                    name: m.name,
                    email: m.email
                })),
                maxSize,
                currentSize: team.members.length,
                spotsRemaining,
                isFull: maxSize > 0 && team.members.length >= maxSize,
                createdAt: team.createdAt
            }
        });

    } catch (error) {
        console.error('Error fetching team details:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

// Join a team using join token (requires authentication)
export const joinTeam = async (req, res) => {
    try {
        const { token } = req.params;
        const userId = req.user?.id;

        if (!userId) return res.status(401).json({ message: 'Authentication required' });

        const team = await Team.findOne({ join_token: token });
        if (!team) return res.status(404).json({ message: 'Team not found or invalid token' });

        // Load event
        const event = await Event.findById(team.event);
        if (!event) return res.status(404).json({ message: 'Associated event not found' });

        // Check team size
        const maxSize = team.max_size || event.team_size || 0;
        if (maxSize && team.members.length >= maxSize) {
            return res.status(400).json({ message: 'Team is already full' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // Check if user already registered for this event
        const existing = user.Events_registered?.find(r => String(r.event_id) === String(event._id));
        if (existing) {
            // If the existing entry points to this team, tell them they're already a member
            if (existing.team_id && String(existing.team_id) === String(team._id)) {
                return res.status(200).json({ message: 'User already a member of this team' });
            }
            // Otherwise, user is already registered to this event (other team or individual)
            return res.status(409).json({ message: 'User already registered for this event and cannot join another team' });
        }

        // Add user to team
        team.members.push(user._id);
        await team.save();

        // Add registration entry to user
        // Payment is already covered by team leader, so mark as Completed
        user.Events_registered = user.Events_registered || [];
        user.Events_registered.push({
            event_id: event._id,
            event_slug: event.event_slug || null,
            event_name: event.event_name || null,
            registration_date: new Date(),
            Payment_status: 'Completed', // Team leader already paid for the team
            team_id: team._id,
            team_role: 'member'
        });
        await user.save();

        // Increment event participants
        event.current_participants = (event.current_participants || 0) + 1;
        
        // Close registration if max_participants reached
        if (event.max_participants && event.current_participants >= event.max_participants) {
            event.registration_open = false;
        }
        
        await event.save();

        return res.status(200).json({ message: 'Joined team successfully', team: { id: team._id } });

    } catch (error) {
        console.error('Error joining team:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
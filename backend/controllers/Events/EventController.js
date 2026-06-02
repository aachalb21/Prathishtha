import multer from "multer";
import Event from "../../models/Event/Event.js";
import Admin from "../../models/Admin/Admin.js";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import CloudStorageService from "../../utils/cloudStorage.js";
import { generateEventSlug } from "../../utils/Event/slug_generator.js";
import { v2 as cloudinary } from 'cloudinary';
import { makeEventId } from "../../utils/Event/Id_maker.js";

//upload event poster


export const eventPosterStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: (req, file) => {
        // Set folder and public_id for the uploaded image
        return {
            folder: 'pratishtha/events/posters', // Folder in Cloudinary
            public_id: `poster_${Date.now()}`, // Unique identifier for the image
            format: 'jpg', // Convert to jpg format
        };
    },
});


export const uploadEventPoster = multer({
    storage: eventPosterStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
    fileFilter: (req, file, cb) => {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    },
});


// Create Event 
export const createEvent = async (req, res) => {
    try {
        if( !CloudStorageService.validateConfiguration()){
            return res.status(500).json({
        message: "Cloud storage service not configured properly",
        code: "STORAGE_CONFIG_ERROR"
      });
    }

    const {
        event_name,
        event_date,
        event_description,
        rulebook_drive_link,
        event_coordinators,
        event_catagory,
        team_type,
        team_size,
        event_type,
        max_participants,
        max_teams,
        event_fee,
    } = req.body;
    const event_poster = req.file ? req.file.path : null;
    const adminId = req.admin.id; // From auth middleware

    if(!event_name || !event_date || !rulebook_drive_link || !event_catagory || !team_type || !event_type){
        return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Validate and normalize event_fee
    let normalizedFee = 0;
    if (event_fee !== undefined && event_fee !== null && event_fee !== '') {
        const feeAmount = Number(event_fee);
        if (isNaN(feeAmount) || feeAmount < 0) {
            return res.status(400).json({ message: "Event fee must be a valid non-negative number" });
        }
        normalizedFee = feeAmount;
    }

    // Validate max_participants and max_teams based on event type and team type
    if (event_type !== 'Casual') {
        if (team_type === 'Individual' && !max_participants) {
            return res.status(400).json({ message: "Max participants is required for individual events" });
        }
        if (team_type === 'Team' && !max_teams) {
            return res.status(400).json({ message: "Max teams is required for team events" });
        }
    }
    
    // Validate Google Drive URL format
    const driveUrlPattern = /(https?:\/\/)?(www\.)?(drive\.google\.com|docs\.google\.com)/i;
    if (!driveUrlPattern.test(rulebook_drive_link)) {
        return res.status(400).json({ message: "Please provide a valid Google Drive link for the rulebook" });
    }
    
    const existingEvent = await Event.findOne({ event_name });
    if(existingEvent){
        return res.status(400).json({ message: "Event with this name already exists" });
    }

        const validCategories = ["Aurum", "Olympus", "Yuva", "Verve"];
        if (!validCategories.includes(event_catagory)) {
            return res.status(400).json({ message: "Invalid event category" });
        }

        // Role-based category validation
        if (req.admin.role !== 'SuperAdmin' && req.admin.role !== 'Admin') {
            // Category-specific admins can only create events in their category
            if (req.admin.role === 'Aurum' && event_catagory !== 'Aurum') {
                return res.status(403).json({ message: "You can only create Aurum events" });
            }
            if (req.admin.role === 'Olympus' && event_catagory !== 'Olympus') {
                return res.status(403).json({ message: "You can only create Olympus events" });
            }
            if (req.admin.role === 'Yuva' && event_catagory !== 'Yuva') {
                return res.status(403).json({ message: "You can only create Yuva events" });
            }
            if (req.admin.role === 'Verve' && event_catagory !== 'Verve') {
                return res.status(403).json({ message: "You can only create Verve events" });
            }
        }    //is event type team then add team size
    let finalTeamSize = team_size;
    if(team_type === "Team"){
        finalTeamSize = req.body.team_size || 2;
        if(finalTeamSize < 2) {
            return res.status(400).json({ message: "Team size must be at least 2 for team events" });
        }
    }
    else{
        finalTeamSize = 1;
    } 
    if(!req.file){
        return res.status(400).json({ message: "Event poster is required" });
    }

    const file = req.file;
    const currentYear = new Date().getFullYear();
    console.log('File uploaded to events folder:', {
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      year: currentYear,
      category: event_catagory,
      folder: `pratishtha/events/posters`,
      public_id: file.filename // CloudinaryStorage sets filename as public_id
    });

    // Store the original Cloudinary URL from multer-storage-cloudinary
    const posterUrl = file.path; // This is the secure_url from Cloudinary
    const slug = generateEventSlug(event_catagory, event_name);
    
    // Parse coordinators if it's a string
    let parsedCoordinators;
    try {
        parsedCoordinators = typeof event_coordinators === 'string' 
            ? JSON.parse(event_coordinators) 
            : event_coordinators;
    } catch (error) {
        return res.status(400).json({ message: "Invalid coordinator data format" });
    }

    // Validate coordinator emails exist in Admin model with EventCoordinator role or category-based admin roles
    if (parsedCoordinators && Array.isArray(parsedCoordinators)) {
        console.log('Validating coordinators:', parsedCoordinators);
        const coordinatorEmails = parsedCoordinators.map(coord => coord.email?.toLowerCase()).filter(email => email);
        
        if (coordinatorEmails.length > 0) {
            try {
                // Allow both EventCoordinator role and category-based admin roles (Aurum, Yuva, Olympus, Verve)
                const existingCoordinators = await Admin.find({
                    email: { $in: coordinatorEmails },
                    role: { $in: ['EventCoordinator', 'Aurum', 'Yuva', 'Olympus', 'Verve', 'SuperAdmin', 'Admin'] }
                });
                console.log('Existing coordinator ', existingCoordinators.map(coord => ({ email: coord.email, role: coord.role, _id: coord._id })));

                const existingCoordinatorEmails = existingCoordinators.map(coord => coord.email);
                const missingCoordinatorEmails = coordinatorEmails.filter(email => 
                    !existingCoordinatorEmails.includes(email)
                );

                if (missingCoordinatorEmails.length > 0) {
                    return res.status(400).json({
                        message: "Event coordinator(s) not found in system",
                        details: `Please create EventCoordinator accounts or use existing admin accounts for: ${missingCoordinatorEmails.join(', ')}`,
                        missingEmails: missingCoordinatorEmails,
                        code: "COORDINATOR_NOT_FOUND",
                        suggestion: "Go to Admin Management → Create Event Coordinator to add these coordinators, or use existing admin emails"
                    });
                }

                // Add the Admin ObjectId to each coordinator
                parsedCoordinators = parsedCoordinators.map(coord => {
                    const matchingAdmin = existingCoordinators.find(
                        admin => admin.email.toLowerCase() === coord.email?.toLowerCase()
                    );
                    return {
                        ...coord,
                        id: matchingAdmin ? matchingAdmin._id : null
                    };
                });
            } catch (error) {
                console.error('Error validating coordinators:', error);
                return res.status(500).json({ 
                    message: "Failed to validate event coordinators",
                    code: "COORDINATOR_VALIDATION_ERROR"
                });
            }
        }
    }
    
    const newEvent = new Event({
        event_name,
        event_date,
        event_description,
        rulebook_drive_link,
        event_poster: posterUrl, // Use the original Cloudinary URL
        event_coordinators: parsedCoordinators,
        event_catagory,
        team_type,
        team_size: finalTeamSize,
        event_type,
        event_fee: normalizedFee,
        max_participants: event_type === 'Casual' || team_type === 'Team' ? null : max_participants,
        max_teams: team_type === 'Team' ? max_teams : null,
        createdBy: adminId,
        event_slug: slug,
    });
    
    // Save the event first to get the MongoDB _id
    await newEvent.save();
    
    // Generate custom event_id using the _id
    const customEventId = makeEventId(event_name, newEvent._id);
    
    // Update the event with the custom event_id
    newEvent.event_id = customEventId;
    await newEvent.save();
    
    res.status(201).json({ message: "Event created successfully", event: newEvent });
    
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export const getAllEvents = async (req, res) => {
    try {
        console.log('getAllEvents called with query:', req.query); // Debug log
        console.log('Admin role:', req.admin?.role); // Debug log
        
        const {
            category,
            search,
            eventType,
            teamType,
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            order = 'desc'
        } = req.query;

        // Build query filter
        let filter = {};
        
        // Role-based filtering: SuperAdmin and Admin see all, others see only their category
        if (req.admin.role !== 'SuperAdmin' && req.admin.role !== 'Admin') {
            // Category-specific admins can only see their events
            if (req.admin.role === 'Aurum') filter.event_catagory = 'Aurum';
            else if (req.admin.role === 'Olympus') filter.event_catagory = 'Olympus';
            else if (req.admin.role === 'Yuva') filter.event_catagory = 'Yuva';
            else if (req.admin.role === 'Verve') filter.event_catagory = 'Verve';
        }
        
        // Apply additional filters from query params (this overrides role-based filter for SuperAdmin/Admin)
        if (category) {
            filter.event_catagory = category;
        }
        
        if (eventType) {
            filter.event_type = eventType;
        }
        
        if (teamType) {
            filter.team_type = teamType;
        }
        
        if (search) {
            filter.$or = [
                { event_name: { $regex: search, $options: 'i' } },
                { event_description: { $regex: search, $options: 'i' } },
                { event_type: { $regex: search, $options: 'i' } }
            ];
        }

        console.log('Filter applied:', filter); // Debug log

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get total count for pagination
        const totalEvents = await Event.countDocuments(filter);
        console.log('Total events found:', totalEvents); // Debug log
        
        // Get events with pagination and sorting
        const events = await Event.find(filter)
            .populate('createdBy', 'name email role')
            .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
            .skip(skip)
            .limit(parseInt(limit));

        console.log('Events returned:', events.length); // Debug log

        res.status(200).json({
            message: "Events fetched successfully",
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
        console.error("Error fetching events:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Get Single Event
export const getEventById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const event = await Event.findById(id).populate('createdBy', 'name email role');
        
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.status(200).json({
            message: "Event fetched successfully",
            event
        });

    } catch (error) {
        console.error("Error fetching event:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Update Event
export const updateEvent = async (req, res) => {
    try {
        console.log('UpdateEvent request received:', {
            params: req.params,
            body: req.body,
            file: req.file ? 'File present' : 'No file',
            admin: req.admin ? { id: req.admin.id, role: req.admin.role } : 'No admin'
        });

        const { id } = req.params;

        const event = await Event.findById(id);
        if (!event) {
            console.log('Event not found:', id);
            return res.status(404).json({ message: "Event not found" });
        }

        console.log('Event found:', { id: event._id, name: event.event_name, category: event.event_catagory });

        // Check if admin can edit this event
        if (req.admin.role !== 'SuperAdmin' && req.admin.role !== 'Admin') {
            // Category-specific admins can only edit events in their category
            if (req.admin.role === 'Aurum' && event.event_catagory !== 'Aurum') {
                return res.status(403).json({ message: "You can only edit Aurum events" });
            }
            if (req.admin.role === 'Olympus' && event.event_catagory !== 'Olympus') {
                return res.status(403).json({ message: "You can only edit Olympus events" });
            }
            if (req.admin.role === 'Yuva' && event.event_catagory !== 'Yuva') {
                return res.status(403).json({ message: "You can only edit Yuva events" });
            }
            if (req.admin.role === 'Verve' && event.event_catagory !== 'Verve') {
                return res.status(403).json({ message: "You can only edit Verve events" });
            }
            // Category admins can edit any event in their category
        }

        const updateData = { ...req.body };

        // Validate and convert event_fee if provided
        console.log('Raw event_fee from request:', {
            value: updateData.event_fee,
            type: typeof updateData.event_fee,
            isDefined: updateData.event_fee !== undefined,
            isNull: updateData.event_fee === null,
            isEmpty: updateData.event_fee === ''
        });

        if (updateData.event_fee !== undefined && updateData.event_fee !== null && updateData.event_fee !== '') {
            const feeAmount = Number(updateData.event_fee);
            if (isNaN(feeAmount) || feeAmount < 0) {
                return res.status(400).json({ message: "Event fee must be a valid non-negative number" });
            }
            console.log('Converted event_fee:', feeAmount);
            updateData.event_fee = feeAmount;
        } else {
            // Ensure event_fee is set to 0 if empty
            updateData.event_fee = 0;
        }
        
        // Handle file upload if new poster is provided
        if (req.file) {
            // If there's an old poster, delete it from Cloudinary first
            if (event.event_poster) {
                try {
                    const oldPublicId = CloudStorageService.extractPublicIdFromUrl(event.event_poster);
                    if (oldPublicId) {
                        await CloudStorageService.deleteImage(oldPublicId);
                        console.log('Old poster deleted from Cloudinary:', oldPublicId);
                    }
                } catch (cloudinaryError) {
                    console.error('Error deleting old poster from Cloudinary:', cloudinaryError);
                    // Continue with update even if old poster deletion fails
                }
            }
            
            const file = req.file;
            // Store the original Cloudinary URL from multer-storage-cloudinary
            const posterUrl = file.path; // This is the secure_url from Cloudinary
            updateData.event_poster = posterUrl;
        }

        // Parse coordinators if it's a string
        if (updateData.event_coordinators) {
            console.log('Processing coordinators:', updateData.event_coordinators);
            try {
                updateData.event_coordinators = typeof updateData.event_coordinators === 'string' 
                    ? JSON.parse(updateData.event_coordinators) 
                    : updateData.event_coordinators;
            } catch (error) {
                console.log('Coordinator parse error:', error);
                return res.status(400).json({ message: "Invalid coordinator data format" });
            }

            // Validate coordinator emails exist in Admin model with EventCoordinator role or category-based admin roles
            if (Array.isArray(updateData.event_coordinators)) {
                const coordinatorEmails = updateData.event_coordinators.map(coord => coord.email?.toLowerCase()).filter(email => email);
                console.log('Coordinator emails to validate:', coordinatorEmails);
                
                if (coordinatorEmails.length > 0) {
                    try {
                        // Allow both EventCoordinator role and category-based admin roles (Aurum, Yuva, Olympus, Verve)
                        const existingCoordinators = await Admin.find({
                            email: { $in: coordinatorEmails },
                            role: { $in: ['EventCoordinator', 'Aurum', 'Yuva', 'Olympus', 'Verve', 'SuperAdmin', 'Admin'] }
                        });

                        const existingCoordinatorEmails = existingCoordinators.map(coord => coord.email);
                        const missingCoordinatorEmails = coordinatorEmails.filter(email => 
                            !existingCoordinatorEmails.includes(email)
                        );

                        console.log('Existing coordinator emails:', existingCoordinatorEmails);
                        console.log('Missing coordinator emails:', missingCoordinatorEmails);

                        if (missingCoordinatorEmails.length > 0) {
                            console.log('Coordinator validation failed, returning error');
                            return res.status(400).json({
                                message: "Event coordinator(s) not found in system",
                                details: `Please create EventCoordinator accounts or use existing admin accounts for: ${missingCoordinatorEmails.join(', ')}`,
                                missingEmails: missingCoordinatorEmails,
                                code: "COORDINATOR_NOT_FOUND",
                                suggestion: "Go to Admin Management → Create Event Coordinator to add these coordinators, or use existing admin emails"
                            });
                        }

                        // Add the Admin ObjectId to each coordinator
                        updateData.event_coordinators = updateData.event_coordinators.map(coord => {
                            const matchingAdmin = existingCoordinators.find(
                                admin => admin.email.toLowerCase() === coord.email?.toLowerCase()
                            );
                            return {
                                ...coord,
                                id: matchingAdmin ? matchingAdmin._id : null
                            };
                        });
                    } catch (error) {
                        console.error('Error validating coordinators:', error);
                        return res.status(500).json({ 
                            message: "Failed to validate event coordinators",
                            code: "COORDINATOR_VALIDATION_ERROR"
                        });
                    }
                }
            }
        }

        // Update team size logic
        if (updateData.team_type === "Individual") {
            updateData.team_size = 1;
            // Reset max_teams for individual events
            updateData.max_teams = null;
        } else if (updateData.team_type === "Team" && updateData.team_size < 2) {
            updateData.team_size = 2;
            // Reset max_participants for team events
            updateData.max_participants = null;
        }

        // Handle max_participants and max_teams based on event_type
        if (updateData.event_type === 'Casual') {
            updateData.max_participants = null;
            updateData.max_teams = null;
        } else {
            // Ensure max_participants is only set for individual events
            if (updateData.team_type === 'Team') {
                updateData.max_participants = null;
            }
            // Ensure max_teams is only set for team events
            if (updateData.team_type === 'Individual') {
                updateData.max_teams = null;
            }
        }

        // Add updatedAt to updateData to ensure the pre-save hook still works
        updateData.updatedAt = new Date();

        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email role');

        console.log('Event updated successfully:', { id: updatedEvent._id, name: updatedEvent.event_name });

        res.status(200).json({
            message: "Event updated successfully",
            event: updatedEvent
        });

    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Delete Event
export const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin.id;

        console.log('Delete Event Request:', {
            eventId: id,
            adminId: adminId,
            adminRole: req.admin.role,
            requestedBy: req.admin.name || req.admin.email
        });

        const event = await Event.findById(id);
        if (!event) {
            console.log('Event not found for deletion:', id);
            return res.status(404).json({ message: "Event not found" });
        }

        console.log('Event to delete:', {
            eventName: event.event_name,
            eventCategory: event.event_catagory,
            createdBy: event.createdBy
        });

        // Check if admin can delete this event
        if (req.admin.role !== 'SuperAdmin' && req.admin.role !== 'Admin') {
            // Category-specific admins can only delete events in their category
            if (req.admin.role === 'Aurum' && event.event_catagory !== 'Aurum') {
                return res.status(403).json({ message: "You can only delete Aurum events" });
            }
            if (req.admin.role === 'Olympus' && event.event_catagory !== 'Olympus') {
                return res.status(403).json({ message: "You can only delete Olympus events" });
            }
            if (req.admin.role === 'Yuva' && event.event_catagory !== 'Yuva') {
                return res.status(403).json({ message: "You can only delete Yuva events" });
            }
            if (req.admin.role === 'Verve' && event.event_catagory !== 'Verve') {
                return res.status(403).json({ message: "You can only delete Verve events" });
            }
            // Category admins can delete any event in their category (not just ones they created)
        }

        // Delete poster from Cloudinary if it exists
        if (event.event_poster) {
            try {
                console.log('Attempting to delete poster from Cloudinary:');
                console.log('- Event poster URL:', event.event_poster);
                
                // Extract public_id from Cloudinary URL using utility function
                const publicId = CloudStorageService.extractPublicIdFromUrl(event.event_poster);
                
                console.log('- Extracted public_id:', publicId);
                
                if (publicId) {
                    const deleteResult = await CloudStorageService.deleteImage(publicId);
                    console.log('- Cloudinary deletion result:', deleteResult);
                } else {
                    console.warn('- Could not extract public_id from URL:', event.event_poster);
                }
            } catch (cloudinaryError) {
                console.error('Error deleting image from Cloudinary:', cloudinaryError);
                // Continue with event deletion even if Cloudinary deletion fails
            }
        }

        // Delete event from MongoDB
        await Event.findByIdAndDelete(id);

        res.status(200).json({
            message: "Event and associated poster deleted successfully"
        });

    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}


// generateEventId function using slug get event object id and generate unique event id 

export const generateEventId = async (req, res) => {
    try {
        const { slug } = req.params;
        const event = await Event.findOne({ event_slug: slug });
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }
        if(event.event_id){
            return res.status(200).json({
                message: "Event ID already exists",
                eventId: event.event_id
            });
        }
        const eventId = makeEventId(event.event_name, event._id);
        res.status(200).json({
            message: "Event ID generated successfully",
            eventId
        });
    } catch (error) {
        console.error("Error generating event ID:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Toggle Registration Status
export const toggleRegistrationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.admin.id;

        const event = await Event.findById(id);
        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Check if admin can edit this event
        if (req.admin.role !== 'SuperAdmin' && req.admin.role !== 'Admin') {
            if (req.admin.role === 'Aurum' && event.event_catagory !== 'Aurum') {
                return res.status(403).json({ message: "You can only manage Aurum events" });
            }
            if (req.admin.role === 'Olympus' && event.event_catagory !== 'Olympus') {
                return res.status(403).json({ message: "You can only manage Olympus events" });
            }
            if (req.admin.role === 'Yuva' && event.event_catagory !== 'Yuva') {
                return res.status(403).json({ message: "You can only manage Yuva events" });
            }
            if (req.admin.role === 'Verve' && event.event_catagory !== 'Verve') {
                return res.status(403).json({ message: "You can only manage Verve events" });
            }
        }

        // Toggle registration status
        const newStatus = !event.registration_open;
        
        // Use findByIdAndUpdate to avoid validating unchanged required fields
        const updatedEvent = await Event.findByIdAndUpdate(
            id,
            { 
                registration_open: newStatus,
                updatedAt: Date.now()
            },
            { 
                new: true,
                runValidators: false // Skip validation for fields we're not updating
            }
        );

        res.status(200).json({
            message: `Registration ${newStatus ? 'opened' : 'closed'} successfully`,
            event: updatedEvent,
            registration_open: newStatus
        });

    } catch (error) {
        console.error("Error toggling registration status:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

// Verify Event Code for Event Coordinator Access
export const verifyEventCode = async (req, res) => {
    try {
        const { eventCode } = req.params;
        const adminId = req.admin.id;
        console.log('Verifying event code:', eventCode, 'for admin:', adminId);

        if (!eventCode) {
            return res.status(400).json({ 
                success: false,
                message: "Event code is required" 
            });
        }

        // Find event by event_id
        const event = await Event.findOne({ event_id: eventCode });

        if (!event) {
            return res.status(404).json({ 
                success: false,
                message: "Invalid event code. Event not found" 
            });
        }

        // Check if the requesting admin is an event coordinator for this event
        const isCoordinator = event.event_coordinators?.some(
            coord => coord.id && coord.id.toString() === adminId.toString()
        );
        console.log('Is coordinator:', isCoordinator);

        // Check if EventCoordinator's category matches the event category
        const isCategoryCoordinator = req.admin.role === 'EventCoordinator' && 
                                      req.admin.eventCategory === event.event_catagory;

        // Check if requesting admin is a category admin (Yuva, Olympus, Aurum, Verve)
        const categoryRoles = ['Yuva', 'Olympus', 'Aurum', 'Verve'];
        const isCategoryAdmin = categoryRoles.includes(req.admin.role) && 
                                req.admin.role === event.event_catagory;

        // SuperAdmin and Admin can access any event
        // EventCoordinator can access if they are listed as coordinator OR their category matches
        // Category Admins can access events of their category
        if (req.admin.role === 'SuperAdmin' || 
            req.admin.role === 'Admin' || 
            isCoordinator || 
            isCategoryCoordinator ||
            isCategoryAdmin) {
            return res.status(200).json({
                success: true,
                message: "Event access granted",
                event: {
                    _id: event._id,
                    event_id: event.event_id,
                    event_name: event.event_name,
                    event_date: event.event_date,
                    event_description: event.event_description,
                    event_catagory: event.event_catagory,
                    team_type: event.team_type,
                    team_size: event.team_size,
                    event_type: event.event_type,
                    event_poster: event.event_poster,
                    event_slug: event.event_slug,
                    event_coordinators: event.event_coordinators,
                    registration_open: event.registration_open,
                    max_participants: event.max_participants,
                    current_participants: event.current_participants,
                }
            });
        }

        return res.status(403).json({
            success: false,
            message: "Access denied. You are not a coordinator for this event or your category does not match"
        });

    } catch (error) {
        console.error("Error verifying event code:", error);
        res.status(500).json({ 
            success: false,
            message: "Internal server error" 
        });
    }
}
import Admin from "../../models/Admin/Admin.js";
import RefreshToken from "../../models/Admin/RefreshToken.js";
import User from "../../models/User/Users.js";
import { sanitizeUserArray, sanitizeUserData } from "../../utils/sanitizeUserData.js";

// Get all admins (for counting)
export const getAllAdmins = async (req, res) => {
    try {
        console.log("Fetching all admins for stats..."); // Debug log
        const admins = await Admin.find({}, 'name email role createdAt').sort({ createdAt: -1 });
        
        // Count admins by role
        const roleCounts = {
            SuperAdmin: 0,
            Admin: 0,
            Yuva: 0,
            Olympus: 0,
            Aurum: 0,
            Photographer: 0,
            none: 0
        };
        
        admins.forEach(admin => {
            const role = admin.role || 'none';
            if (roleCounts.hasOwnProperty(role)) {
                roleCounts[role]++;
            } else {
                roleCounts[role] = 1;
            }
        });
        
        console.log('Admin role counts:', roleCounts); // Debug log
        console.log('Total admins found:', admins.length); // Debug log
        
        res.status(200).json({
            success: true,
            count: admins.length,
            admins: admins,
            roleCounts: roleCounts
        });
    } catch (error) {
        console.error("Error fetching admins:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch admins",
            error: error.message
        });
    }
};

// Get admin login statistics
export const getAdminLoginStats = async (req, res) => {
    try {
        // Count total refresh tokens created (represents login attempts/sessions)
        const totalLogins = await RefreshToken.countDocuments({});
        
        // Get unique admin login count
        const uniqueAdminLogins = await RefreshToken.distinct('adminId');
        
        // Get recent login activity (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentLogins = await RefreshToken.countDocuments({
            createdAt: { $gte: thirtyDaysAgo }
        });
        
        res.status(200).json({
            success: true,
            totalLogins: totalLogins,
            uniqueAdminsWithLogins: uniqueAdminLogins.length,
            recentLogins: recentLogins
        });
    } catch (error) {
        console.error("Error fetching admin login stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch admin login statistics",
            error: error.message
        });
    }
};


//Get student Stats
export const getStudentStats = async (req, res) => {
    try {
        console.log("Fetching student statistics..."); // Debug log
        
        // Get total student count
        const totalStudents = await User.countDocuments({});
        
        // Get verified vs unverified students
        const verifiedStudents = await User.countDocuments({ isVerified: true });
        const unverifiedStudents = await User.countDocuments({ isVerified: false });
        
        // Get students by department
        const departmentStats = await User.aggregate([
            {
                $group: {
                    _id: "$Department",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        // Get students by year
        const yearStats = await User.aggregate([
            {
                $group: {
                    _id: "$Year",
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);
        
        // Get students by type (B.TECH/B.VOC)
        const typeStats = await User.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            }
        ]);
        
        // Get recent registrations (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentRegistrations = await User.countDocuments({
            CreatedAT: { $gte: thirtyDaysAgo }
        });
        
        // Get students with event registrations
        const studentsWithEvents = await User.countDocuments({
            "Events_registered.0": { $exists: true }
        });
        
        // Get event registration statistics
        const eventStats = await User.aggregate([
            { $unwind: "$Events_registered" },
            {
                $group: {
                    _id: "$Events_registered.event_id",
                    registrations: { $sum: 1 },
                    pendingPayments: {
                        $sum: {
                            $cond: [
                                { $eq: ["$Events_registered.Payment_status", "Pending"] },
                                1,
                                0
                            ]
                        }
                    },
                    completedPayments: {
                        $sum: {
                            $cond: [
                                { $eq: ["$Events_registered.Payment_status", "Completed"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            {
                $sort: { registrations: -1 }
            }
        ]);
        
        console.log(`Total students found: ${totalStudents}`); // Debug log
        console.log(`Verified students: ${verifiedStudents}`); // Debug log
        
        res.status(200).json({
            success: true,
            totalStudents: totalStudents,
            verifiedStudents: verifiedStudents,
            unverifiedStudents: unverifiedStudents,
            recentRegistrations: recentRegistrations,
            studentsWithEvents: studentsWithEvents,
            departmentStats: departmentStats,
            yearStats: yearStats,
            typeStats: typeStats,
            eventStats: eventStats
        });
    } catch (error) {
        console.error("Error fetching student stats:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch student statistics",
            error: error.message
        });
    }
};

// Get all students data for admin dashboard
export const getAllStudents = async (req, res) => {
    try {
        console.log("Fetching all students data..."); // Debug log
        
        // Get query parameters for pagination and filtering
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        
        // Filter options
        const filters = {};
        if (req.query.department) filters.Department = req.query.department;
        if (req.query.year) filters.Year = req.query.year;
        if (req.query.type) filters.type = req.query.type;
        if (req.query.verified !== undefined) filters.isVerified = req.query.verified === 'true';
        if (req.query.college) filters.College_name = new RegExp(req.query.college, 'i');
        
        // Search functionality
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            filters.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { student_prn: searchRegex }
            ];
        }
        
        // Get students with pagination
        const students = await User.find(filters)
            .sort({ CreatedAT: -1 })
            .skip(skip)
            .limit(limit);
        
        // Sanitize user data
        const sanitizedStudents = sanitizeUserArray(students);
        
        // Get total count for pagination
        const totalCount = await User.countDocuments(filters);
        const totalPages = Math.ceil(totalCount / limit);
        
        console.log(`Fetched ${students.length} students, page ${page} of ${totalPages}`); // Debug log
        
        res.status(200).json({
            success: true,
            students: sanitizedStudents,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCount: totalCount,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            filters: filters
        });
    } catch (error) {
        console.error("Error fetching students data:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch students data",
            error: error.message
        });
    }
};

// Get specific student details by ID or PRN
export const getStudentDetails = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Fetching student details for ID: ${id}`); // Debug log
        
        let student;
        
        // Try to find by MongoDB _id first, then by student_prn
        if (id.match(/^[0-9a-fA-F]{24}$/)) {
            // Valid ObjectId
            student = await User.findById(id).populate({
                path: 'Events_registered.event_id',
                select: 'event_id event_name event_type event_catagory event_date event_fee team_type team_size'
            });
        } else {
            // Assume it's a PRN
            student = await User.findOne({ student_prn: id }).populate({
                path: 'Events_registered.event_id',
                select: 'event_id event_name event_type event_catagory event_date event_fee team_type team_size'
            });
        }
        
        if (!student) {
            return res.status(404).json({
                success: false,
                message: "Student not found"
            });
        }
        
        console.log(`Found student: ${student.name}`); // Debug log
        
        res.status(200).json({
            success: true,
            student: sanitizeUserData(student)
        });
    } catch (error) {
        console.error("Error fetching student details:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch student details",
            error: error.message
        });
    }
};

// Get students by event registration
export const getStudentsByEvent = async (req, res) => {
    try {
        const { eventId } = req.params;
        console.log(`Fetching students for event: ${eventId}`); // Debug log
        
        // Get query parameters for pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        
        // Filter by payment status if provided
        const paymentFilter = req.query.paymentStatus;
        
        // Build aggregation pipeline
        const pipeline = [
            { $unwind: "$Events_registered" },
            { $match: { "Events_registered.event_id": eventId } }
        ];
        
        // Add payment status filter if provided
        if (paymentFilter) {
            pipeline.push({
                $match: { "Events_registered.Payment_status": paymentFilter }
            });
        }
        
        // Add pagination and projection
        pipeline.push(
            { $skip: skip },
            { $limit: limit },
            {
                $project: {
                    student_prn: 1,
                    name: 1,
                    email: 1,
                    Department: 1,
                    Year: 1,
                    type: 1,
                    College_name: 1,
                    isVerified: 1,
                    registration_date: "$Events_registered.registration_date",
                    payment_status: "$Events_registered.Payment_status"
                }
            }
        );
        
        const students = await User.aggregate(pipeline);
        
        // Get total count for pagination
        const countPipeline = [
            { $unwind: "$Events_registered" },
            { $match: { "Events_registered.event_id": eventId } }
        ];
        
        if (paymentFilter) {
            countPipeline.push({
                $match: { "Events_registered.Payment_status": paymentFilter }
            });
        }
        
        countPipeline.push({ $count: "total" });
        
        const countResult = await User.aggregate(countPipeline);
        const totalCount = countResult.length > 0 ? countResult[0].total : 0;
        const totalPages = Math.ceil(totalCount / limit);
        
        console.log(`Found ${students.length} students for event ${eventId}`); // Debug log
        
        res.status(200).json({
            success: true,
            eventId: eventId,
            students: students,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalCount: totalCount,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error("Error fetching students by event:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch students by event",
            error: error.message
        });
    }
};

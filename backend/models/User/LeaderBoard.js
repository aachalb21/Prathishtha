//here create schema for leaderboard
import mongoose from "mongoose";
const LeaderBoardSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    // Experience points of user
    exp: {
        type: Number,
        default: 0
    },
    rank: {
        type: Number,
        default: null
    }
});

const LeaderBoard = mongoose.model("LeaderBoard", LeaderBoardSchema);

export default LeaderBoard;
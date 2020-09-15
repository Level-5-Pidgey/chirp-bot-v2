import mongoose from "mongoose";

const userXPInfo = new mongoose.Schema({
    lastMessage : { type : Date, default: Date.now },
    totalXP : { type : Number, default : 0 },
    xpThisMonth : { type : Number, default : 0 },
    lastEarnedMOTM : { type : Date },
    levelNick : { type : String }
});

const GuildUserModel = new mongoose.Schema({
    userID : { type: String, unique : true, required: true },
    xpInfo : {
        type: userXPInfo,
        default: {}
    }
});

export default mongoose.model("User", GuildUserModel);
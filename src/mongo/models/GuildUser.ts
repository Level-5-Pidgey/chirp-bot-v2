import mongoose from "mongoose";

const userXPInfo = new mongoose.Schema({
    lastMessageDate : { type : Date, default: Date.now },
    totalXP : { type : Number, default : 0 },
    xpThisMonth : { type : Number, default : 0 },
    lastEarnedMOTMDate : { type : Date },
    sendLevelUpMessages : { type : Boolean, default : true}
});

const GuildUserModel = new mongoose.Schema({
    userID : { type: String, unique : true, required: true },
    xpInfo : {
        type: userXPInfo,
        default: {}
    }
});

export default mongoose.model("User", GuildUserModel);
import mongoose from "mongoose";

const userXPInfo = new mongoose.Schema({
    lastMessageDate : { type : Date, default: Date.now },
    totalXP : { type : Number, default : 0 },
    xpThisMonth : { type : Number, default : 0 },
    lastEarnedMOTMDate : { type : Date },
    sendLevelUpMessages : { type : Boolean, default : true}
});

const userPointsInfo = new mongoose.Schema({
    coachPoints : { type: Number, default : 0 },
    contribPoints : { type : Number, default : 0 },
    participationPoints : { type : Number, default : 0 }
});

const GuildUserModel = new mongoose.Schema({
    userID : { type: String, required: true },
    userGuild : { type: String, required: true },
    xpInfo : { type: userXPInfo, default: {} },
    pointsInfo : { type: userPointsInfo, default: {} }
});

GuildUserModel.index({userID : 1, userGuild : 1}, {unique : true});

export default mongoose.model("User", GuildUserModel);
import mongoose from "mongoose";
import {owners, prefix, xpMax, xpMin} from "../../config/config";

const xpSettings = new mongoose.Schema({
    xpChannelList : { type : Array, default : [] },
    ChannelListIsBlacklist : { type : Boolean, default : true},
    minXPPerMessage : { type : Number, default : xpMin },
    maxXPPerMessage : { type : Number, default : xpMax },
    xpMultiplierRoles : { type : Array, default : [] },
    levelThreshholdRoles : { type : Array, default : [] },
});

const earnedRoleSettings = new mongoose.Schema({
    contributionRoles : { type : Array, default : [] },
    coachRoles : { type : Array, default : [] },
    communityParticipationRoles : { type : Array, default : [] },
    motmRole : { type : String, default : "" },
});

const staffSettings = new mongoose.Schema({
    staffMembers : { type : Array, default : owners },
    staffRoles : { type : Array, default : [] },
});

const MongoGuild = new mongoose.Schema({
    guildID : { type : String, unique : true, required: true },
    guildXPSettings : {
        type : xpSettings,
        default : { }
    },
    guildStaffSettings : {
        type : staffSettings,
        default : { }
    },
    guildEarnedRoleSettings : {
        type : earnedRoleSettings,
        default : { }
    }
});

export default mongoose.model("Guild", MongoGuild);
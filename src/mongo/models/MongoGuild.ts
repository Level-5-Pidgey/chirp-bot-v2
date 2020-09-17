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

const staffSettings = new mongoose.Schema({
    staffMembers : { type : Array, default : owners },
    staffRoles : { type : Array, default : [] },
});

const MongoGuild = new mongoose.Schema({
    guildID : { type : String, unique : true, required: true },
    guildPrefix : { type : String, default : prefix },
    guildXPSettings : {
        type : xpSettings,
        default : { }
    },
    guildStaffSettings : {
        type : staffSettings,
        default : { }
    }
});

export default mongoose.model("Guild", MongoGuild);
import mongoose = require("mongoose");
import {mongoDBName} from "../config/config";
import {LoggerClient} from "./LoggerClient";
import {Guild, GuildChannel, GuildMember, Message} from "discord.js";
import GuildUserModel from "../mongo/models/GuildUser";
import MongoGuild from "../mongo/models/MongoGuild";
import {resolve} from "dns";

export class DbClient {
    constructor()
    {
        //Connect to the mongo database, or terminate the bot if the connection fails.
        this.connect();
    }

    private async connect()
    {
        //Connect to the MongoDb and get the database requested in the client constructor.
        mongoose.connect(`mongodb://mongo:27017/${mongoDBName}`, { useNewUrlParser : true },  (err) =>
        {
            if (!err) {
                LoggerClient.WriteInfoLog(`Successfully connected to Mongo database \'${mongoDBName}\'!`);
            } else {
                LoggerClient.WriteErrorLog(`Error connecting to Mongo database \'${mongoDBName}\'!`);

                process.exit();
            }
        });
    }

    private async FindOrCreateGuildObject(guild : Guild)
    {
        return new Promise(async function (resolve, reject) {
            let guildData = await MongoGuild.findOne({ guildID : guild.id });

            if(guildData)
            {
                resolve(guildData);
            }
            else
            {
                guildData = new MongoGuild({ guildID : guild.id });
                await guildData.save();

                resolve(guildData);
            }
        });
    }

    private async FindOrCreateUserObject(memberToChange : GuildMember)
    {
        return new Promise(async function (resolve, reject) {
            let userData = await GuildUserModel.findOne({ userID: `${memberToChange.id}-${memberToChange.guild.id}`});

            if(userData)
            {
                resolve(userData);
            }
            else
            {
                userData = new GuildUserModel({ userID: `${memberToChange.id}-${memberToChange.guild.id}`});
                await userData.save();

                resolve(userData);
            }
        });
    }

    public async ModifyXP(memberToChange : GuildMember, preMultiAmount : number, applyMultipliers : boolean)
    {
        const mongoUser : any = await this.FindOrCreateUserObject(memberToChange);
        let amountToModify : number = preMultiAmount;

        if(applyMultipliers) //If the multipliers apply, calculate the final amount by the roles of the user
        {
            this.GetMultipliers(memberToChange).then(value => {
                amountToModify *= value;
            });
        }

        mongoUser.xpInfo.totalXP += amountToModify; //Apply XP with multipliers
        mongoUser.xpInfo.xpThisMonth += preMultiAmount; //Apply base XP only to the monthly total.
        mongoUser.xpInfo.lastMessage = Date.now(); //Update their last earned date.

        //Save the user once complete.
        mongoUser.save();
    }

    public async AddXPListChannel(channelToAdd : GuildChannel) : Promise<boolean>
    {
        let guildObject : any = await this.FindOrCreateGuildObject(channelToAdd.guild);
        LoggerClient.WriteInfoLog(`${guildObject.guildXPSettings.xpChannelList}`);
        const alreadyExists : boolean = guildObject.guildXPSettings.xpChannelList.includes(channelToAdd.id.toString());

        //Add the entry to the array if it doesn't already exist.
        if(!alreadyExists)
        {
            guildObject.guildXPSettings.xpChannelList.push(channelToAdd.id.toString());
            return guildObject.save();
        }
    }

    public async RemoveXPListChannel(channelToAdd : GuildChannel) : Promise<boolean>
    {
        let guildObject : any = await this.FindOrCreateGuildObject(channelToAdd.guild);
        const doesntExist : boolean = !guildObject.guildXPSettings.xpChannelList.includes(channelToAdd.id.toString());

        if(!doesntExist)
        {
            for (let i: number = guildObject.guildXPSettings.length; i--;) {
                if (guildObject.guildXPSettings.xpChannelList[i] === channelToAdd.id.toString()) {
                    guildObject.guildXPSettings.xpChannelList.splice(i, 1);
                }
            }

            return guildObject.save();
        }
    }

    private async GetXPChannels(guildToCheck : Guild) : Promise<string[]>
    {
        const guildObj : any = await this.FindOrCreateGuildObject(guildToCheck);
        return new Promise<string[]>(async function (resolve, reject) {
            resolve(guildObj.guildXPSettings.xpChannelList);
        });
    }

    public async IsXPListModeBlackList(guildToCheck : Guild) : Promise<boolean>
    {
        const guildObj : any = await this.FindOrCreateGuildObject(guildToCheck);
        return new Promise<boolean>(async function (resolve, reject) {
            resolve(guildObj.guildXPSettings.ChannelListIsBlacklist);
        });
    }

    public async CanEarnXPInThisChannel(messageToCheck : Message) : Promise<boolean>
    {
        //Create variables
        let messageInListedChannel : boolean = (await this.GetXPChannels(messageToCheck.guild)).includes(messageToCheck.channel.id.toString());
        let isBlacklist : boolean = await this.IsXPListModeBlackList(messageToCheck.guild);

        //Resolve promise with a list of XP channels.
        return (messageInListedChannel && !isBlacklist) || (!messageInListedChannel && isBlacklist);
    }

    public async toggleXPListMode(guildToChange : Guild)
    {
        let guildObject : any;
        await this.FindOrCreateGuildObject(guildToChange).then(value => {
            guildObject = value;

            //Invert boolean
            guildObject.guildXPSettings.ChannelListIsBlacklist = !guildObject.guildXPSettings.ChannelListIsBlacklist;

            //Save toggled boolean.
            guildObject.save();
        });
    }

    private async GetMultipliers(multiplierUser : GuildMember) : Promise<number>
    {
        let resultMulti = 1.0;
        let guildObject : any;
        await this.FindOrCreateGuildObject(multiplierUser.guild).then(value => {
            guildObject = value;

            //Skip ahead if there's no values in the array.
            if(guildObject.guildXPSettings.xpMultiplierRoles.length > 0)
            {
                guildObject.guildXPSettings.xpMultiplierRoles.forEach(value => {
                    if(multiplierUser.roles.cache.has(value.roleID))
                    {
                        resultMulti *= value.roleValue;
                    }
                });
            }
        });

        return resultMulti
    }
}
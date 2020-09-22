import mongoose = require("mongoose");
import {mongoDBName, owners} from "../config/config";
import {LoggerClient} from "./LoggerClient";
import {Guild, GuildChannel, GuildMember, Message} from "discord.js";
import GuildUserModel from "../mongo/models/GuildUser";
import MongoGuild from "../mongo/models/MongoGuild";
import {Mongoose} from "mongoose";
import XPData from "./XPData";

export class DbClient {
    private maxXPVal : number = new XPData(0).GetTotalXPRequiredForLevel(501);

    constructor() {
        //Connect to the mongo database, or terminate the bot if the connection fails.
        this.Connect().then(resolve =>
        {
            LoggerClient.WriteInfoLog(`Successfully connected to Mongo database \'${mongoDBName}\'!`);
        })
        .catch(reject =>
        {
            LoggerClient.WriteErrorLog(`Error connecting to Mongo database \'${mongoDBName}\'!`);
            process.exit();
        });
    }

    private async Connect() : Promise<Mongoose>
    {
        //Connect to the MongoDb and get the database requested in the client constructor.
        return mongoose.connect(`mongodb://mongo:27017/${mongoDBName}`, {useNewUrlParser: true});
    }

    public async FindOrCreateGuildObject(guild: Guild)
    {
        return new Promise<any>(async function (resolve, reject) {
            let guildData = await MongoGuild.findOne({guildID: guild.id});

            if ( guildData ) {
                resolve(guildData);
            } else {
                guildData = new MongoGuild({guildID: guild.id});
                await guildData.save();

                resolve(guildData);
            }
        });
    }

    public async FindOrCreateUserObject(memberToChange: GuildMember)
    {
        return new Promise<any>(async function (resolve, reject) {
            let userData = await GuildUserModel.findOne({userID: memberToChange.id, userGuild: memberToChange.guild.id});

            if ( userData ) {
                resolve(userData);
            } else {
                userData = new GuildUserModel({userID: memberToChange.id, userGuild: memberToChange.guild.id});
                await userData.save();

                resolve(userData);
            }
        });
    }

    public async ModifyXP(memberToChange: GuildMember,
                          preMultiAmount: number,
                          applyMultipliers?: boolean,
                          countsTowardsMonthly?: boolean): Promise<boolean>
    {
        const mongoUser : any = await this.FindOrCreateUserObject(memberToChange);
        let amountToModify : number = preMultiAmount;

        if ( applyMultipliers ) //If the multipliers apply, calculate the final amount by the roles of the user
        {
            this.GetMultipliers(memberToChange).then(value => {
                amountToModify *= value;
            });
        }

        //Create new XPData object with the calculated XP amount
        //Prevent the XP amount from breaching past level 501.
        const updatedXP : XPData = new XPData(Math.min(Math.max(0, (mongoUser.xpInfo.totalXP + amountToModify)), this.maxXPVal));

        //Update their last earned date.
        mongoUser.xpInfo.lastMessage = Date.now();

        //Update monthly XP if the month has rolled over.
        if ( mongoUser.xpInfo.lastMessageDate.getMonth() < new Date().getMonth() ) {
            mongoUser.xpInfo.xpThisMonth = 0;
        }

        //Before applying XP, check if the user would level up as a result of this XP change.
        if(this.CheckIfLevelChanges(mongoUser.xpInfo.totalXP, updatedXP.userXP))
        {
            //Send them a DM if they allow it in their user settings.
            if(mongoUser.xpInfo.sendLevelUpMessages)
            {
                memberToChange.send(`You have levelled up in ${memberToChange.guild.name}! You have reached level ${updatedXP.userLevel}!`)
                    .then(fulfilled => {
                        LoggerClient.WriteInfoLog(`Successfully sent level up message to ${memberToChange.displayName}, promise returned : ${fulfilled.toString()}`);
                    })
                    .catch(rejectReason =>
                    {
                        //Catch rejected promise if the user has left the server or is blocked.
                        LoggerClient.WriteErrorLog(`Couldn't message user ${memberToChange.displayName} their level-up message, promise returned : ${rejectReason.toString()}`);
                    });
            }
        }

        //Apply XP with multipliers
        mongoUser.xpInfo.totalXP = updatedXP.userXP;

        //Apply base XP to monthly total, if enabled
        if ( countsTowardsMonthly ) {
            //Apply base XP only to the monthly total.
            mongoUser.xpInfo.xpThisMonth += preMultiAmount;
        }

        //Save the user once complete.
        return mongoUser.save();
    }

    public async SetXP(memberToChange: GuildMember, value: number, updateMonthly?: boolean) : Promise<boolean>
    {
        const mongoUser: any = await this.FindOrCreateUserObject(memberToChange);
        const setVal : number = Math.min(this.maxXPVal, value);
        const userXPData : XPData = new XPData(setVal);

        //Before applying XP, check if the user would level up as a result of this XP change.
        if(this.CheckIfLevelChanges(mongoUser.xpInfo.totalXP, setVal))
        {
            //Send them a DM if they allow it in their user settings.
            if(mongoUser.xpInfo.sendLevelUpMessages)
            {
                memberToChange.send(`You have levelled up in ${memberToChange.guild.name}! You have reached level ${userXPData.userLevel}!`)
                    .then(fulfilled => {
                        LoggerClient.WriteInfoLog(`Successfully sent level up message to ${memberToChange.displayName}, promise returned : ${fulfilled.toString()}`);
                    })
                    .catch(rejectReason =>
                    {
                        //Catch rejected promise if the user has left the server or is blocked.
                        LoggerClient.WriteErrorLog(`Couldn't message user ${memberToChange.displayName} their level-up message, promise returned : ${rejectReason.toString()}`);
                    });
            }
        }

        mongoUser.xpInfo.totalXP = setVal; //Set total XP to this value.

        if ( updateMonthly ) {
            mongoUser.xpInfo.xpThisMonth = setVal; //Set monthly XP to the value given as well.
            mongoUser.xpInfo.lastMessage = Date.now(); //Update their last earned date.
        }

        return mongoUser.save();
    }

    public async ModifyLevel(memberToChange : GuildMember, desiredLevel : number, updateMonthly? : boolean) : Promise<boolean>
    {
        const mongoUser : any = await this.FindOrCreateUserObject(memberToChange);
        const userXPData : XPData = new XPData(mongoUser.xpInfo.totalXP);
        const desiredXP : number = Math.min(userXPData.GetTotalXPRequiredForLevel(Math.max(userXPData.userXP + desiredLevel, 1)), this.maxXPVal);

        //Update their last earned date.
        mongoUser.xpInfo.lastMessage = Date.now();

        //Update monthly XP if the month has rolled over.
        if ( mongoUser.xpInfo.lastMessageDate.getMonth() < new Date().getMonth() ) {
            mongoUser.xpInfo.xpThisMonth = 0;
        }

        //Set total XP to desired amount.
        mongoUser.xpInfo.totalXP = desiredXP;
        userXPData.userXP = desiredXP;

        //Before applying XP, check if the user's level would change.
        //It absolutely should if you're using the command properly, but it's better to account for all scenarios!
        if(userXPData.userLevel != desiredLevel)
        {
            //Send them a DM if they allow it in their user settings.
            if(mongoUser.xpInfo.sendLevelUpMessages)
            {
                memberToChange.send(`Your level in ${memberToChange.guild.name} has been set to ${userXPData.userXP}!`)
                    .then(fulfilled => {
                        LoggerClient.WriteInfoLog(`Successfully sent level set message to ${memberToChange.displayName}, promise returned : ${fulfilled.toString()}`);
                    })
                    .catch(rejectReason =>
                    {
                        //Catch rejected promise if the user has left the server or is blocked.
                        LoggerClient.WriteErrorLog(`Couldn't message user ${memberToChange.displayName} their level-up message, promise returned : ${rejectReason.toString()}`);
                    });
            }
        }

        //Apply base XP to monthly total, if enabled
        if ( updateMonthly ) {
            //Apply base XP only to the monthly total.
            mongoUser.xpInfo.xpThisMonth = desiredXP;
        }

        //Save the user once complete.
        return mongoUser.save();
    }

    public async SetLevel(memberToChange: GuildMember, value: number, updateMonthly?: boolean) : Promise<boolean>
    {
        const mongoUser : any = await this.FindOrCreateUserObject(memberToChange);
        const userXPData : XPData = new XPData(mongoUser.xpInfo.totalXP);
        const desiredXP : number = Math.min(userXPData.GetTotalXPRequiredForLevel(Math.max(value, 1)), this.maxXPVal);

        //Update their last earned date.
        mongoUser.xpInfo.lastMessage = Date.now();

        //Update monthly XP if the month has rolled over.
        if ( mongoUser.xpInfo.lastMessageDate.getMonth() < new Date().getMonth() ) {
            mongoUser.xpInfo.xpThisMonth = 0;
        }

        //Set total XP to desired amount and update XPData object.
        mongoUser.xpInfo.totalXP = desiredXP;
        userXPData.userXP = desiredXP;

        //Send them a DM about their level change if they allow it in their user settings.
        if(mongoUser.xpInfo.sendLevelUpMessages)
        {
            memberToChange.send(`Your level in ${memberToChange.guild.name} has been set to ${userXPData.userLevel}!`)
                .then(value =>
                {
                    //Send logger message about successful promise resolution.
                    LoggerClient.WriteInfoLog(`Successfully sent level set message to ${memberToChange.displayName}, promise returned : ${value}`);
                })
                .catch(rejectReason =>
                {
                    //Catch rejected promise if the user has left the server or is blocked.
                    LoggerClient.WriteErrorLog(`Couldn't message user ${memberToChange.displayName} their level-up message, promise returned : ${rejectReason.toString()}`);
                });
        }

        //Apply base XP to monthly total, if enabled
        if ( updateMonthly ) {
            //Apply base XP only to the monthly total.
            mongoUser.xpInfo.xpThisMonth = desiredXP;
        }

        //Save the user once complete.
        return mongoUser.save();
    }

    private CheckIfLevelChanges(oldXP : number, newXP : number) : boolean
    {
        const oldXPData : XPData = new XPData(oldXP);
        const newXPData : XPData = new XPData(newXP);
        return (oldXPData.userLevel != newXPData.userLevel);
    }

    public async AddXPListChannel(channelToAdd: GuildChannel): Promise<boolean>
    {
        let guildObject: any = await this.FindOrCreateGuildObject(channelToAdd.guild);
        LoggerClient.WriteInfoLog(`${guildObject.guildXPSettings.xpChannelList}`);
        const alreadyExists: boolean = guildObject.guildXPSettings.xpChannelList.includes(channelToAdd.id.toString());

        //Add the entry to the array if it doesn't already exist.
        if ( !alreadyExists ) {
            guildObject.guildXPSettings.xpChannelList.push(channelToAdd.id.toString());
            return guildObject.save();
        }
    }

    public async RemoveXPListChannel(channelToAdd: GuildChannel): Promise<boolean>
    {
        let guildObject: any = await this.FindOrCreateGuildObject(channelToAdd.guild);
        const channelExists: boolean = guildObject.guildXPSettings.xpChannelList.includes(channelToAdd.id.toString());

        if ( channelExists ) {
            guildObject.guildXPSettings.xpChannelList = guildObject.guildXPSettings.xpChannelList.filter(x => x !==
                channelToAdd.id.toString());
            return guildObject.save();
        } else {
            //If the channel does not exist resolve this function as false/unsuccessful.
            return new Promise<boolean>(async function (resolve, reject) {
                resolve(false);
            });
        }
    }

    private async GetXPChannels(guildToCheck: Guild): Promise<string[]>
    {
        const guildObj: any = await this.FindOrCreateGuildObject(guildToCheck);
        return new Promise<string[]>(async function (resolve, reject) {
            resolve(guildObj.guildXPSettings.xpChannelList);
        });
    }

    public async IsXPListModeBlackList(guildToCheck: Guild): Promise<boolean>
    {
        const guildObj: any = await this.FindOrCreateGuildObject(guildToCheck);
        return new Promise<boolean>(async function (resolve, reject) {
            resolve(guildObj.guildXPSettings.ChannelListIsBlacklist);
        });
    }

    public async CanEarnXPInThisChannel(messageToCheck: Message): Promise<boolean>
    {
        //Create variables
        let messageInListedChannel: boolean = (await this.GetXPChannels(messageToCheck.guild)).includes(messageToCheck.channel.id.toString());
        let isBlacklist: boolean = await this.IsXPListModeBlackList(messageToCheck.guild);

        //Resolve promise with a list of XP channels.
        return (messageInListedChannel && !isBlacklist) || (!messageInListedChannel && isBlacklist);
    }

    public async ToggleXPListMode(guildToChange: Guild): Promise<boolean>
    {
        let guildObject: any = await this.FindOrCreateGuildObject(guildToChange);

        //Invert boolean
        guildObject.guildXPSettings.ChannelListIsBlacklist = !guildObject.guildXPSettings.ChannelListIsBlacklist;

        //Save toggled boolean.
        return guildObject.save();
    }

    private async GetMultipliers(multiplierUser: GuildMember): Promise<number>
    {
        let resultMulti: number = 1.0;
        let guildObject: any = await this.FindOrCreateGuildObject(multiplierUser.guild);

        //Skip ahead if there's no values in the array.
        if ( guildObject.guildXPSettings.xpMultiplierRoles.length > 0 ) {
            guildObject.guildXPSettings.xpMultiplierRoles.forEach(value => {
                if ( multiplierUser.roles.cache.has(value.roleID) ) {
                    resultMulti *= value.roleValue;
                }
            });
        }

        return resultMulti
    }

    public async CanUseStaffCommands(memberToCheck: GuildMember): Promise<boolean>
    {
        let guildObject: any = await this.FindOrCreateGuildObject(memberToCheck.guild);

        return new Promise<boolean>(async function (resolve, reject) {
            if ( guildObject.guildStaffSettings.staffMembers.includes(memberToCheck.id.toString()) ||
                guildObject.guildStaffSettings.staffRoles.some(x => memberToCheck.roles.cache.has(x)) ||
                owners.includes(memberToCheck.id.toString()) ) {
                resolve(true);
            } else {
                resolve(false);
            }
        });
    }

    public async GenerateRandXp(guild : Guild) : Promise<number>
    {
        let guildObject: any = await this.FindOrCreateGuildObject(guild);

        return Math.floor(Math.random() * (guildObject.guildXPSettings.maxXPPerMessage - guildObject.guildXPSettings.minXPPerMessage) + guildObject.guildXPSettings.minXPPerMessage);
    }
}
import mongoose = require("mongoose");
import {mongoDBName, owners} from "../config/config";
import {LoggerClient} from "./LoggerClient";
import {Guild, GuildChannel, GuildMember, Message, Role} from "discord.js";
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
                          countsTowardsMonthly?: boolean) : Promise<boolean>
    {
        const mongoUser : any = await this.FindOrCreateUserObject(memberToChange);
        let amountToModify : number = preMultiAmount;

        if ( applyMultipliers ) //If the multipliers apply, calculate the final amount by the roles of the user
        {
            this.GetMultipliersForMember(memberToChange).then(value => {
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

            //Update Level-based Roles relevant to their new level.
            this.UpdateThresholdRolesForUser(memberToChange, userXPData);
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
        const desiredXP : number = Math.min(userXPData.GetTotalXPRequiredForLevel(Math.max(userXPData.userLevel + desiredLevel, 1)), this.maxXPVal);

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
                memberToChange.send(`Your level in ${memberToChange.guild.name} has been set to ${userXPData.userLevel}!`)
                    .then(fulfilled => {
                        LoggerClient.WriteInfoLog(`Successfully sent level set message to ${memberToChange.displayName}, promise returned : ${fulfilled.toString()}`);
                    })
                    .catch(rejectReason =>
                    {
                        //Catch rejected promise if the user has left the server or is blocked.
                        LoggerClient.WriteErrorLog(`Couldn't message user ${memberToChange.displayName} their level-up message, promise returned : ${rejectReason.toString()}`);
                    });
            }

            //Update Level-based Roles relevant to their new level.
            this.UpdateThresholdRolesForUser(memberToChange, userXPData);
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

        //Update Level-based Roles relevant to their new level.
        this.UpdateThresholdRolesForUser(memberToChange, userXPData);

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

    private UpdateThresholdRolesForUser(memberToChange: GuildMember, userXPData: XPData)
    {
        this.GetLevelUpRoles(memberToChange.guild).then(
            thresholdRoleList => {
                thresholdRoleList.forEach(thresholdRole => {
                    if ( memberToChange.roles.cache.has(thresholdRole.RoleId) ) {
                        if ( thresholdRole.LevelThreshold > userXPData.userLevel ) {
                            //If the member has the role and they are below the level threshold for it, remove it from them
                            memberToChange.roles.remove(thresholdRole.RoleId).then(result => {
                                LoggerClient.WriteInfoLog(`Removed role from user (from level changes) : ${result.toString()}`);
                            }).catch(error => {
                                LoggerClient.WriteErrorLog(`Couldn't remove role from user (from level changes) : ${error.toString()}`);
                            });
                        }
                    } else {
                        //If they don't have the role and they are above the level threshold for it, add it to them
                        if ( userXPData.userLevel >= thresholdRole.LevelThreshold ) {
                            memberToChange.roles.add(thresholdRole.RoleId).then(result => {
                                LoggerClient.WriteInfoLog(`Added role to user (from level changes) : ${result.toString()}`);
                            }).catch(error => {
                                LoggerClient.WriteErrorLog(`Couldn't add role to user (from level changes) : ${error.toString()}`);
                            });
                        }
                    }
                });
            });
    }

    public async AddXPListChannel(channelToAdd: GuildChannel): Promise<boolean>
    {
        let guildObject : any = await this.FindOrCreateGuildObject(channelToAdd.guild);
        const alreadyExists: boolean = guildObject.guildXPSettings.xpChannelList.includes(channelToAdd.id.toString());

        //Add the entry to the array if it doesn't already exist.
        if ( !alreadyExists ) {
            guildObject.guildXPSettings.xpChannelList.push(channelToAdd.id.toString());
            return guildObject.save();
        }
    }

    public async RemoveXPListChannel(channelToAdd: GuildChannel): Promise<boolean>
    {
        let guildObject : any = await this.FindOrCreateGuildObject(channelToAdd.guild);
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

    public async AddMultiplierRole(roleToAdd : Role, multiplier : number): Promise<boolean>
    {
        let guildObject : any = await this.FindOrCreateGuildObject(roleToAdd.guild);
        const multiplierObject : { RoleId : string, RoleMultiplier : number } =
            {
                RoleId : roleToAdd.id.toString(),
                RoleMultiplier : multiplier
            };

        const alreadyExists: boolean = guildObject.guildXPSettings.xpMultiplierRoles.filter(x => x.RoleId === roleToAdd.id.toString()).length > 0;

        //Add the entry to the array if it doesn't already exist.
        if ( !alreadyExists ) {
            guildObject.guildXPSettings.xpMultiplierRoles.push(multiplierObject);
            return guildObject.save();
        }
    }

    public async RemoveMultiplierRole(roleToRemove : Role)
    {
        let guildObject : any = await this.FindOrCreateGuildObject(roleToRemove.guild);
        const alreadyExists: boolean = guildObject.guildXPSettings.xpMultiplierRoles.filter(x => x.RoleId === roleToRemove.id.toString()).length > 0;

        if ( alreadyExists ) {
            guildObject.guildXPSettings.xpMultiplierRoles = guildObject.guildXPSettings.xpMultiplierRoles.filter(x => x.RoleId !==
                roleToRemove.id.toString());
            return guildObject.save();
        } else {
            //If the channel does not exist resolve this function as false/unsuccessful.
            return new Promise<boolean>(async function (resolve, reject) {
                resolve(false);
            });
        }
    }

    public async AddLevelUpRole(roleToAdd : Role, threshold : number): Promise<boolean>
    {
        let guildObject : any = await this.FindOrCreateGuildObject(roleToAdd.guild);
        const roleObject : { RoleId : string, LevelThreshold : number } =
            {
                RoleId : roleToAdd.id.toString(),
                LevelThreshold : threshold
            };

        const alreadyExists: boolean = guildObject.guildXPSettings.levelThreshholdRoles.filter(x => x.RoleId === roleToAdd.id.toString()).length > 0;

        //Add the entry to the array if it doesn't already exist.
        if ( !alreadyExists ) {
            guildObject.guildXPSettings.levelThreshholdRoles.push(roleObject);
            return guildObject.save();
        }
    }

    public async RemoveLevelUpRole(roleToRemove : Role)
    {
        let guildObject : any = await this.FindOrCreateGuildObject(roleToRemove.guild);
        const alreadyExists: boolean = guildObject.guildXPSettings.levelThreshholdRoles.filter(x => x.RoleId === roleToRemove.id.toString()).length > 0;

        if ( alreadyExists ) {
            guildObject.guildXPSettings.levelThreshholdRoles = guildObject.guildXPSettings.levelThreshholdRoles.filter(x => x.RoleId !==
                roleToRemove.id.toString());
            return guildObject.save();
        } else {
            //If the channel does not exist resolve this function as false/unsuccessful.
            return new Promise<boolean>(async function (resolve, reject) {
                resolve(false);
            });
        }
    }

    public async GetMultiplierRoles(guildToCheck : Guild) : Promise<Array<{ RoleId : string, RoleMultiplier : number }>>
    {
        const guildObject : any = await this.FindOrCreateGuildObject(guildToCheck);
        return guildObject.guildXPSettings.xpMultiplierRoles;
    }

    public async GetLevelUpRoles(guildToCheck : Guild) : Promise<Array<{ RoleId : string, LevelThreshold : number }>>
    {
        const guildObject : any = await this.FindOrCreateGuildObject(guildToCheck);
        return guildObject.guildXPSettings.levelThreshholdRoles;
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

    public async GetMultipliersForMember(multiplierUser: GuildMember): Promise<number>
    {
        let resultMulti: number = 1.0;
        await this.GetMultiplierRoles(multiplierUser.guild)
            .then(multiplierRolesArray =>
                {
                    //Skip ahead if there's no values in the array.
                    if ( multiplierRolesArray.length > 0 ) {
                        multiplierRolesArray.forEach(value => {
                            if ( multiplierUser.roles.cache.has(value.RoleId) ) {
                                resultMulti *= value.RoleMultiplier;
                            }
                        });
                    }
                }
            );

        return resultMulti;
    }

    public async CanUseStaffCommands(memberToCheck: GuildMember): Promise<boolean>
    {
        let guildObject: any = await this.FindOrCreateGuildObject(memberToCheck.guild);

        return new Promise<boolean>(async function (resolve, reject) {
            if ( guildObject.guildStaffSettings.staffMembers.includes(memberToCheck.id.toString()) ||
                guildObject.guildStaffSettings.staffRoles.some(x => memberToCheck.roles.cache.has(x)) ||
                owners.includes(memberToCheck.id.toString()) ||
                memberToCheck.permissions.has("ADMINISTRATOR")) {
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

    public async GenerateLeaderboard(guild : Guild) : Promise<Map<string, XPData>>
    {
        let resultMap : Map<string, XPData> = new Map<string, XPData>();
        let leaderboardUsers : any[] = await GuildUserModel.find({userGuild : guild.id.toString()})
            .sort({"xpInfo.totalXP" : -1})
            .exec();

        //Now that we have a list of results, add them to the map
        leaderboardUsers.forEach(mongoUser => {
            resultMap.set(mongoUser.userID, new XPData(mongoUser.xpInfo.totalXP));
        });

        //Return the map once done
        return resultMap;
    }

    public async GetLeaderboardPositionOfUser(memberToCheck: GuildMember) : Promise<number>
    {
        let result : number = 0;
        let leaderboardUsers : any[] = await GuildUserModel.find({userGuild : memberToCheck.guild.id.toString()})
            .sort({"xpInfo.totalXP" : -1})
            .exec();

        //Now that we have a list of results, loop through and add to the result count until we get to the user being searched for
        for(let i : number = 0; i < leaderboardUsers.length; i++)
        {
            result++;
            if(leaderboardUsers[i].userID.toString() == memberToCheck.id.toString())
            {
                break;
            }
        }

        return result;
    }

    public async GenerateMonthlyLeaderboard(guild : Guild) : Promise<Map<string, XPData>>
    {
        let resultMap : Map<string, XPData> = new Map<string, XPData>();
        let currentDate : Date = new Date();
        let previousMonthDate : Date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
        let leaderboardUsers : any[] = await GuildUserModel.find({userGuild : guild.id.toString(), 'xpInfo.lastMessageDate' : { $gte : previousMonthDate}})
            .sort({"xpInfo.xpThisMonth" : -1})
            .exec();

        //Now that we have a list of results, add them to the map
        leaderboardUsers.forEach(mongoUser => {
            resultMap.set(mongoUser.userID, new XPData(mongoUser.xpInfo.totalXP));
        });

        //Return the map once done
        return resultMap;
    }

    public async GetMonthlyLeaderboardPositionOfUser(memberToCheck: GuildMember) : Promise<number>
    {
        let result : number = 0;
        let currentDate : Date = new Date();
        let previousMonthDate : Date = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, currentDate.getDate());
        let leaderboardUsers : any[] = await GuildUserModel.find({userGuild : memberToCheck.guild.id.toString(), 'xpInfo.lastMessageDate' : { $gte : previousMonthDate}})
            .sort({"xpInfo.xpThisMonth" : -1})
            .exec();

        //Now that we have a list of results, loop through and add to the result count until we get to the user being searched for
        for(let i : number = 0; i < leaderboardUsers.length; i++)
        {
            result++;
            if(leaderboardUsers[i].userID.toString() == memberToCheck.id.toString())
            {
                break;
            }
        }

        return result;
    }
}
import { Command } from "discord-akairo";
import {Message, MessageEmbed, TextChannel} from "discord.js";
import { LoggerClient } from "../../client/LoggerClient";
import XPData from "../../client/XPData";
import { embedColour } from "../../config/config";
import { Menu } from "discord.js-menu";
import commandStrings = require("../../config/localstrings.json");
import GuildUserModel from "../../mongo/models/GuildUser";

let validLeaderboardTypes : Array<string> = new Array<string>("total", "monthly");

export default class LeaderboardCommand extends Command {
    public constructor() {
        super("leaderboard",
            {
                aliases : ["leaderboard", "lb"],
                category : "xp",
                args : [
                    {
                        id: "leaderboardType",
                        type: "string",
                        prompt: {
                            start: "What type of leaderboard are you trying to access?",
                            retry: `Please provide a valid leaderboard type. Valid types are: ${validLeaderboardTypes.join(", ")}"`,
                            optional: true
                        }
                    }
                ],
                description : {
                    content : "Creates a leaderboard that showcases users of the server, ordered by their XP on the server. Can show many different types of leaderboards, defaulting to the total XP.",
                    usage : "leaderboard [type]",
                    examples :
                        [
                            "leaderboard",
                            "leaderboard total"
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { leaderboardType }) : Promise<Message>
    {
        if (message.channel instanceof TextChannel)
        {
            const usersPerPage : number = 10;

            //Check if the user is requesting a valid leaderboard type
            if(leaderboardType != null && !validLeaderboardTypes.includes(leaderboardType.toLowerCase()))
            {
                return message.util.send(`You've entered an invalid leaderboard type. The valid leaderboard types are : ${validLeaderboardTypes.join(", ")}`);
            }

            //If no leaderboard type is entered, default to "total", otherwise toLower the input and check
            const leaderboardTypeString : string = leaderboardType == null ? "total" : leaderboardType.toLowerCase();
            switch (leaderboardTypeString) {
                case "monthly":
                    this.GenerateMonthlyXPEmbed(usersPerPage, message).then(generatedEmbed =>
                    {
                        message.util.send(generatedEmbed);
                    });
                    break;
                default:
                    this.GenerateTotalXPEmbed(usersPerPage, message).then(generatedEmbed =>
                    {
                        message.util.send(generatedEmbed);
                    });
            }
        }
        else
        {
            return message.util.send(commandStrings.INVALIDCHANNELUSAGE);
        }
    }

    private async GenerateTotalXPEmbed(usersToDisplay : number, message : Message) : Promise<MessageEmbed>
    {
        const leaderboardResultArray : Array<string> = new Array<string>();
        const leaderboardEmbed = this.client.util.embed()
            .setColor(embedColour);
        const leaderboardUsers : Array<any> = await GuildUserModel.find({userGuild : message.guild.id.toString()})
            .sort({"xpInfo.totalXP" : -1})
            .exec();

        //Iterate through users in the guild sorted by XP, then create string-based format
        for (let i = 0; i < leaderboardUsers.length; i++) {
            let mongoUser = leaderboardUsers[i];
            let index = leaderboardUsers.indexOf(mongoUser);
            if(index < usersToDisplay)
            {
                const resolvedMember = await message.guild.members.fetch(mongoUser.userID.toString());

                if (resolvedMember != null) {
                    let userXPData : XPData = new XPData(mongoUser.xpInfo.totalXP);
                    leaderboardResultArray.push(`${LeaderboardCommand.GetLeaderboardIndexString(index + 1)} : ${resolvedMember} — (__Level__ : **${userXPData.userLevel}**, __XP__ : **${userXPData.userXP.toLocaleString('en')})**`);
                }
            }
        }

        //If there are no entries, print a message to let the user know
        if ( leaderboardResultArray.length == 0 ) {
            leaderboardResultArray.push(`Could not find any members for this leaderboard. :(`);
            leaderboardResultArray.push(`An error has likely occurred.`);
        }

        //After we have all the entries, add to the embed and print!
        leaderboardEmbed.addField(`Total XP Leaderboard — ${message.guild.name}`, leaderboardResultArray);
        return leaderboardEmbed;
    }

    private async GenerateMonthlyXPEmbed(usersToDisplay : number, message : Message) : Promise<MessageEmbed>
    {
        const leaderboardResultArray : Array<string> = new Array<string>();
        const leaderboardEmbed = this.client.util.embed()
            .setColor(embedColour);
        const dateToday : Date = new Date();
        const monthAgoDate : Date = new Date(dateToday.setDate(dateToday.getDate() - 30));
        const leaderboardUsers : Array<any> = await GuildUserModel.find({userGuild : message.guild.id.toString(), "xpInfo.lastMessageDate" : { $gt : monthAgoDate }})
            .sort({"xpInfo.xpThisMonth" : -1})
            .exec();

        //Iterate through users in the guild sorted by XP, then create string-based format
        for (let i = 0; i < leaderboardUsers.length; i++) {
            let mongoUser = leaderboardUsers[i];
            let index = leaderboardUsers.indexOf(mongoUser);
            if(index < usersToDisplay)
            {
                const resolvedMember = await message.guild.members.fetch(mongoUser.userID.toString());

                if (resolvedMember != null) {
                    let userXPData : XPData = new XPData(mongoUser.xpInfo.totalXP);
                    userXPData.monthlyXP = mongoUser.xpInfo.xpThisMonth;
                    leaderboardResultArray.push(`${LeaderboardCommand.GetLeaderboardIndexString(index + 1)} : ${resolvedMember} — (__Level__ : **${userXPData.userLevel}**, __MXP__ : **${userXPData.monthlyXP.toLocaleString('en')})**`);
                }
            }
        }

        //If there are no entries, print a message to let the user know
        if ( leaderboardResultArray.length == 0 ) {
            leaderboardResultArray.push(`Could not find any members for this leaderboard. :(`);
            leaderboardResultArray.push(`An error has likely occurred.`);
        }

        //After we have all the entries, add to the embed and print!
        leaderboardEmbed.addField(`Monthly XP Leaderboard (${new Date().toLocaleString('default', { month: 'long' })}) — ${message.guild.name}`, leaderboardResultArray);
        return leaderboardEmbed;
    }

    private static GetLeaderboardIndexString(currentIndex : number) : string
    {
        switch (currentIndex) {
            case 1:
                return "🥇";
            case 2:
                return "🥈";
            case 3:
                return "🥉";
            default:
                return `#${currentIndex}`;
        }
    }

    private static RoundToNearest10Down(val : number) : number
    {
        return (Math.floor(val / 10) * 10);
    }
}
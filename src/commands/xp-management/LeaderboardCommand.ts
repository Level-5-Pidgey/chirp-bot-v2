import { Command } from "discord-akairo";
import {Message, MessageEmbed, TextChannel} from "discord.js";
import { LoggerClient } from "../../client/LoggerClient";
import XPData from "../../client/XPData";
import { embedColour } from "../../config/config";
import { Menu } from "discord.js-menu";
import commandStrings = require("../../config/localstrings.json");

export default class LeaderboardCommand extends Command {
    public constructor() {
        super("leaderboard",
            {
                aliases : ["leaderboard", "lb"],
                category : "xp",
                args : [
                    {
                        id: "leaderboardPage",
                        type: "integer",
                        prompt: {
                            start: "What page of the leaderboards are you trying to access?",
                            retry: "Please provide a valid leaderboard page.",
                            optional: true
                        }
                    }
                ],
                description : {
                    content : "Creates a leaderboard page that showcases the users, ordered by their XP on the server.",
                    usage : "leaderboard [page]",
                    examples :
                        [
                            "leaderboard",
                            "leaderboard 3"
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { leaderboardPage }) : Promise<Message>
    {
        if (message.channel instanceof TextChannel)
        {
            this.client.dbClient.GetLeaderboardPositionOfUser(message.member)
                .then(async leaderboardPosition =>
                {
                    const usersPerPage : number = 1;
                    let pageToGet : number = leaderboardPage == null ? LeaderboardCommand.RoundToNearest10Down(leaderboardPosition) + 1 : leaderboardPage;

                    if (pageToGet > 0)
                    {
                        let leaderboardMenu = new Menu(message.channel, message.author.id, [
                            {
                                name: "nextPage",
                                content : await this.GenerateLeaderboardEmbed(pageToGet, usersPerPage, message),
                                reactions: {
                                    "👈" : "previousPage",
                                    "👉" : "nextPage"
                                }
                            },
                            {
                                name: "previousPage",
                                content : await this.GenerateLeaderboardEmbed(pageToGet, usersPerPage, message),
                                reactions: {
                                    "👈" : "previousPage",
                                    "👉" : "nextPage"
                                }
                            }
                        ], 30000);

                        //Generate the Embed!
                        leaderboardMenu.start();

                        //Update the pageToGet variable as pages are chosen.
                        leaderboardMenu.on('pageChange', async destinationPage =>
                        {
                           if(destinationPage.name === "nextPage")
                           {
                               pageToGet++;
                           }
                           else if(destinationPage.name === "previousPage")
                           {
                               pageToGet = Math.max(1, pageToGet - 1);
                           }

                           destinationPage.content = await this.GenerateLeaderboardEmbed(pageToGet, usersPerPage, message);

                           LoggerClient.WriteInfoLog(`Page To Get has been updated to ${pageToGet}`);
                        });
                    }
                    else
                    {
                        return message.util.send("Please enter a page number greater than 0!");
                    }
                });
        }
        else
        {
            return message.util.send(commandStrings.INVALIDCHANNELUSAGE);
        }
    }

    private async GenerateLeaderboardEmbed(pageToGet : number, usersPerPage : number, message : Message) : Promise<MessageEmbed>
    {
        const maxIndex: number = Math.max(1, (pageToGet * usersPerPage));
        const minIndex: number = Math.max(1, maxIndex - usersPerPage + 1);
        const leaderboardMap: Map<string, XPData> = await this.client.dbClient.GenerateLeaderboard(message.guild);

        let leaderboardResultArray: Array<string> = [];
        const leaderboardEmbed = this.client.util.embed()
            .setColor(embedColour);

        let currentIndex: number = 0;
        await leaderboardMap.forEach(async (value: XPData, key: string) => {
            message.guild.members.fetch(key)
                .then(resolvedMember => {
                    //Increase the index by one then assess if we are in the range or not
                    currentIndex++;
                    if ( currentIndex >= minIndex && currentIndex <= maxIndex ) {
                        //We're in the 10 allowed entries of the leaderboard, so we can start obtaining users and printing them!
                        if ( resolvedMember != null ) {
                            leaderboardResultArray.push(`${LeaderboardCommand.GetLeaderboardIndexString(currentIndex)} : ${resolvedMember} — (__Level__ : **${value.userLevel}**, __XP__ : **${value.userXP.toLocaleString('en')})**`);
                        }
                    }
                });
        });

        //If there are no entries, print a message to let the user know
        if ( leaderboardResultArray.length == 0 ) {
            leaderboardResultArray.push(`Could not find any members on this page. :(`);
            leaderboardResultArray.push(`You might've entered an incorrect index, or an error has occurred.`);
        }

        //After we have all the entries, add to the embed and print!
        leaderboardEmbed.addField(`Leaderboard — ${message.guild.name} (Page ${pageToGet})`, leaderboardResultArray);
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
import {Command} from "discord-akairo";
import {GuildMember, Message, TextChannel} from "discord.js";
import {LoggerClient} from "../../client/LoggerClient";
import XPData from "../../client/XPData";
import {embedColour, prefix} from "../../config/config";

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
                    content : "Creates a leaderboard page that showcases the ",
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
            try
            {
                const pageToGet : number = leaderboardPage == null ? this.RoundToNearest10Down(await this.client.dbClient.GetLeaderboardPositionOfUser(message.member)) : Math.max(1, leaderboardPage);

                //Print the leaderboard!
                message.util.send(await this.GenerateLeaderboardEmbed(pageToGet, message))
                    .then( leaderboardEmbedFulfilled =>
                        {
                            leaderboardEmbedFulfilled.react("👈").then(() => leaderboardEmbedFulfilled.react("👉"));

                            const reactionFilter = (reaction, user) =>
                            {
                                return ["👈", "👉"].includes(reaction.emoji.name) && user.id === message.author.id;
                            };

                            leaderboardEmbedFulfilled.awaitReactions(reactionFilter, { max : 1, time: 60000, errors : [ "time" ]})
                                .then(collected =>
                                {
                                    const reaction = collected.first();

                                    if(reaction.emoji.name === "👈")
                                    {
                                        this.GenerateLeaderboardEmbed(Math.max(1, pageToGet - 1), message)
                                            .then(updatedLeaderboardEmbed =>
                                            {
                                                leaderboardEmbedFulfilled.edit("", updatedLeaderboardEmbed);
                                            });
                                    }
                                    else
                                    {
                                        this.GenerateLeaderboardEmbed(pageToGet + 1, message)
                                            .then(updatedLeaderboardEmbed =>
                                            {
                                                leaderboardEmbedFulfilled.edit("", updatedLeaderboardEmbed);
                                            });
                                    }
                                })
                                .catch(collected =>
                                {
                                    //Return the finalised leaderboard embed once done
                                    return collected;
                                });
                        }
                    );

            }
            catch (e) {
                LoggerClient.WriteErrorLog(`An error occurred when attempting to generate a leaderboard in the server ${message.guild.name} (${message.guild.id}), promise returned : ${e.toString()}`);
            }
        }
        else
        {
            return message.util.send("This command isn't suitable for DMs! Try again in a server.");
        }
    }

    private async GenerateLeaderboardEmbed(pageToGet : number, message : Message)
    {
        const usersPerPage : number = 1;
        const minIndex: number = Math.max(1, pageToGet * usersPerPage);
        const maxIndex: number = Math.max(1, minIndex + (usersPerPage - 1));
        const leaderboardMap: Map<string, XPData> = await this.client.dbClient.GenerateLeaderboard(message.guild);

        LoggerClient.WriteInfoLog(`Page entered was ${pageToGet}, minIndex is ${minIndex}, max index would be ${maxIndex}`);
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
                            leaderboardResultArray.push(`${this.GetLeaderboardIndexString(currentIndex)} : ${resolvedMember} — (__Level__ : **${value.userLevel}**, __XP__ : **${value.userXP.toLocaleString('en')})**`);
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

    private GetLeaderboardIndexString(currentIndex : number) : string
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

    private RoundToNearest10Down(val : number) : number
    {
        return (Math.floor(val / 10) * 10);
    }
}
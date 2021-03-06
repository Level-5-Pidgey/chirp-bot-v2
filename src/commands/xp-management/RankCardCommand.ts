import { Command } from "discord-akairo";
import {DMChannel, GuildMember, Message, MessageAttachment} from "discord.js";
import RankCard from "../../client/RankCard";
import {LoggerClient} from "../../client/LoggerClient";
import XPData from "../../client/XPData";
import {embedColour} from "../../config/config";
import commandStrings = require("../../config/localstrings.json");

export default class RankCardCommand extends Command {
    public constructor() {
        super("rank",
            {
                aliases : ["rank", "r"],
                category : "xp",
                args : [
                    {
                        id: "member",
                        type: "member",
                        prompt: {
                            start: "Please tag the member you want to check the rank of.",
                            retry: "Please provide a valid server member.",
                            optional: true
                        }
                    }
                ],
                description : {
                    content : "Generate a rank card for a user.",
                    usage : "rank",
                    examples :
                        [
                            "rank",
                            "rank @other-user"
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { member }): Promise<Message>
    {
        if (!(message.channel instanceof DMChannel))
        {
            const memberId : string = member == null ? message.member.id : member.id;
            let userXPData : XPData;
            let leaderboardPos : number = -1;
            //Try fetch the member requested for the rank card.

            message.guild.members.fetch(memberId)
                .then(memberToCheck =>
                {
                    this.client.dbClient.GetLeaderboardPositionOfUser(memberToCheck).then(userLbPosition =>
                    {
                        leaderboardPos = userLbPosition;
                    });

                    //Get member mongo object and their XP data
                    this.client.dbClient.FindOrCreateUserObject(memberToCheck)
                        .then(mongoUser => {
                            userXPData = new XPData(mongoUser.xpInfo.totalXP);

                            //Now we have the member, render the rank card!
                            message.util.send(`Our code monkeys are generating your rank card. Hang on a sec...`)
                                .then(async resolvedMessage =>
                                {
                                    await new RankCard().RenderCard(memberToCheck, userXPData.xpIntoLevel, userXPData.xpToLevel, userXPData.userLevel, leaderboardPos)
                                        .then(renderedCard =>
                                        {
                                            //Generate a message attachment with the card image.
                                            const cardImage : MessageAttachment = new MessageAttachment(renderedCard, `${memberToCheck.user.username}-rank-card.png`);

                                            //Delete the Pending message
                                            resolvedMessage.delete().then();

                                            //Return a message with the rank card image.
                                            return message.util.send(cardImage);
                                        });
                                });
                        });
                })
                .catch(e =>
                {
                    //Log rejection and print message for the user.
                    LoggerClient.WriteErrorLog(`Error fetching user ${memberId}, could not source by ID for a rank card! Promise rejection : ${e.toString()}`);
                    return message.util.send("There was an error processing this command! Please wait a bit and try again.");
                })
        }
        else
        {
            return message.util.send(commandStrings.INVALIDCHANNELUSAGE);
        }
    }
}
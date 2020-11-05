import {Command} from "discord-akairo";
import {Message, TextChannel} from "discord.js";
import {LoggerClient} from "../../client/LoggerClient";
import commandStrings = require("../../config/localstrings.json");

export default class SetXPCommand extends Command {
    public constructor() {
        super("setxprange",
            {
                aliases : ["setxprange", "sxpr"],
                category : "xp",
                args : [
                    {
                        id: "member",
                        type: "member",
                        prompt: {
                            start: "Please tag the member you want to set the XP of.",
                            retry: "Please provide a valid server member.",
                            optional: false
                        }
                    },
                    {
                        id: "amountToSetTo",
                        type: "number",
                        prompt: {
                            start: "Please provide the amount of XP you want to set a user to.",
                            retry: "Please provide a valid number!",
                            optional: false
                        }
                    },
                    {
                        id: "countTowardsMonthly",
                        type: "boolean",
                        prompt: {
                            start: "Please state if you'd like this modification to count towards monthly XP.",
                            retry: "Please provide a boolean result (e.g. \"Yes\", \"False\", \"1\".",
                            optional: true
                        }
                    }
                ],
                description : {
                    content : "Sets a user's XP to a certain amount.",
                    usage : "setxp <user> <value> [countTowardsMonthly]",
                    examples :
                        [
                            "setxp @bob 500",
                            "setxp @jim 0 false",
                            "setxp @larry 500 true"
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { member, amountToSetTo, countTowardsMonthly }): Promise<Message>
    {
        if (message.channel instanceof TextChannel)
        {
            if ( await this.client.dbClient.CanUseStaffCommands(message.member) )
            {
                if(amountToSetTo < 0)
                {
                    this.client.dbClient.SetXP(member, amountToSetTo, countTowardsMonthly)
                        .then(async fulfilled =>
                        {
                            LoggerClient.WriteInfoLog(`Modified ${member.username}'s XP in guild ${message.guild.id}, promise result : ${fulfilled.toString()}`);
                            return message.util.send(`Successfully set ${member}'s XP to *${amountToSetTo}*.`);
                        })
                        .catch(rejection =>
                        {
                            LoggerClient.WriteErrorLog(`Could not set an user's XP in guild ${message.guild.id}, promise rejection : ${rejection.toString()}`);
                            return message.util.send("There was an error processing this command! Please wait a bit and try again.");
                        });
                }
                else
                {
                    return message.util.send("You can't set a user's XP to below 0! Please try again.");
                }
            }
            else
            {
                return message.util.send(commandStrings.INVALIDSTAFFPERMS);
            }
        }
        else
        {
            return message.util.send(commandStrings.INVALIDCHANNELUSAGE);
        }
    }
}
import {Command} from "discord-akairo";
import {Message, TextChannel} from "discord.js";
import {LoggerClient} from "../../client/LoggerClient";

export default class ModifyXPCommand extends Command {
    public constructor() {
        super("modifyxp",
            {
                aliases : ["modifyxp", "mxp"],
                category : "xp",
                args : [
                    {
                        id: "member",
                        type: "member",
                        prompt: {
                            start: "Please tag the member you want to modify the XP of.",
                            retry: "Please provide a valid server member.",
                            optional: false
                        }
                    },
                    {
                        id: "amountToModify",
                        type: "number",
                        prompt: {
                            start: "Please provide the amount of XP you'd like to grant/take from a user.",
                            retry: "Please provide a valid number!",
                            optional: false
                        }
                    },
                    {
                        id: "applyMultipliers",
                        type: "boolean",
                        prompt: {
                            start: "Please state if you'd like this modification to apply multipliers.",
                            retry: "Please provide a boolean result (e.g. \"Yes\", \"False\", \"1\".",
                            optional: true
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
                    content : "Modify a user's XP by a certain amount.",
                    usage : "modifyxp <user> <value> [applyMultipliers] [countTowardsMonthly]",
                    examples :
                        [
                            "modifyxp @bob 500",
                            "modifyxp @jim -500 true false",
                            "modifyxp @larry 600.532 true true",
                            "modifyxp @samantha 5 false true",
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { member, amountToModify, applyMultipliers, countTowardsMonthly }): Promise<Message>
    {
        if (message.channel instanceof TextChannel)
        {
            if ( await this.client.dbClient.CanUseStaffCommands(message.member) )
            {
                if(amountToModify != 0)
                {
                    this.client.dbClient.ModifyXP(member, amountToModify, applyMultipliers, countTowardsMonthly)
                        .then(async fulfilled =>
                        {
                            LoggerClient.WriteInfoLog(`Modified ${member.username}'s XP in guild ${message.guild.id}, promise result : ${fulfilled.toString()}`);

                            //Grab the updated XP amount.
                            const modifyingUser : any = await this.client.dbClient.FindOrCreateUserObject(member);
                            return message.util.send(`Successfully modified ${member}'s XP by *${amountToModify}*, it is now *${modifyingUser.xpInfo.totalXP}*.`);
                        })
                        .catch(rejection =>
                        {
                            LoggerClient.WriteErrorLog(`Could not modify a user's XP in guild ${message.guild.id}, promise rejection : ${rejection.toString()}`);
                            return message.util.send("There was an error processing this command! Please wait a bit and try again.");
                        });
                }
                else
                {
                    return message.util.send(`Successfully modified ${member}'s XP by *${amountToModify}*. What's the point of doing that, exactly?`);
                }
            }
            else
            {
                return message.util.send("You do not have the appropriate permissions for this command!");
            }
        }
        else
        {
            return message.util.send("This command isn't suitable for DMs! Try again in a server.");
        }
    }
}
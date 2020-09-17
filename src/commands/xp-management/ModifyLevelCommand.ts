import {Command} from "discord-akairo";
import {Message, TextChannel} from "discord.js";
import {LoggerClient} from "../../client/LoggerClient";

export default class ModifyLevelCommand extends Command {
    public constructor() {
        super("modifylevel",
            {
                aliases : ["modifylevel", "mlvl", "mlevel"],
                category : "xp",
                args : [
                    {
                        id: "member",
                        type: "member",
                        prompt: {
                            start: "Please tag the member you want to modify the level of.",
                            retry: "Please provide a valid server member.",
                            optional: false
                        }
                    },
                    {
                        id: "modifyLevelCount",
                        type: "number",
                        prompt: {
                            start: "Please provide the level value to modify the user by.",
                            retry: "Please provide a valid number!",
                            optional: false
                        }
                    },
                    {
                        id: "updateMonthly",
                        type: "boolean",
                        prompt: {
                            start: "Please state if you'd like this modification to count towards monthly XP.",
                            retry: "Please provide a boolean result (e.g. \"Yes\", \"False\", \"1\".",
                            optional: true
                        }
                    }
                ],
                description : {
                    content : "Modify a user's level by a certain value.",
                    usage : "modifylevel <user> <value> [updateMonthly]",
                    examples :
                        [
                            "modifylevel @bob 2",
                            "modifylevel @jim 3 true",
                            "modifylevel @larry -3 false",
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { member, modifyLevelCount, updateMonthly }): Promise<Message>
    {
        if (message.channel instanceof TextChannel)
        {
            if ( await this.client.dbClient.CanUseStaffCommands(message.member) )
            {
                if(modifyLevelCount != 0)
                {
                    this.client.dbClient.ModifyLevel(member, modifyLevelCount, updateMonthly)
                        .then(async fulfilled =>
                        {
                            LoggerClient.WriteInfoLog(`Modified ${member.username}'s level in guild ${message.guild.id}, promise result : ${fulfilled.toString()}`);
                            return message.util.send(`Successfully modified ${member}'s level by *${modifyLevelCount} levels*.`);
                        })
                        .catch(rejection =>
                        {
                            LoggerClient.WriteErrorLog(`Could not set an user's level in guild ${message.guild.id}, promise rejection : ${rejection.toString()}`);
                            return message.util.send("There was an error processing this command! Please wait a bit and try again.");
                        });
                }
                else
                {
                    return message.util.send("There's no point trying to modify a user's levels by 0! Please try again.");
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
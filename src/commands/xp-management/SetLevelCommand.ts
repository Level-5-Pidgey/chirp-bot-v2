import {Command} from "discord-akairo";
import {Message, TextChannel} from "discord.js";
import {LoggerClient} from "../../client/LoggerClient";

export default class SetLevelCommand extends Command {
    public constructor() {
        super("setlevel",
            {
                aliases : ["setlevel", "slvl", "slevel"],
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
                        id: "levelToSet",
                        type: "number",
                        prompt: {
                            start: "Please provide the level to set a user to.",
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
                    content : "Sets a user's level to a given value.",
                    usage : "setlevel <user> <value> [updateMonthly]",
                    examples :
                        [
                            "setlevel @bob 5",
                            "setlevel @jim 10 true",
                            "setlevel @larry 25 false",
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { member, levelToSet, updateMonthly }): Promise<Message>
    {
        if (message.channel instanceof TextChannel)
        {
            if ( await this.client.dbClient.CanUseStaffCommands(message.member) )
            {
                if(levelToSet >= 1)
                {
                    this.client.dbClient.SetLevel(member, levelToSet, updateMonthly)
                        .then(async fulfilled =>
                        {
                            LoggerClient.WriteInfoLog(`Modified ${member.username}'s level in guild ${message.guild.id}, promise result : ${fulfilled.toString()}`);
                            return message.util.send(`Successfully set ${member}'s level to *level ${levelToSet}*.`);
                        })
                        .catch(rejection =>
                        {
                            LoggerClient.WriteErrorLog(`Could not set an user's level in guild ${message.guild.id}, promise rejection : ${rejection.toString()}`);
                            return message.util.send("There was an error processing this command! Please wait a bit and try again.");
                        });
                }
                else
                {
                    return message.util.send("You can't set a user's level to 0! Please try again.");
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
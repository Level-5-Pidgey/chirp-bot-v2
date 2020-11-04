import {Command, Flag} from "discord-akairo";
import {DMChannel, Message, TextBasedChannel, TextChannel} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";

export default class MultipliersRemoveCommand extends Command {
    public constructor() {
        super("xpm-remove",
            {
                aliases : ["del-role", "remove-role", "rr", "dr"],
                args:
                    [
                        {
                            id: "roleToRemove",
                            type: "role",
                            prompt: {
                                start: "Please mention the role you'd like to remove the multiplier of.",
                                retry: "Please provide a valid role!"
                            }
                        }
                    ],
                description : {
                    content : "Removes the XP multiplier for a given role in this server.",
                    usage : `multipliers remove \<role name\>`,
                    examples :
                        [
                            `${prefix}multipliers remove @Double XP`,
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { roleToRemove }) : Promise<Message>
    {
        if (message.channel instanceof TextChannel)
        {
            if(await this.client.dbClient.CanUseStaffCommands(message.member))
            {
                await this.client.dbClient.RemoveMultiplierRole(roleToRemove).then(value =>
                {
                    if(value)
                    {
                        return message.util.send(`Successfully removed role ${roleToRemove.toString()} from the list of roles that grant multipliers.`);
                    }
                    else
                    {
                        return message.util.send(`Failed to remove role ${roleToRemove.toString()} from the list of roles that grant multipliers.\nThe role may not have a multiplier assigned to it, or not exist.`);
                    }
                });
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
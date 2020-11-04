import {Command, Flag} from "discord-akairo";
import {DMChannel, Message, TextBasedChannel, TextChannel} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";

export default class XPThresholdRoleRemoveCommand extends Command {
    public constructor() {
        super("xpr-remove",
            {
                aliases : ["remove-xp-role", "delete-xp-role", "dxr", "rxr"],
                args:
                    [
                        {
                            id: "roleToRemove",
                            type: "role",
                            prompt: {
                                start: "Please mention the role you'd like to remove the level threshold of.",
                                retry: "Please provide a valid role!"
                            }
                        }
                    ],
                description : {
                    content : "Removes the XP multiplier for a given role in this server.",
                    usage : `xprole remove \<role name\>`,
                    examples :
                        [
                            `${prefix}xpr remove @Level 10`,
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
                await this.client.dbClient.RemoveLevelUpRole(roleToRemove).then(value =>
                {
                    if(value)
                    {
                        return message.util.send(`Successfully removed role ${roleToRemove.toString()} from the list of roles that are granted on level-up.`);
                    }
                    else
                    {
                        return message.util.send(`Failed to remove role ${roleToRemove.toString()} from the list of roles that granted on level-up.\nThe role may not have a threshold assigned to it, or not exist.`);
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
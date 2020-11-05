import {Command} from "discord-akairo";
import {DMChannel, Message, TextChannel} from "discord.js";
import {prefix} from "../../config/config";
import commandStrings = require("../../config/localstrings.json");

export default class StaffManagementRoleRemoveCommand extends Command {
    public constructor() {
        super("staff-role-remove",
            {
                aliases : ["remove-staff-role", "delete-staff-role", "dsr", "rsr"],
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
                    content : "Removes a role from the staff role list.",
                    usage : `staff remove-staff-role \<role name\>`,
                    examples :
                        [
                            `${prefix}staffmanagement remove-staff-role @Admin`,
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { roleToRemove }) : Promise<Message>
    {
        if (!(message.channel instanceof DMChannel))
        {
            if(message.member.permissions.has("ADMINISTRATOR"))
            {
                await this.client.dbClient.RemoveStaffRole(roleToRemove).then(value =>
                {
                    if(value)
                    {
                        return message.util.send(`Successfully removed role ${roleToRemove.toString()} from the list of staff roles.`);
                    }
                    else
                    {
                        return message.util.send(`Failed to remove role ${roleToRemove.toString()} from the list of staff roles.\nThe role may not have a threshold assigned to it, or not exist.`);
                    }
                });
            }
            else
            {
                return message.util.send(commandStrings.INVALIDADMINPERMS);
            }
        }
        else
        {
            return message.util.send(commandStrings.INVALIDCHANNELUSAGE);
        }
    }
}
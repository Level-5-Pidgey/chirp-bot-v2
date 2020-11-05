import {Command, } from "discord-akairo";
import {DMChannel, Message, TextChannel} from "discord.js";
import {prefix} from "../../config/config";
import commandStrings = require("../../config/localstrings.json");

export default class StaffManagementUserRemoveCommand extends Command {
    public constructor() {
        super("staff-user-remove",
            {
                aliases : ["remove-staff-user", "delete-staff-user", "dsu", "rsu"],
                args:
                    [
                        {
                            id: "memberToRemove",
                            type: "member",
                            prompt: {
                                start: "Please mention the user you'd like to remove staff privileges from.",
                                retry: "Please provide a valid user!"
                            }
                        }
                    ],
                description : {
                    content : "Removes a staff member from the staff member list of the server.",
                    usage : `staff remove-staff-user <user>`,
                    examples :
                        [
                            `${prefix}staff remove-staff-user @Bob`,
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { memberToRemove }) : Promise<Message>
    {
        if (!(message.channel instanceof DMChannel)) {
            if(message.member.permissions.has("ADMINISTRATOR"))
            {
                await this.client.dbClient.RemoveStaffUser(memberToRemove).then(value =>
                {
                    if(value)
                    {
                        return message.util.send(`${memberToRemove.displayName} can no longer use staff commands.`);
                    }
                    else
                    {
                        return message.util.send(`Failed to remove ${memberToRemove.displayName} as a staff member.\nThe user may not exist in the staff list?`);
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
import {Command} from "discord-akairo";
import {DMChannel, Message, TextChannel} from "discord.js";
import {prefix} from "../../config/config";
import commandStrings = require("../../config/localstrings.json");

export default class StaffManagementRoleAddCommand extends Command {
    public constructor() {
        super("staff-role-add",
            {
                aliases : ["add-staff-role", "insert-staff-role", "asr", "isr"],
                args:
                    [
                        {
                            id: "roleToAdd",
                            type: "role",
                            prompt: {
                                start: "Please mention the role you'd like to give staff privileges to.",
                                retry: "Please provide a valid role!"
                            }
                        }
                    ],
                description : {
                    content : "Adds a given role to the staff roles list. Members with this role can use staff commands.",
                    usage : `staff add-staff-role <role name>`,
                    examples :
                        [
                            `${prefix}sm add-staff-role @Trainee`,
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { roleToAdd }) : Promise<Message>
    {
        if (!(message.channel instanceof DMChannel)) {
            if(message.member.permissions.has("ADMINISTRATOR"))
            {
                await this.client.dbClient.AddStaffRole(roleToAdd).then(value =>
                {
                    if(value)
                    {
                        return message.util.send(`The role ${roleToAdd.toString()} is now recognised as a staff role. Any members with this role can now use staff commands.`);
                    }
                    else
                    {
                        return message.util.send(`Failed to add ${roleToAdd.toString()} as a staff role.\nYou may have possibly added this role already?`);
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
            return message.util.send(commandStrings.INVALIDCHANNELUSAGE)
        }
    }
}
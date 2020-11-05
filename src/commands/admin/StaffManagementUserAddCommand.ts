import {Command} from "discord-akairo";
import {DMChannel, Message, TextChannel} from "discord.js";
import {prefix} from "../../config/config";
import commandStrings = require("../../config/localstrings.json");

export default class StaffManagementUserAddCommand extends Command {
    public constructor() {
        super("staff-user-add",
            {
                aliases : ["add-staff-user", "insert-staff-user", "asu", "isu"],
                args:
                    [
                        {
                            id: "memberToAdd",
                            type: "member",
                            prompt: {
                                start: "Please mention the user you'd like to give staff privileges to.",
                                retry: "Please provide a valid user!"
                            }
                        }
                    ],
                description : {
                    content : "Adds a given user to the staff member list. These members can use staff commands.",
                    usage : `staff add-staff-user <user>`,
                    examples :
                        [
                            `${prefix}staff add-staff-user @Bob`,
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { memberToAdd }) : Promise<Message>
    {
        if (!(message.channel instanceof DMChannel)) {
            if(message.member.permissions.has("ADMINISTRATOR"))
            {
                await this.client.dbClient.AddStaffUser(memberToAdd).then(value =>
                {
                    if(value)
                    {
                        return message.util.send(`${memberToAdd} can now use staff commands!`);
                    }
                    else
                    {
                        return message.util.send(`Failed to add ${memberToAdd} as a staff member.\nYou may have possibly added this user already?`);
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
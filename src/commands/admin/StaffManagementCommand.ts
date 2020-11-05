import {Command, Flag} from "discord-akairo";
import {DMChannel, GuildMember, Message, Role} from "discord.js";
import {embedColour} from "../../config/config";
import commandStrings = require("../../config/localstrings.json");
import {LoggerClient} from "../../client/LoggerClient";

export default class StaffManagementCommand extends Command {
    public constructor() {
        super("staff",
            {
                aliases : ["staff", "staffmanagement", "sm"],
                category : "general",
                description : {
                    content : "Allows you to see what staff members are recognised in your server.",
                    usage : "sm [sub-command]...",
                    examples :
                        [
                            "staff",
                            "sm add-staff-role @Trainee",
                            "staffmanagement remove-staff-role @Admin",
                        ]
                },
                ratelimit : 3
            });
    }

    public *args(): object {
        const method = yield {
            type: [
                ["staff-role-add", "add-staff-role", "insert-staff-role", "asr", "isr"],
                ["staff-role-remove", "remove-staff-role", "delete-staff-role", "dsr", "rsr"],
                ["staff-user-add", "add-staff-user", "insert-staff-user", "asu", "isu"],
                ["staff-user-remove", "remove-staff-user", "delete-staff-user", "dsu", "rsu"],
            ],
            otherwise : async (message : Message) => {
                if (!(message.channel instanceof DMChannel))
                {
                    const staffEmbed = this.client.util.embed()
                        .setColor(embedColour);

                    const staffValidityString : string = `${await this.client.dbClient.CanUseStaffCommands(message.member) ?
                        "You are recognised as a staff member in this server." :
                        "If you need help, please contact one of the members or roles listed below."}`;

                    //Add the header of the embed.
                    staffEmbed.addField(`Staff Information — ${message.guild.name}`, [
                        "Listed here are the staff roles and staff members of the server.",
                        staffValidityString
                    ]);

                    //Add Staff Members
                    const staffUsersListString : Array<string> = await this.GenerateStaffUserList(message);
                    staffEmbed.addField("Staff Members List", staffUsersListString, true);

                    //Add Staff Roles
                    const staffRolesListString : Array<string> = await this.GenerateStaffRolesList(message);
                    staffEmbed.addField("Staff Roles List", staffRolesListString, true);

                    //Print Embed
                    return message.util.send(staffEmbed);
                }
                else
                {
                    return message.util.send(commandStrings.INVALIDCHANNELUSAGE);
                }
            }
        };
        return Flag.continue(method);
    }

    private async GenerateStaffUserList(message: Message) : Promise<Array<string>>
    {
        const staffUsersArray: Array<string> = [];
        const staffGuildMembers : Array<GuildMember> = await this.client.dbClient.GetStaffUsers(message.guild);

        if ( staffGuildMembers.length > 0 ) {
            staffGuildMembers.forEach(staffUser => {
                staffUsersArray.push(`${staffUser}`);
            });
        } else {
            staffUsersArray.push("There doesn't seem to be any designated staff users on this server.");
        }

        return staffUsersArray;
    }

    private async GenerateStaffRolesList(message: Message) : Promise<Array<string>>
    {
        const staffRoleList: Array<string> = [];
        const staffListOfRoles : Array<Role> = await this.client.dbClient.GetStaffRoles(message.guild);

        if ( staffListOfRoles.length > 0 ) {
            staffListOfRoles.forEach(staffRole => {
                staffRoleList.push(`${staffRole}`);
            });
        } else {
            staffRoleList.push("There doesn't seem to be any staff-designated roles on this server.");
        }

        return staffRoleList;
    }
}

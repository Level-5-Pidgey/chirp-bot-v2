import {Command, Flag} from "discord-akairo";
import {DMChannel, Message, TextBasedChannel, TextChannel} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";
import commandStrings = require("../../config/localstrings.json");

export default class CoachRoleRemoveCommand extends Command {
    public constructor() {
        super("coachr-remove",
            {
                aliases : ["remove-coach-role", "delete-coach-role", "dcr", "rcr"],
                args:
                    [
                        {
                            id: "roleToRemove",
                            type: "role",
                            prompt: {
                                start: "Please mention the role you'd like to remove the point threshold of.",
                                retry: "Please provide a valid role!"
                            }
                        }
                    ],
                description : {
                    content : "Removes a given role from the earnable list for server points.",
                    usage : `pointrole remove-coach-role \<role name\>`,
                    examples :
                        [
                            `${prefix}pointrole remove-coach-role @Coach III`,
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
                await this.client.dbClient.RemoveCoachRole(roleToRemove).then(value =>
                {
                    if(value)
                    {
                        return message.util.send(`Successfully removed role ${roleToRemove.toString()} from the list of roles that are granted to users with a certain point threshold.`);
                    }
                    else
                    {
                        return message.util.send(`Failed to remove role ${roleToRemove.toString()} from the list of roles that granted with points.\nThe role may not have a threshold assigned to it, or not exist.`);
                    }
                });
            }
            else
            {
                return message.util.send(commandStrings.INVALIDSTAFFPERMS);
            }
        }
        else
        {
            return message.util.send(commandStrings.INVALIDCHANNELUSAGE);
        }
    }
}
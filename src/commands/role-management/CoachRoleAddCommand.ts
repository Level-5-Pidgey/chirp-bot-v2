import {Command, Flag} from "discord-akairo";
import {DMChannel, Message, TextBasedChannel, TextChannel} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";
import commandStrings = require("../../config/localstrings.json");

export default class CoachRoleAddCommand extends Command {
    public constructor() {
        super("coachr-add",
            {
                aliases : ["add-coach-role", "insert-coach-role", "acr", "icr"],
                args:
                    [
                        {
                            id: "roleToAdd",
                            type: "role",
                            prompt: {
                                start: "Please mention the role you'd like to add to the list of coach roles.",
                                retry: "Please provide a valid role!"
                            }
                        },
                        {
                            id: "pointThreshold",
                            type: "number",
                            prompt: {
                                start: "How many points are required to earn this role?",
                                retry: "Please provide a valid number!"
                            }
                        },
                    ],
                description : {
                    content : "Adds a role to the list of level threshold roles. When a user hits the level required for the role it will be given to them.",
                    usage : `pointrole insert-coach-role <role name> <point threshold>`,
                    examples :
                        [
                            `${prefix}pointrole insert-coach-role @Coach I 10`,
                            `${prefix}pointrole add-coach-role @Coach II 15`,
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { roleToAdd, pointThreshold }) : Promise<Message>
    {
        if (message.channel instanceof TextChannel) {
            if(await this.client.dbClient.CanUseStaffCommands(message.member))
            {
                await this.client.dbClient.AddCoachRole(roleToAdd, pointThreshold)
                    .then(success =>
                    {
                        if(success)
                        {
                            return message.util.send(`Successfully added a point threshold of ${pointThreshold} points to ${roleToAdd.toString()}`);
                        }
                        else
                        {
                            return message.util.send(`Failed to add a point threshold to ${roleToAdd.toString()}.\nYou may have possibly added this role already?`);
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
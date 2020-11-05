import {Command, Flag} from "discord-akairo";
import {DMChannel, Message, TextBasedChannel, TextChannel} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";
import commandStrings = require("../../config/localstrings.json");

export default class XPThresholdRoleAddCommand extends Command {
    public constructor() {
        super("xpr-add",
            {
                aliases : ["add-xp-role", "insert-xp-role", "axr", "ixr"],
                args:
                    [
                        {
                            id: "roleToAdd",
                            type: "role",
                            prompt: {
                                start: "Please mention the role you'd like to add a level threshold to.",
                                retry: "Please provide a valid role!"
                            }
                        },
                        {
                            id: "levelThreshold",
                            type: "number",
                            prompt: {
                                start: "What level will a user have to hit to earn this role?",
                                retry: "Please provide a valid multiplier!"
                            }
                        },
                    ],
                description : {
                    content : "Adds a role to the list of level threshold roles. When a user hits the level required for the role it will be given to them.",
                    usage : `xprole insert-xp-role <role name> <level threshold>`,
                    examples :
                        [
                            `${prefix}xprole add @Level 10 10`,
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { roleToAdd, levelThreshold }) : Promise<Message>
    {
        if (message.channel instanceof TextChannel) {
            if(await this.client.dbClient.CanUseStaffCommands(message.member))
            {
                await this.client.dbClient.AddLevelUpRole(roleToAdd, levelThreshold).then(value =>
                {
                    if(value)
                    {
                        return message.util.send(`Successfully added a level threshold of ${levelThreshold} to ${roleToAdd.toString()}`);
                    }
                    else
                    {
                        return message.util.send(`Failed to add a level threshold to ${roleToAdd.toString()}.\nYou may have possibly added this role already?`);
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
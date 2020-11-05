import {Command, Flag} from "discord-akairo";
import {DMChannel, Message, TextBasedChannel, TextChannel} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";
import commandStrings = require("../../config/localstrings.json");

export default class MultipliersAddCommand extends Command {
    public constructor() {
        super("xpm-add",
            {
                aliases : ["add-role", "ar", "insrole", "ir"],
                args:
                    [
                        {
                            id: "roleToAdd",
                            type: "role",
                            prompt: {
                                start: "Please mention the role you'd like to add a multiplier to.",
                                retry: "Please provide a valid role!"
                            }
                        },
                        {
                            id: "multiplierValue",
                            type: "number",
                            prompt: {
                                start: "What multiplier would you like to give this role? 1.1x would be 10% bonus.",
                                retry: "Please provide a valid multiplier!"
                            }
                        },
                    ],
                description : {
                    content : "Gives a user with a given role an XP multiplier to the value you set.",
                    usage : `multipliers add \<role name\> \<role name\>`,
                    examples :
                        [
                            `${prefix}multipliers add @Double XP 2.0`,
                            `${prefix}multipliers add @Bad Member 0.5`,
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { roleToAdd, multiplierValue }) : Promise<Message>
    {
        if (message.channel instanceof TextChannel) {
            if(await this.client.dbClient.CanUseStaffCommands(message.member))
            {
                await this.client.dbClient.AddMultiplierRole(roleToAdd, multiplierValue).then(value =>
                {
                    if(value)
                    {
                        return message.util.send(`Successfully added a multiplier of ${multiplierValue} to ${roleToAdd.toString()}`);
                    }
                    else
                    {
                        return message.util.send(`Failed to add a multiplier to ${roleToAdd.toString()}.\nYou may have possibly added this role already?`);
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
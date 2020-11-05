import {Command, Flag} from "discord-akairo";
import {DMChannel, Message, TextBasedChannel, TextChannel} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";
import commandStrings = require("../../config/localstrings.json");

export default class XPChannelToggleAddCommand extends Command {
    public constructor() {
        super("xpt-add",
            {
                aliases : ["add-channel", "add-to-list", "ac", "ic"],
                args:
                    [
                        {
                            id: "channelToAdd",
                            type: "textChannel",
                            prompt: {
                                start: "Please state the name of the text channel to add to the xp list.",
                                retry: "Please provide a valid text channel!"
                            }
                        }
                    ],
                description : {
                    content : "Adds a text channel to the white/black list of channels that grant XP.",
                    usage : `xptoggle add \<channel name\>`,
                    examples :
                        [
                            `${prefix}xptoggle add #no_microphone`,
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { channelToAdd }) : Promise<Message>
    {
        if (message.channel instanceof TextChannel) {
            if(await this.client.dbClient.CanUseStaffCommands(message.member))
            {
                await this.client.dbClient.AddXPListChannel(channelToAdd).then(value =>
                {
                    this.client.dbClient.IsXPListModeBlackList(channelToAdd.guild).then(isBlacklist =>
                    {
                        if(value)
                        {
                            return message.util.send(`Successfully added channel ${channelToAdd.toString()} to the list of XP ${isBlacklist ? "blacklisted" : "whitelisted"} channels.`);
                        }
                        else
                        {
                            return message.util.send(`Failed to add channel ${channelToAdd.toString()} to the list of XP ${isBlacklist ? "blacklisted" : "whitelisted"} channels.\n You may have possibly added this channel already?`);
                        }
                    });
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
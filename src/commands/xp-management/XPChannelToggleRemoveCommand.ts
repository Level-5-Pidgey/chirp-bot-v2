import {Command, Flag} from "discord-akairo";
import {DMChannel, Message, TextBasedChannel, TextChannel} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";

export default class XPChannelToggleRemoveCommand extends Command {
    public constructor() {
        super("xpt-remove",
            {
                aliases : ["remove", "remove-channel", "remove-from-list", "d"],
                args:
                    [
                        {
                            id: "channelToRemove",
                            type: "textChannel",
                            prompt: {
                                start: "Please state the name of the text channel to remove from the xp list.",
                                retry: "Please provide a valid text channel!"
                            }
                        }
                    ],
                description : {
                    content : "Removes all instances of a text channel to the white/black list of channels that grant XP.",
                    usage : `xptoggle add \<channel name\>`,
                    examples :
                        [
                            `${prefix}xptoggle remove #no_microphone`,
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { channelToRemove }) : Promise<Message>
    {
        if (message.channel instanceof TextChannel)
        {
            if(await this.client.dbClient.CanUseStaffCommands(message.member))
            {
                await this.client.dbClient.RemoveXPListChannel(channelToRemove).then(value =>
                {
                    this.client.dbClient.IsXPListModeBlackList(channelToRemove.guild).then(isBlacklist =>
                    {
                        if(value)
                        {
                            return message.util.send(`Successfully removed channel ${channelToRemove.toString()} from the list of XP ${isBlacklist ? "blacklisted" : "whitelisted"} channels.`);
                        }
                        else
                        {
                            return message.util.send(`Failed to remove channel ${channelToRemove.toString()} from the list of XP ${isBlacklist ? "blacklisted" : "whitelisted"} channels.\nThis channel might not exist in the list currently.`);
                        }
                    });
                });
            }
            else
            {
                return message.util.send("You do not have the appropriate permissions for this command!");
            }
        }
        else
        {
            return message.util.send("This command isn't suitable for DMs! Try again in a server.");
        }
    }
}
import {Command, Flag} from "discord-akairo";
import {DMChannel, Message, TextBasedChannel, TextChannel} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";

export default class XPChannelToggleRemoveCommand extends Command {
    public constructor() {
        super("xpt-toggle",
            {
                aliases : ["mode", "toggle-mode", "m"],
                description : {
                    content : "Removes all instances of a text channel to the white/black list of channels that grant XP.",
                    usage : `xptoggle add \<channel name\>`,
                    examples :
                        [
                            `${prefix}xptoggle mode`,
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message) : Promise<Message>
    {
        if (message.channel instanceof TextChannel)
        {
            if(await this.client.dbClient.CanUseStaffCommands(message.member))
            {
                await this.client.dbClient.ToggleXPListMode(message.guild).then(value =>
                {
                    this.client.dbClient.IsXPListModeBlackList(message.guild).then(isBlacklist =>
                    {
                        if (value) {
                            return message.util.send(`Successfully toggled the XP channel mode to **${isBlacklist ? "BLACKLIST" : "WHITELIST"}**.`);
                        } else {
                            return message.util.send(`Failed to toggle the XP channel mode.`);
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
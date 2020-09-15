import {Command, Flag} from "discord-akairo";
import {DMChannel, Message} from "discord.js";
import {embedColour, prefix} from "../config/config";
import {LoggerClient} from "../client/LoggerClient";

export default class XPChannelToggleCommand extends Command {
    public constructor() {
        super("xptoggle",
            {
                aliases : ["xptoggle", "xpt", "txp", "togglexp"],
                category : "guild",
                description : {
                    content : "Allows you to change settings related to what channels grant XP to a user.",
                    usage : "xptoggle [sub-command]...",
                    examples :
                        [
                            "xptoggle add-channel #bot-commands",
                            "xpt r #no-microphone",
                            "xpt blacklist"
                        ]
                },
                ratelimit : 3
            });
    }

    public *args(): object {
        const method = yield {
            type: [
                ["xpt-add", "add", "add-channel", "add-to-list", "a", "i"],
                ["xpt-remove", "remove", "remove-channel", "remove-from-list", "d", "r"]
            ],
            otherwise : async (message : Message) => {
                if (!(message.channel instanceof DMChannel))
                {
                    return message.util.send(`Incorrect usage! Please use ${prefix}help xptoggle to learn more about usages of the command.`);
                }
                else
                {
                    return message.util.send(`This command isn't for DM usage - please use this command within a server!`);
                }
            }
        };

        return Flag.continue(method);
    }
}
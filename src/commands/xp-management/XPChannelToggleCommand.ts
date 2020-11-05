import {Command, Flag} from "discord-akairo";
import {DMChannel, Message} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";
import commandStrings = require("../../config/localstrings.json");

export default class XPChannelToggleCommand extends Command {
    public constructor() {
        super("xptoggle",
            {
                aliases : ["xptoggle", "xpt", "txp", "togglexp"],
                category : "xp",
                description : {
                    content : "Allows you to change settings related to what channels grant XP to a user.",
                    usage : "xptoggle [sub-command]...",
                    examples :
                        [
                            "xptoggle add-channel #bot-commands",
                            "xpt r #no-microphone",
                            "xpt mode"
                        ]
                },
                ratelimit : 3
            });
    }

    public *args(): object {
        const method = yield {
            type: [
                ["xpt-add", "add-channel", "add-to-list", "ac", "ic"],
                ["xpt-remove", "remove-channel", "remove-from-list", "dc", "rc"],
                ["xpt-toggle", "toggle-mode", "m"],
            ],
            otherwise : async (message : Message) => {
                if (!(message.channel instanceof DMChannel))
                {
                    return message.util.send(`Incorrect usage! Please use ${prefix}help xptoggle to learn more about usages of the command.`);
                }
                else
                {
                    return message.util.send(commandStrings.INVALIDCHANNELUSAGE);
                }
            }
        };

        return Flag.continue(method);
    }
}
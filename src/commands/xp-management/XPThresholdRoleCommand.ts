import {Command, Flag} from "discord-akairo";
import {DMChannel, Message} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";
import commandStrings = require("../../config/localstrings.json");

export default class XPThresholdRoleCommand extends Command {
    public constructor() {
        super("xprole",
            {
                aliases : ["xprole", "xpr"],
                category : "xp",
                description : {
                    content : "Allows you to add roles that are given upon level up.",
                    usage : "xprole [sub-command]...",
                    examples :
                        [
                            "xprole add-xp-role @Level 10 10",
                            "xpr axr @Special Role 20",
                        ]
                },
                ratelimit : 3
            });
    }

    public *args(): object {
        const method = yield {
            type: [
                ["xpr-add", "add-xp-role", "insert-xp-role", "axr", "ixr"],
                ["xpr-remove", "remove-xp-role", "delete-xp-role", "dxr", "rxr"],
            ],
            otherwise : async (message : Message) => {
                if (!(message.channel instanceof DMChannel))
                {
                    return message.util.send(`Incorrect usage! Please use ${prefix}help xprole to learn more about usages of the command.`);
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
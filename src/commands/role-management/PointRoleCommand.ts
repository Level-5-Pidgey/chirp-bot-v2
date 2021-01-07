import {Command, Flag} from "discord-akairo";
import {DMChannel, Message} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";
import commandStrings = require("../../config/localstrings.json");

export default class XPThresholdRoleCommand extends Command {
    public constructor() {
        super("pointrole",
            {
                aliases : ["pointrole", "pr"],
                category : "roles",
                description : {
                    content : "Allows you to add roles that are given upon a certain point value.",
                    usage : "pointrole [sub-command]...",
                    examples :
                        [
                            "pointrole insert-cgp-role @Community Game Participant I 5",
                            "pr remove-coach-role @Coach II",
                        ]
                },
                ratelimit : 3
            });
    }

    public *args(): object {
        const method = yield {
            type: [
                ["cgpr-add", "add-cgp-role", "insert-cgp-role", "acgpr", "icgpr"],
                ["cgpr-remove", "remove-cgp-role", "delete-cgp-role", "dcgpr", "rcgpr"],
                ["coachr-add", "add-coach-role", "insert-coach-role", "acr", "icr"],
                ["coachr-remove", "remove-coach-role", "delete-coach-role", "dcr", "rcr"],
                ["contributor-add", "add-contributor-role", "insert-contributor-role", "actr", "ictr"],
                ["contributor-remove", "remove-contributor-role", "delete-contributor-role", "dctr", "rctr"],
            ],
            otherwise : async (message : Message) => {
                if (!(message.channel instanceof DMChannel))
                {
                    return message.util.send(`Incorrect usage! Please use ${prefix}help pointrole to learn more about usages of the command.`);
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
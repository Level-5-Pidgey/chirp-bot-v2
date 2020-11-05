import {Command, Flag} from "discord-akairo";
import {DMChannel, Message} from "discord.js";
import {embedColour, prefix} from "../../config/config";
import {LoggerClient} from "../../client/LoggerClient";
import commandStrings = require("../../config/localstrings.json");

export default class XPChannelToggleCommand extends Command {
    public constructor() {
        super("multipliers",
            {
                aliases : ["multipliers", "multi", "xpm"],
                category : "xp",
                description : {
                    content : "Lets you check your current multipliers or allows admins to add roles to the xp multipliers.",
                    usage : "multipliers [sub-command]",
                    examples :
                        [
                            "multipliers",
                            "mutli add @Admin 1.5",
                            "xpm r @Admin"
                        ]
                },
                ratelimit : 3
            });
    }

    public *args(): object {
        const method = yield {
            type: [
                ["xpm-add", "add-role", "ar", "insrole", "ir"],
                ["xpm-remove", "del-role", "remove-role", "rr", "dr"],
            ],
            otherwise : async (message : Message) => {
                if (!(message.channel instanceof DMChannel))
                {
                    //Generate an embed showing the user their current multipliers.
                    this.client.dbClient.GetMultiplierRoles(message.guild).then(multiplierRoles =>
                    {
                        this.client.dbClient.FindOrCreateGuildObject(message.guild).then(guildObject =>
                        {
                            this.client.dbClient.GetMultipliersForMember(message.member).then(memberMultipliers =>
                            {
                                let averageXPPerMessage : number = (guildObject.guildXPSettings.maxXPPerMessage + guildObject.guildXPSettings.minXPPerMessage) / 2;

                                const multipliersEmbed = this.client.util.embed()
                                    .setColor(embedColour);

                                this.ExtractMultiplierRolesToStringArray(multiplierRoles, message).then(multiplierRolesAsStrings =>
                                {
                                    if(multiplierRolesAsStrings.length > 0)
                                    {
                                        multipliersEmbed.addField(`Current multipliers — ${message.author.username} (${message.guild.name})`, multiplierRolesAsStrings, false);
                                    }
                                    else
                                    {
                                        multipliersEmbed.addField(`Current multipliers — ${message.author.username} (${message.guild.name})`,
                                            [
                                                `You don't seem to have any roles that grant you XP Multipliers :(`
                                            ]);
                                    }

                                    multipliersEmbed.addField(`Total XP Multiplier : ${memberMultipliers.toFixed(2)}x`,
                                        [
                                            `You will typically earn ${averageXPPerMessage * memberMultipliers}xp per message.`
                                        ]);

                                    return message.util.send(multipliersEmbed);
                                });
                            });
                        });
                    });
                }
                else
                {
                    return message.util.send(commandStrings.INVALIDCHANNELUSAGE);
                }
            }
        };
        return Flag.continue(method);
    }

    private async ExtractMultiplierRolesToStringArray(multiplierRoles, message: Message) : Promise<Array<string>>
    {
        let multiplierRolesAsStrings : Array<string> = [];

        await multiplierRoles.forEach(multipliersObject => {
            //Obtain the role object, and check if the user has it before adding it
            message.guild.roles.fetch(multipliersObject.RoleId).then(roleObject => {
                if ( multipliersObject.RoleMultiplier != 1.0 ) {
                    multiplierRolesAsStrings.push(`${multipliersObject.RoleMultiplier.toFixed(2)} | ${roleObject}`);
                }

            }).catch(error => {
                LoggerClient.WriteErrorLog(`Failed to obtain role from ID (for the purpose of printing multipliers), trace ${error.toString()}`);
            });
        });

        return multiplierRolesAsStrings;
    }
}
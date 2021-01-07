import {Command} from "discord-akairo";
import {Message, TextChannel} from "discord.js";
import {PointsRoleType} from "../../config/config";
import commandStrings = require("../../config/localstrings.json");
import {LoggerClient} from "../../client/LoggerClient";

export default class ModifyPointValueCommand extends Command {
    public constructor() {
        super("modifypoints",
            {
                aliases : ["modifypts", "modifypoints", "mpoints", "mpts", "mp"],
                category : "roles",
                args : [
                    {
                        id: "member",
                        type: "member",
                        prompt: {
                            start: "Please tag the member you want to set the XP of.",
                            retry: "Please provide a valid server member.",
                            optional: false
                        }
                    },
                    {
                        id: "pointsType",
                        type: [
                            ["coach", "instructor", "teacher"],
                            ["contributor", "contrib", "helper"],
                            ["participant", "cgp"],
                        ],
                        prompt: {
                            start: "Please state the type of points you're going to update.",
                            retry: "Please provide a valid points type.",
                            optional: false
                        }
                    },
                    {
                        id: "modificationType",
                        type: [
                            ["set", "rewrite", "s"],
                            ["modify", "m", "change"],
                        ],
                        prompt: {
                            start: "Please state the type modification you're making.",
                            retry: "Please state if you're modifying or setting a points value.",
                            optional: false
                        }
                    },
                    {
                        id: "value",
                        type: "number",
                        prompt: {
                            start: "Please provide value to modify by. This value can only be negative if you're trying to modify a user's points.",
                            retry: "Please provide a valid number!",
                            optional: false
                        }
                    }
                ],
                description : {
                    content : "Sets a user's level to a given value.",
                    usage : "modifypoints <user> <type> <set|modify> <value>",
                    examples :
                        [
                            "modifypoints @bob coach set 5",
                            "modifypoints @jim contributor modify -5",
                            "modifypoints @larry participant modify 4",
                            "modifypoints @genji contributor set 0",
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { member, pointsType, modificationType, value }): Promise<Message>
    {
        if (message.channel instanceof TextChannel)
        {
            if ( await this.client.dbClient.CanUseStaffCommands(message.member) )
            {
                //Get the type of points being modified by the user (e.g. Coach, Contrib or Participant)
                let pointsTypeEnum : PointsRoleType;
                if (pointsType != null && modificationType != null)
                {
                    switch (pointsType)
                    {
                        case "coach":
                            pointsTypeEnum = PointsRoleType.Coach;
                            break;
                        case "contributor":
                            pointsTypeEnum = PointsRoleType.Contributor;
                            break;
                        case "participant":
                            pointsTypeEnum = PointsRoleType.Participant;
                            break;
                    }

                    switch (modificationType)
                    {
                        case "set":
                            //Check the value they want to set it to is above 0
                            if(value > 0)
                            {
                                this.client.dbClient.SetUserPoints(member, value, pointsTypeEnum)
                                    .then(fulfilled =>
                                    {
                                        LoggerClient.WriteInfoLog(`Modified ${member.username}'s points in guild ${message.guild.id}, promise result : ${fulfilled.toString()}`);
                                        return message.util.send(`Successfully set ${member}'s points to *${value}*.`);
                                    }).
                                    catch(rejection =>
                                    {
                                        LoggerClient.WriteErrorLog(`Could not set a user's points in guild ${message.guild.id}, promise rejection : ${rejection.toString()}`);
                                        return message.util.send("There was an error processing this command! Please wait a bit and try again.");
                                    });
                            }
                            else
                            {
                                return message.util.send("You cannot set points to a negative value!");
                            }

                            break;
                        case "modify":
                            //Get the user's current points value
                            this.client.dbClient.GetUserPoints(member, pointsTypeEnum)
                                .then(currentRolePoints =>
                                {
                                    //Calculate the number of points after the modification, above 0
                                    const modifiedRolePoints : number = Math.max(currentRolePoints + value, 0);
                                    this.client.dbClient.SetUserPoints(member, modifiedRolePoints, pointsTypeEnum)
                                        .then(fulfilled =>
                                        {
                                            LoggerClient.WriteInfoLog(`Modified ${member.username}'s points in guild ${message.guild.id}, promise result : ${fulfilled.toString()}`);
                                            return message.util.send(`Successfully set ${member}'s points to *${modifiedRolePoints}*.`);
                                        }).
                                    catch(rejection =>
                                    {
                                        LoggerClient.WriteErrorLog(`Could not set a user's points in guild ${message.guild.id}, promise rejection : ${rejection.toString()}`);
                                        return message.util.send("There was an error processing this command! Please wait a bit and try again.");
                                    });
                                });
                            break;
                    }
                }
                else
                {
                    return message.util.send("Please enter a correct points and modification type!");
                }
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
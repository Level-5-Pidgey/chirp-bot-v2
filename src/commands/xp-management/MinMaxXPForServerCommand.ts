import {Command} from "discord-akairo";
import {Message, TextChannel} from "discord.js";
import commandStrings = require("../../config/localstrings.json");

export default class MinMaxXPForServerCommand extends Command {
    public constructor() {
        super("setxpvariation",
            {
                aliases : ["setxpvariation", "sxpv", "xpv"],
                category : "xp",
                args : [
                    {
                        id: "minimumXPPerMessage",
                        type: "number",
                        prompt: {
                            start: "Please provide base minimum XP per message.",
                            retry: "Please provide a valid number!",
                            optional: false
                        }
                    },
                    {
                        id: "maximumXPPerMessage",
                        type: "number",
                        prompt: {
                            start: "Please provide base maximum XP per message.",
                            retry: "Please provide a valid number!",
                            optional: false
                        }
                    }
                ],
                description : {
                    content : "Modify a user's level by a certain value.",
                    usage : "setxpvariation <minvalue> <maxvalue>",
                    examples :
                        [
                            "setxpvariation 1 2",
                            "sxpv 0 50",
                            "xpv 5.5 10.5",
                        ]
                },
                ratelimit : 3
            });
    }

    public async exec(message: Message, { minimumXPPerMessage, maximumXPPerMessage }): Promise<Message>
    {
        if (message.channel instanceof TextChannel)
        {
            if ( await this.client.dbClient.CanUseStaffCommands(message.member) )
            {
                if(MinMaxXPForServerCommand.checkXPRangeIsValid(minimumXPPerMessage, maximumXPPerMessage))
                {
                    this.client.dbClient.SetXpVariation(message.guild, minimumXPPerMessage, maximumXPPerMessage)
                        .then(fulfilled =>
                        {
                            return message.util.send(`Successfully set the base XP gained in this server to range between ${minimumXPPerMessage} - ${maximumXPPerMessage}.`);
                        })
                        .catch(rejection =>
                        {
                            return message.util.send("There was an error processing this command! Please wait a bit and try again.");
                        });
                }
                else
                {
                    return message.util.send("Please enter a proper range of XP for server members to gain per message.");
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

    private static checkXPRangeIsValid(minXP : any, maxXP : any) : boolean
    {
        //To have a valid XP range, the two numbers must meet all of the following criteria:
        //Neither must be null
        if(minXP == null || maxXP == null) return false;

        //The minimum cannot be larger than the maximum
        if(minXP > maxXP) return false;

        //Both values must be greater than 0
        if(minXP < 0 || maxXP < 0) return false

        //If the above are met, return true
        return true;
    }
}
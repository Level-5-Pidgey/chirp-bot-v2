import {Command} from "discord-akairo";
import {Message, TextChannel} from "discord.js";

export default class ToggleLevelUpMessageCommand extends Command {
    public constructor() {
        super("togglelevelupmessages",
            {
                aliases : ["togglelevelupmessages", "tlum", "togglelevelup"],
                category : "xp",
                description : {
                    content : "Sets a user's XP to a certain amount.",
                    usage : "togglelevelupmessages",
                    examples :
                        [
                            "tlum",
                            "togglelevelupmessages"
                        ]
                },
                ratelimit : 3
            });
    }

    public exec(message: Message): Promise<Message>
    {
        if (message.channel instanceof TextChannel)
        {
            this.client.dbClient.FindOrCreateUserObject(message.member)
                .then(mongoUser => {
                    //Invert boolean
                    mongoUser.sendLevelUpMessages = !mongoUser.sendLevelUpMessages;

                    //Save toggled boolean.
                    mongoUser.save();

                    //Let the user know what the status of the variable is with a result message.
                    return message.util.send(`Successfully toggled the receiving of level-up messages to ${mongoUser.sendLevelUpMessages ? "**ON**" : "**OFF**"}.`)
                });
        }
        else
        {
            return message.util.send("This command isn't suitable for DMs! Try again in a server.");
        }
    }
}
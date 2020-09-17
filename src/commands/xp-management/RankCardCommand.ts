import {Command} from "discord-akairo";
import {Message} from "discord.js";

export default class RankCardCommand extends Command {
    public constructor() {
        super("rank",
            {
                aliases : ["rank", "r"],
                category : "xp",
                args : [
                    {
                        id: "member",
                        type: "member",
                        prompt: {
                            start: "Please tag the member you want to check the rank of.",
                            retry: "Please provide a valid server member.",
                            optional: true
                        }
                    }
                ],
                description : {
                    content : "Generate a rank card for a user.",
                    usage : "rank",
                    examples :
                        [
                            "rank",
                            "rank @other-user"
                        ]
                },
                ratelimit : 3
            });
    }

    public exec(message: Message, { member }): Promise<Message>
    {
        return message.util.send(`Pong! \`${this.client.ws.ping}ms\``);
    }
}
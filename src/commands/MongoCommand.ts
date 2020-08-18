import {Command, CommandHandler} from "discord-akairo";
import {Message} from "discord.js";
import MongoUser from "../mongo/models/MongoUser";
import {LoggerClient} from "../client/LoggerClient";
import BotClient from "../client/BotClient";

export default class MongoCommand extends Command {
    public constructor() {
        super("mongo",
        {
            aliases : ["mongo"],
            category : "db",
            description : {
                content : "Adds your user to the mongo database.",
                usage : "mongo",
                examples :
                [
                    "mongo"
                ]
            },
            ratelimit : 3
        });
    }

    public exec(message: Message): Promise<Message>
    {
        const user = new MongoUser(
            {
                username: message.author.username,
                userID: message.author.id,
                lastMessageDate: Date.now(),
                totalXP: Math.random() * (10000 - 100) + 100
            }
        );

        user.save()
            .then(result => LoggerClient.WriteInfoLog(result))
            .catch(err => LoggerClient.WriteErrorLog(err));

        return message.util.send("Added you to the mongo database!");
    }
}
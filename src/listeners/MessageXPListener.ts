import { Listener } from "discord-akairo";
import {Message, TextChannel} from "discord.js";
import BotClient from "../client/BotClient";
import {xpMax, xpMin} from "../config/config";
import {DbClient} from "../client/DBClient";

export default class MessageXPListener extends Listener {
    private dbClient = new DbClient();
    public constructor()
    {
        super("messageInvalid",
            {
                emitter : "commandHandler",
                event : "messageInvalid", //Emitted when a message does not start with the prefix or match a command.
                category : "xp"
            });
    }

    //When a user sends a message that is not a command, XP should be added to them.
    public async exec(message : Message): Promise<void>
    {
        if ((message.channel instanceof TextChannel) && await this.dbClient.CanEarnXPInThisChannel(message) && !message.author.bot)
        {
            //Check if the user is eligible for XP
            if(!BotClient.listOfXpUsers.includes(message.author.id))
            {
                //We should also add them to the list of users that have claimed XP this minute so they can't be given XP again.
                BotClient.listOfXpUsers.push(message.author.id);

                //This user is eligible, so we can add XP to them!
                return this.dbClient.ModifyXP(message.member, this.generateRandXp(), true);
            }
        }
    }

    private generateRandXp() : number
    {
        return Math.random() * (xpMax - xpMin) + xpMin;
    }
}
import {Command, Listener} from "discord-akairo";
import {LoggerClient} from "../client/LoggerClient";
import {Message} from "discord.js";

export default class CommandExecListener extends Listener {
    public constructor()
        {
            super("commandStarted",
                {
                emitter : "commandHandler",
                event : "commandStarted"
            });
    }


    public exec(message : Message, command : Command, args : any): void
    {
        //Log the command that was used and by whom.
        LoggerClient.LogCommandUsage(message, command);
    }
}
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

    //Log the command that was used and by whom.
    public exec(message : Message, command : Command, args : any) : void
    {
        LoggerClient.LogCommandUsage(message, command);
    }
}
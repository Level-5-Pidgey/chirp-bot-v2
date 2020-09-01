import { Listener } from "discord-akairo";
import {LoggerClient} from "../client/LoggerClient";
import {Snowflake} from "discord.js";

export default class ReadyListener extends Listener {
    public constructor()
    {
        super("ready",
        {
            emitter : "client",
            event : "ready",
            category : "client"
        });
    }

    //Log that the bot is online and ready.
    public exec(): void
    {
        LoggerClient.WriteInfoLog(`${this.client.user.tag} is now online and ready!`);
    }
}
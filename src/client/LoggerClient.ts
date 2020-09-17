import {Logger} from "winston";
import * as winston from "winston";
import {Command} from "discord-akairo";
import {DMChannel, Message} from "discord.js";

export class LoggerClient
{
    private static mylogger : Logger = winston.createLogger(
        {
            format : winston.format.json(),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({filename: `${process.cwd()}-chirp-logs-${new Date().getFullYear()}-${new Date().getMonth()}-${new Date().getDay()}`})
            ]
        }
    );

    public static WriteErrorLog(msg : String) : void
    {
        this.mylogger.error({
                timeStamp: new Date().toLocaleString('en-GB', { timeZone: 'UTC' }),
                message: msg
            }
        );
    }

    public static WriteInfoLog(msg : String) : void
    {
        this.mylogger.info({
            timeStamp: new Date().toLocaleString('en-GB', { timeZone: 'UTC' }),
            message: msg
        })
    }

    public static LogCommandUsage(msg : Message, cmd : Command)
    {
        if ( !(msg.channel instanceof DMChannel) ) {
            this.WriteInfoLog(`${msg.author.username} (ID : ${msg.author.id}) used command ${cmd.toString()} in guild ${msg.guild.name} (${msg.guild.id.toString()})`);
        } else {
            this.WriteInfoLog(`${msg.author.username} (ID : ${msg.author.id}) used command ${cmd.toString()} in DMs`);
        }
    }
}


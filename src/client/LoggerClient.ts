import {Logger} from "winston";
import * as winston from "winston";

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
                timeStamp: new Date().toLocaleDateString(),
                message: msg
            }
        );
    }

    public static WriteInfoLog(msg : String) : void
    {
        this.mylogger.info({
            timeStamp: new Date().toLocaleDateString(),
            message: msg
        })
    }
}


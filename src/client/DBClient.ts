import {Logger} from "winston";
import {mongoose} from "mongoose";

export class DbClient {

    public loadedDatabase : IDBDatabase;

    constructor(username : string, pass : string, dbName : string, winstonLogger : Logger)
    {
        this.Connect(username, pass, dbName, winstonLogger);
    }

    private async Connect(username : string, pass : string, dbName : string, winstonLogger : Logger)
    {
        const connect = () =>
        {
            mongoose.connect(`mongodb://${username}:${pass}@mongo:27017/${dbName}`, { useNewUrlParser : true })
                .then
                (
                    () =>
                    {
                        return winstonLogger.info(`Successfully connected to Mongo database \'${dbName}' with user ${username}`);
                    }
                )
                .catch
                (
                    error =>
                    {
                        winstonLogger.error(`Error connecting to Mongo database \'${dbName}' with user ${username}`);
                        return process.exit();
                    }
                );
        };
        connect();

        mongoose.connection.on('disconnected', connect);
    }
}
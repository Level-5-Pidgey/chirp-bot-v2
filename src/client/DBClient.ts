import mongoose = require("mongoose");
import {mongoDBName} from "../config/config";
import {LoggerClient} from "./LoggerClient";

export class DbClient {
    public loadedDatabase : IDBDatabase;

    constructor()
    {
        //Connect to the MongoDb and get the database requested in the client constructor.
        mongoose.connect(`mongodb://mongo:27017/${mongoDBName}`, { useNewUrlParser : true },  (err) =>
        {
            if (!err) {
                this.loadedDatabase = mongoose.connection;

                LoggerClient.WriteInfoLog(`Successfully connected to Mongo database \'${mongoDBName}\'!`);
            } else {
                LoggerClient.WriteErrorLog(`Error connecting to Mongo database \'${mongoDBName}\'!`);

                process.exit();
            }
        });
    }
}
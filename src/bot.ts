/*
 Import configs and dependencies
 */
import { owners } from "./config/config";
import { DbClient } from "./client/DBClient";
import BotClient from "./client/BotClient";
import { token } from "./config/token";
import {LoggerClient} from "./client/LoggerClient";
import {Snowflake} from "discord.js";
import * as util from "util";
import ReadyListener from "./listeners/ReadyListener";

/*
    Create clients, login to the right stuff!
 */
const client : BotClient = new BotClient({token, owners});
client.start();

const dbClient : DbClient = new DbClient();
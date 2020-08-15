/*
 Import configs and dependencies
 */
import {owners, prefix} from "./config/config";
import {DbClient} from "./client/DBClient";
import BotClient from "./client/BotClient";
import { token } from "./config/token";
import {LoggerClient} from "./client/LoggerClient";

/*
    Create clients and logging tools
 */
const client : BotClient = new BotClient({token, owners});
client.start();

const dbClient : DbClient = new DbClient();

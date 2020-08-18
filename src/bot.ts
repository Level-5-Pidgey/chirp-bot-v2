/*
 Import configs and dependencies
 */
import { owners } from "./config/config";
import { DbClient } from "./client/DBClient";
import BotClient from "./client/BotClient";
import { token } from "./config/token";

/*
    Create clients, login to the right stuff!
 */
const client : BotClient = new BotClient({token, owners});
client.start();

const dbClient : DbClient = new DbClient();

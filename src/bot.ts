/*
 Import configs and dependencies
 */

import {owners, prefix} from "./config/config";
import * as winston from "winston";
import { DbClient } from "./client/DBClient";
import BotClient from "./client/BotClient";
import { token } from "./config/token";
/*
    Create clients and logging tools
 */
const logger = winston.createLogger(
    {
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({filename: 'log'})
        ]
    }
);

const client : BotClient = new BotClient({ token, owners});
client.start();

const DClient = new DbClient("admin", "admin", "chirp-bot", logger);

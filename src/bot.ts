/**
 Import configs and dependencies
 */
import { token } from "./config/token";
import { prefix } from "./config/config";
import {Client} from "discord.js";
import * as winston from "winston";

const client = new Client();
const logger = winston.createLogger(
    {
        transports: [
            new winston.transports.Console(),
            new winston.transports.File({filename: 'log'})
        ]
    }
);

client.on('ready', () => logger.log('info', 'Discord is ready' + prefix));

client.login(token);
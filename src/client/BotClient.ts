import { AkairoClient, CommandHandler, ListenerHandler } from "discord-akairo";
import { join } from "path";
import { owners, prefix } from "../config/config";
import { GuildMember, Message, Role, Snowflake} from "discord.js";
import { DbClient } from "./DBClient";

declare module "discord-akairo"
{
    interface AkairoClient {
        commandHandler : CommandHandler,
        listenerHandler : ListenerHandler,
        dbClient : DbClient;
        DoesUserHaveRoleAsSnowflake;

    }
}

interface BotOptions {
    token? : string,
    owners? : string | string[];
}

export default class BotClient extends AkairoClient {
    public static listOfXpUsers : Array<Snowflake> = new Array<Snowflake>();
    public config : BotOptions;
    public listenerHandler : ListenerHandler = new ListenerHandler(this, {
        directory : join(__dirname, "..", "listeners")}
    );

    public commandHandler : CommandHandler = new CommandHandler(this, {
        directory : join(__dirname, "..", "commands"),
        prefix : prefix,
        allowMention : true,
        handleEdits : true,
        commandUtil : true,
        blockBots: true,
        blockClient: true,
        commandUtilLifetime : 3e5,
        defaultCooldown: 6e4,
        argumentDefaults :
            {
                prompt :
                {
                    modifyStart : (_: Message, str: string): string => `${str}\n\nType \`cancel\` to cancel the command...`,
                    modifyRetry : (_: Message, str: string): string => `${str}\n\nType \`cancel\` to cancel the command...`,
                    timeout : "Command timeout. You took too long!",
                    ended : "You exceeded the max amount of tries! The command has been cancelled.",
                    retries : 3,
                    time : 3e4
                },
                otherwise : ""
            },
            ignorePermissions : owners
    });

    public constructor(config: BotOptions)
    {
        super({
            ownerID : config.owners
        });

        this.config = config;
        this.dbClient = new DbClient();

        //Clear out the list of users that have gained XP every minute.
        this.setInterval(BotClient.clearXPUsers, 1*60*1000 /* Reset the list of XP-claimed users once a minute.*/);
    }

    private async init() : Promise<void>
    {
        this.commandHandler.useListenerHandler(this.listenerHandler);
        this.listenerHandler.setEmitters({
            commandHandler : this.commandHandler,
            listenerHandler : this.listenerHandler
        });

        //Add boolean command argument
        this.commandHandler.resolver.addType("boolean", (message, phrase) =>
        {
            //If the phrase is empty, default to false.
            if (!phrase)
            {
                return false;
            }

            //If the phrase looks to be an affirmative, return true.
            if(phrase.toUpperCase() == "YES" || phrase.toUpperCase() == "TRUE" || phrase == "1")
            {
                return true;
            }

            //If the phrase looks to be a negative, return false.
            if(phrase.toUpperCase() == "NO" || phrase.toUpperCase() == "FALSE" || phrase == "0")
            {
                return false;
            }

            //If the phrase doesn't match either of the above, return null.
            return null;
        });

        //Load all emitters and commands
        this.commandHandler.loadAll();
        this.listenerHandler.loadAll();
    }

    public async start() : Promise<string>
    {
        await this.init();
        return this.login(this.config.token);
    }

    public getRolesForUser(userToGetRolesFor : GuildMember) : Role[]
    {
        return userToGetRolesFor.roles.cache.array()
    }

    public DoesUserHaveRole(userToCheck : GuildMember, roleToCheck : Role) : boolean
    {
        return this.getRolesForUser(userToCheck).includes(roleToCheck);
    }

    public DoesUserHaveRoleAsSnowflake = (userToCheck : GuildMember, roleToCheck : Snowflake): boolean => {
        userToCheck.guild.roles.fetch(roleToCheck).then((value =>
        {
            return this.getRolesForUser(userToCheck).includes(value)
        }));

        return false;
    };

    private static clearXPUsers() : void {
        BotClient.listOfXpUsers = new Array<Snowflake>();
    }
}
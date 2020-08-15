import { AkairoClient, CommandHandler, ListenerHandler } from "discord-akairo";
import { join } from "path";
import { owners, prefix } from "../config/config";
import { Message } from "discord.js";

declare module "discord-akairo"
{
    interface AkairoClient {
        commandHandler : CommandHandler,
        listenerHandler : ListenerHandler,
    }
}

interface BotOptions {
    token? : string,
    owners? : string | string[];
}

export default class BotClient extends AkairoClient {
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
        commandUtilLifetime : 3e5,
        defaultCooldown: 6e4,
        argumentDefaults :
            {
                prompt :
                {
                    modifyStart : (_: Message, str: string): string => `$s{str}\n\nType \`cancel\` to cancel the command...`,
                    modifyRetry : (_: Message, str: string): string => `$s{str}\n\nType \`cancel\` to cancel the command...`,
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
        },
        {
            disableMentions: 'everyone'
        });

        this.config = config;
    }

    private async init() : Promise<void>
    {
        this.commandHandler.useListenerHandler(this.listenerHandler);
        this.listenerHandler.setEmitters({
            commandHandler : this.commandHandler,
            listenerHandler : this.listenerHandler,
            process
        });

        this.commandHandler.loadAll();
        this.listenerHandler.loadAll();
    }

    public async start(): Promise<string>
    {
        await this.init();
        return this.login(this.config.token);
    }
}
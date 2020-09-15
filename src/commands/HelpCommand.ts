import {Command} from "discord-akairo";
import {DMChannel, Message} from "discord.js";
import {embedColour, prefix} from "../config/config";
import {LoggerClient} from "../client/LoggerClient";

export default class HelpCommand extends Command {
    public constructor() {
        super("help",
            {
                aliases : ["help", "?", "commands"],
                category : "general",
                clientPermissions: [
                    'EMBED_LINKS',
                ],
                args : [
                    {
                        id: "command",
                        type: "commandAlias",
                        prompt: {
                            start: "Which command do you need help with?",
                            retry: "Please provide a valid command.",
                            optional: true
                        }
                    }
                ],
                description : {
                    content : "Displays help about a command, or lists commands you can access.",
                    usage : "help [command]",
                    examples :
                        [
                            `${prefix}help`,
                            `${prefix}help ping`
                        ]
                },
                ratelimit : 3
            });
    }

    public exec(message: Message, { command }) : Promise<Message>
    {
        //If a command is not given, then you can just print out a list of all commands.
        if(!command)
        {
            return this.PrintCommandList(message);
        }

        const commandWithPrefix = `${prefix}${command.toString()}`; //Typed string of the command w/ prefix.

        const helpEmbed = this.client.util.embed()
            .setColor(embedColour)
            .addField(`Chirp Help`,
                [
                    `Here's a detailed description of the command you've entered.`,
                    `If you want to view all commands available, use ${prefix}help.`
                ]);

        //Add command's description.
        helpEmbed.addField(
            commandWithPrefix,
            [
                command.description.content,
                `__Usage:__ ${command.description.usage}`,
            ]
        );

        //Add usage examples
        if(command.description.examples.length > 0)
        {
            //Add prefixes to each example
            let prefixedArray : string[] = command.description.examples;
            for(let example of prefixedArray)
            {
                example = `${prefix}${example}`;
            }

            helpEmbed.addField(
                "Command Usages",
                [
                    "Here's a few examples on how to use the command:",
                    `\`${prefixedArray.join("\`\n\`")}\``,
                ],
                true
            )
        }

        //If there's more than one alias, list those
        if(command.aliases.length > 0)
        {
            helpEmbed.addField(
                "Command Aliases",
                [
                    "You can call the command with the following:",
                    `\`${command.aliases.join("\`\n\`")}\``,
                ],
                true
            )
        }

        return message.util.send(helpEmbed);
    }

    private async PrintCommandList(message : Message) : Promise<Message>
    {
        //Create help output embed.
        const helpEmbed = this.client.util.embed()
            .setColor(embedColour)
            .addField("Chirp Help",
                [
                    "Here's a list of command sections.",
                    `To view details for a particular command, do \`${prefix}help [command]\`.`
            ]);

        //List all categories of commands to the user.
        for (const commandCategory of this.handler.categories.values())
        {
            //List of categories that should be shown to the user.
            const printableCategories =
                {
                    utils: "📝\u2000General",
                    guild: "✏\u2000Mongo Database",
                }[commandCategory.id];

            //List out the categories that should be printed
            if (printableCategories)
            {
                helpEmbed.addField(
                    printableCategories,
                    `\`${commandCategory.map(cmd => cmd.aliases[0]).join('` `')}\``
                );
            }
        }

        //If an owner asks for help, show admin commands
        if(this.client.isOwner(message.author))
        {
            //Print Admin Commands
            for (const commandCategory of this.handler.categories.values())
            {
                if (commandCategory.id == "admin")
                {
                    helpEmbed.addField(
                        "🎮\u2000Admin",
                        `\`${commandCategory.map(cmd => cmd.aliases[0]).join('` `')}\``
                    );
                }
            }
        }

        //DM the user that asked for help.
        if (!(message.channel instanceof DMChannel))
        {
            message.author.send(helpEmbed);

            //Put a message in the channel alerting about the DM.
            return message.util.send(`Check your DMs, ${message.author.tag}! I've sent you a message with general help for the bot.`);
        }
        else
        {
            return message.util.send(helpEmbed);
        }
    }
}
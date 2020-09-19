import {GuildMember} from "discord.js";
import CanvasTool, {Canvas, CanvasRenderingContext2D} from "canvas";
import {LoggerClient} from "./LoggerClient";

export default class RankCard
{
    //Card Size
    private cardWidth : number = 1000;
    private cardHeight : number = 300;

    //Colours and themes
    private bgColour : string = "#26272b";
    private outlineColour : string = "#000000";
    private textColour : string = "#f0f0f0";
    private secondTextColour : string = "#6e6e6e";
    private thirdTextColour : string = "#6e6e6e";

    //Card Canvas Object
    private rankCard : Canvas;

    public async RenderCard(cardMember: GuildMember, xpIntoLevel : number, xpRequiredForLevelUp : number, userLevel : number) : Promise<Buffer>
    {
        const highlightColour : string = cardMember.displayHexColor;

        //Create canvas object
        const cardCanvas : Canvas = CanvasTool.createCanvas(this.cardWidth, this.cardHeight);
        const ctx : CanvasRenderingContext2D = cardCanvas.getContext("2d");

        //Get member's avatar
        const userAvatar = await CanvasTool.loadImage(cardMember.user.displayAvatarURL({format: 'png'}));

        //Draw the background of the card
        ctx.fillStyle = this.bgColour;
        ctx.fillRect(0, 0, this.cardWidth, this.cardHeight);

        //Draw avatar
        //Start with a circular cutout for the avatar
        ctx.beginPath();
        ctx.arc(150, 150, 100, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.save(); //Save current clipping region of the canvas
        ctx.clip();
        //Add avatar image and create stroke circle
        ctx.drawImage(userAvatar, 50, 50, 200, 200);
        ctx.strokeStyle = this.outlineColour;
        ctx.lineWidth = 14;
        ctx.stroke();
        ctx.restore(); //Now that the canvas has been clipped and pasted we can restore the clipping region

        //Print XP string
        const xpValueString : string = this.GenerateXPString(xpIntoLevel, xpRequiredForLevelUp, userLevel);
        ctx.font = "30px opensans";
        const xpStringWidth : number = 930 - ctx.measureText(xpValueString).width;
        LoggerClient.WriteInfoLog(`XP string width is ${ctx.measureText(xpValueString).width}`);
        ctx.fillStyle = this.secondTextColour;
        ctx.fillText(xpValueString, xpStringWidth, 180);
        LoggerClient.WriteInfoLog(xpValueString);

        //Print Username String
        ctx.fillStyle = this.textColour;
        let memberUsername : string = cardMember.user.username;
        let fontSize : number = 70;
        let shortenName = false;

        //Get the width of the discriminator
        ctx.font = "35px opensans";
        const discriminatorWidth : number = ctx.measureText("#0000").width;

        //Reduce the size of the username font until it reaches an appropriate value
        //If the font size dips too low, cut characters off the username instead
        ctx.font = `${fontSize}px opensans`; //Set initial text size
        while((315 + ctx.measureText(memberUsername).width + discriminatorWidth) > xpStringWidth)
        {
            ctx.font = `${fontSize}px opensans`; //Re-scale text for width measurement
            if(fontSize > 35)
            {
                fontSize--;
            }
            else
            {
                if(!shortenName)
                {
                    //Chop off a character from the username
                    memberUsername = memberUsername.substr(0, memberUsername.length - 1);
                    shortenName = true;
                }
                else
                {
                    memberUsername = memberUsername.substr(0, memberUsername.length - 4);
                }

                //Append an ellipsis to signify the username has been shortened
                memberUsername += "...";
            }
        }
        ctx.font = `${fontSize}px opensans`;
        ctx.fillText(memberUsername, 300, 180);
        const usernameWidth : number = ctx.measureText(memberUsername).width;

        //Render discriminator
        ctx.font = "35px opensans";
        ctx.fillText(`#${cardMember.user.discriminator}`, usernameWidth + 310, 180);

        //Finally, render as a buffer and return
        return new Promise<Buffer>(async function (resolve) {
            resolve(cardCanvas.toBuffer());
        });
    }

    private GenerateXPString(intoLevel : number, levelUpVal : number, level : number) : string
    {
        let xpString : string = "";
        if(level > 500)
        {
            xpString = "MAXED";
        }
        else
        {
            //First part of the string is the xp into the level.
            if(intoLevel > 1000)
            {
                xpString += parseFloat(Math.round(((intoLevel / 1000.0) * 100.0) / 100.0).toFixed(2)) + "K";
            }
            else
            {
                xpString += intoLevel.toString();
            }
            //Add divider "/" symbol
            xpString += " / ";
            //Second part is the xp required to level up.
            if(levelUpVal > 1000)
            {
                xpString += parseFloat(Math.round(((levelUpVal / 1000.0) * 100.0) / 100.0).toFixed(2)) + "K";
            }
            else
            {
                xpString += levelUpVal.toString();
            }

            //Finally add the letters "XP" to the end
            xpString += " XP";
        }

        return xpString;
    }
}
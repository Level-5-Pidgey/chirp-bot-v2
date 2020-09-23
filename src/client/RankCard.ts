import {GuildMember} from "discord.js";
import CanvasTool, {Canvas, CanvasRenderingContext2D} from "canvas";
import {LoggerClient} from "./LoggerClient";
import {finished} from "stream";

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
    private thirdTextColour : string = "#333333";

    //Font defaults
    private defaultFontName : string = "opensans";

    public async RenderCard(cardMember: GuildMember, xpIntoLevel : number, xpRequiredForLevelUp : number, userLevel : number, leaderboardPosition : number) : Promise<Buffer>
    {
        const highlightColour : string = cardMember.roles.color == null ? this.textColour : cardMember.displayHexColor;
        const fontName : string = this.defaultFontName;

        //Create canvas object
        const cardCanvas : Canvas = CanvasTool.createCanvas(this.cardWidth, this.cardHeight);
        const ctx : CanvasRenderingContext2D = cardCanvas.getContext("2d");

        //Get member's avatar
        const userAvatar = await CanvasTool.loadImage(cardMember.user.displayAvatarURL({format: 'png'}));

        //Draw the background of the card
        ctx.fillStyle = this.bgColour;
        ctx.fillRect(0, 0, this.cardWidth, this.cardHeight);

        //Add an avatar image with border to canvas
        this.RenderAvatar(ctx, userAvatar);

        //Add username and XP to the top of the XP bar
        this.RenderXPAndUsernameText(xpIntoLevel, xpRequiredForLevelUp, userLevel, ctx, fontName, cardMember);

        //Add text telling the user's level and rank above their username
        this.RenderRankAndLevelText(userLevel, ctx, highlightColour, fontName, leaderboardPosition);

        //Render XP Bar
        this.RenderCardXPBar(ctx, userLevel, xpIntoLevel, xpRequiredForLevelUp, highlightColour);

        //Finally, render as a buffer and return
        return new Promise<Buffer>(async function (resolve) {
            resolve(cardCanvas.toBuffer());
        });
    }

    private RenderAvatar(ctx: CanvasRenderingContext2D, userAvatar)
    {
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
    }

    private RenderXPAndUsernameText(xpIntoLevel: number,
                      xpRequiredForLevelUp: number,
                      userLevel: number,
                      ctx: CanvasRenderingContext2D,
                      fontName: string,
                      cardMember: GuildMember)
    {
        //Print XP string
        const xpValueString: string = this.GenerateXPString(xpIntoLevel, xpRequiredForLevelUp, userLevel);
        ctx.font = `30px ${fontName}`;
        const xpStringWidth: number = 930 - ctx.measureText(xpValueString).width;
        ctx.fillStyle = this.secondTextColour;
        ctx.fillText(xpValueString, xpStringWidth, 180);

        //Print Username String
        ctx.fillStyle = this.textColour;
        let memberUsername: string = cardMember.user.username;
        let fontSize: number = 70;
        let shortenName = false;

        //Get the width of the discriminator
        ctx.font = `35px ${fontName}`;
        const discriminatorWidth: number = ctx.measureText("#0000").width;

        //Reduce the size of the username font until it reaches an appropriate value
        //If the font size dips too low, cut characters off the username instead
        ctx.font = `${fontSize}px ${fontName}`; //Set initial text size
        while ((315 + ctx.measureText(memberUsername).width + discriminatorWidth) > xpStringWidth) {
            ctx.font = `${fontSize}px ${fontName}`; //Re-scale text for width measurement
            if ( fontSize > 35 ) {
                fontSize--;
            } else {
                if ( !shortenName ) {
                    //Chop off a character from the username
                    memberUsername = memberUsername.substr(0, memberUsername.length - 1);
                    shortenName = true;
                } else {
                    memberUsername = memberUsername.substr(0, memberUsername.length - 4);
                }

                //Append an ellipsis to signify the username has been shortened
                memberUsername += "...";
            }
        }
        ctx.font = `${fontSize}px ${fontName}`;
        ctx.fillText(memberUsername, 300, 180);
        const usernameWidth: number = ctx.measureText(memberUsername).width;

        //Render discriminator
        ctx.font = `35px ${fontName}`;
        ctx.fillText(`#${cardMember.user.discriminator}`, usernameWidth + 310, 180);
    }

    private RenderRankAndLevelText(userLevel: number,
                      ctx: CanvasRenderingContext2D,
                      highlightColour: string,
                      fontName: string,
                      leaderboardPosition: number)
    {
        //Calculate Level Text
        let levelText: string = "";
        if ( userLevel > 500 ) {
            levelText = "MAX"
        } else {
            const playerLevelRounded: number = userLevel % 100;
            if ( playerLevelRounded == 0 ) {
                levelText = "100";
            } else {
                levelText = playerLevelRounded.toString();
            }
        }
        ctx.fillStyle = highlightColour;
        //Get widths of the "LEVEL " string as well as the level number
        ctx.font = `30px ${fontName}`;
        const levelTextWidth: number = ctx.measureText(`LEVEL `).width;
        ctx.font = `70px ${fontName}`;
        const levelNumTextWidth: number = ctx.measureText(levelText).width;
        const levelTextPos: number = 930 - (levelTextWidth + levelNumTextWidth);

        //Now Render the level text
        ctx.font = `30px ${fontName}`;
        ctx.fillText("LEVEL ", levelTextPos, 100);
        ctx.font = `70px ${fontName}`;
        ctx.fillText(levelText, levelTextPos + 100, 100);

        //Calculate Leaderboard Position
        ctx.fillStyle = this.textColour;
        ctx.font = `30px ${fontName}`;
        const leaderboardTextWidth: number = ctx.measureText("RANK ").width;
        ctx.font = `70px ${fontName}`;
        const leaderboardNumberWidth: number = ctx.measureText(`#${leaderboardPosition}`).width;
        const leaderboardTextPos: number = levelTextPos - (leaderboardTextWidth + leaderboardNumberWidth) - 20;

        //Now Render the leaderboard text
        ctx.font = `30px ${fontName}`;
        ctx.fillText("RANK ", leaderboardTextPos, 100);
        ctx.font = `70px ${fontName}`;
        ctx.fillText(`#${leaderboardPosition}`, leaderboardTextPos + 90, 100);
    }

    private RenderCardXPBar(ctx: CanvasRenderingContext2D,
                      userLevel: number,
                      xpIntoLevel: number,
                      xpRequiredForLevelUp: number,
                      highlightColour: string)
    {
        //XP Bar Background
        ctx.lineWidth = 4;
        ctx.strokeStyle = this.outlineColour;
        ctx.fillStyle = this.secondTextColour;
        this.CreateRoundedRect(ctx, 294, 204, 640, 32, 10, true, false);
        //XP Bar itself
        const filledWidth: number = userLevel > 500 ? 640 : Math.round((xpIntoLevel / xpRequiredForLevelUp) * 640);
        if ( filledWidth > 1 ) {
            ctx.fillStyle = highlightColour;
            this.CreateRoundedRect(ctx, 294, 204, filledWidth, 32, 5, true, false);
        }

        //Create separating lines on the XP bar to make progress easier to read
        //Think like the HP Bars in League of Legends
        this.CreateXPBarSeparators(ctx, xpRequiredForLevelUp);

        //Render stroke over bar
        this.CreateRoundedRect(ctx, 294, 204, 640, 32, 10, false, true);
    }

    private CreateXPBarSeparators(ctx: CanvasRenderingContext2D, xpRequiredForLevelUp: number)
    {

        ctx.globalAlpha = 0.4;
        ctx.fillStyle = this.thirdTextColour;
        let separatorX: number = 294.0;
        let separatorHeight: number = 0;
        let separatorCount: number = 0;

        if ( xpRequiredForLevelUp <= 1000 ) {
            separatorCount = (xpRequiredForLevelUp / 100);

            for (let i: number = 0; i < separatorCount; i++) {
                separatorX += 640 / separatorCount;
                if ( separatorX < 934 ) //Display separators until the end of the bar area
                {
                    ctx.fillRect(Math.round(separatorX), 204, 5, 12);
                }
            }
        } else if ( xpRequiredForLevelUp < 3000 ) {
            separatorCount = (xpRequiredForLevelUp / 1000);
            let smallSeparatorCount = (separatorCount * 10);

            for (let i: number = 0; i < smallSeparatorCount; i++) {
                if ( (i + 1) % 10 == 0 ) {
                    separatorHeight = 32;
                } else {
                    separatorHeight = 12;
                }

                separatorX += 640 / smallSeparatorCount;

                if ( separatorX < 934 ) {
                    ctx.fillRect(Math.round(separatorX), 204, 5, separatorHeight);
                }
            }
        } else if ( xpRequiredForLevelUp < 10000 ) {
            separatorCount = (xpRequiredForLevelUp / 1000);
            let smallSeparatorCount = (separatorCount * 4);

            for (let i: number = 0; i < smallSeparatorCount; i++) {
                if ( (i + 1) % 4 == 0 ) {
                    separatorHeight = 32;
                } else {
                    separatorHeight = 12;
                }

                separatorX += 640 / smallSeparatorCount;

                if ( separatorX < 934 ) {
                    ctx.fillRect(Math.round(separatorX), 204, 5, separatorHeight);
                }
            }
        } else if ( xpRequiredForLevelUp < 30000 ) {
            separatorCount = (xpRequiredForLevelUp / 10000);
            let smallSeparatorCount = (separatorCount * 10);

            for (let i: number = 0; i < smallSeparatorCount; i++) {
                if ( (i + 1) % 10 == 0 ) {
                    separatorHeight = 32;
                } else {
                    separatorHeight = 12;
                }

                separatorX += 640 / smallSeparatorCount;

                if ( separatorX < 934 ) {
                    ctx.fillRect(Math.round(separatorX), 204, 5, separatorHeight);
                }
            }
        } else {
            separatorCount = (xpRequiredForLevelUp / 10000);
            let smallSeparatorCount = (separatorCount * 4);

            for (let i: number = 0; i < smallSeparatorCount; i++) {
                if ( (i + 1) % 4 == 0 ) {
                    separatorHeight = 32;
                } else {
                    separatorHeight = 12;
                }

                separatorX += 640 / smallSeparatorCount;

                if ( separatorX < 934 ) {
                    ctx.fillRect(Math.round(separatorX), 204, 5, separatorHeight);
                }
            }
        }
        ctx.globalAlpha = 1.0;
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
                xpString += parseFloat((((intoLevel / 1000.0) * 100.0) / 100.0).toFixed(2)) + "K";
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
                xpString += parseFloat((((levelUpVal / 1000.0) * 100.0) / 100.0).toFixed(2)) + "K";
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

    //Credit to Juan Mendes
    //https://stackoverflow.com/a/3368118
    private CreateRoundedRect(ctx : CanvasRenderingContext2D, x : number, y : number, width : number, height : number, radius? : number, fill? : boolean, stroke? : boolean)
    {
        //Create Radius Object
        let radObj = radius != null ? radius : 0;

        //Create Path
        ctx.beginPath();
        ctx.moveTo(x + radObj, y);
        ctx.lineTo(x + width - radObj, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radObj);
        ctx.lineTo(x + width, y + height - radObj);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radObj, y + height);
        ctx.lineTo(x + radObj, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radObj);
        ctx.lineTo(x, y + radObj);
        ctx.quadraticCurveTo(x, y, x + radObj, y);
        ctx.closePath();

        //Fill or add stroke if enabled
        if(fill)
        {
            ctx.fill();
        }

        if(stroke)
        {
            ctx.stroke();
        }
    }
}
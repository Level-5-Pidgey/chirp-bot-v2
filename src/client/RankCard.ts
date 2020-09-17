import {GuildMember} from "discord.js";
import CanvasTool, {Canvas, CanvasRenderingContext2D} from "canvas";

export default class RankCard
{
    private cardWidth : number = 1000;
    private cardHeight : number = 300;

    constructor(cardMember: GuildMember)
    {
        const cardCanvas : Canvas = CanvasTool.createCanvas(this.cardWidth, this.cardHeight);
        const ctx : CanvasRenderingContext2D = cardCanvas.getContext("2d");

    }
}
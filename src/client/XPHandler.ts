import { GuildMember } from "discord.js";
import { GuildUserModel } from "../mongo/models/GuildUser";

export default class XPHandler
{
    public async ModifyXP(memberToChange : GuildMember, preMultiAmount : number, applyMultipliers : boolean) : Promise<boolean>
    {
        let amountToModify : number = preMultiAmount;
        if(applyMultipliers) //If the multipliers apply, calculate the final amount by the roles of the user
        {
            amountToModify *= 1.0;
        }

        return await GuildUserModel.updateOne({ userID: memberToChange.id }, { $inc : { totalXP: amountToModify } }, {new : true, upsert: true});
    }
}
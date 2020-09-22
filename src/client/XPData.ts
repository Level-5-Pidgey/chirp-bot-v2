

export default class XPData
{
    private _userLevel : number = 1;
    private _userXP : number = 0;

    public get userXP() : number
    {
        return this._userXP;
    }

    public set userXP(userXP : number)
    {
        this._userXP = userXP;
    }

    public get userLevel() : number
    {
        return this.GetLevelFromXP(this.userXP);
    }

    public get xpIntoLevel() : number
    {
        return this.GetXPIntoLevel(this.userXP);
    }

    public get xpUntilLevel() : number
    {
        return this.GetXPToNext(this.userXP);
    }

    public get xpToLevel() : number
    {
        return this.GetXPToNextLevelValue(this.userLevel + 1);
    }

    constructor(userTotalXP : number)
    {
        //Fill out XP Variable
        this.userXP = userTotalXP;
    }

    public GetTotalXPRequiredForLevel(levelNum : number) : number
    {
        let result: number = 0;

        for (let i = 1; i < levelNum; i++) {
            if(i <= 100)
            {
                result += this.GetXPToNextLevelValue(i);
            }
            else
            {
                //After level 100, the xp per level should cap out.
                //Prevent any more exponential shenanigans and keep the XP requirement per level fair
                result += this.GetXPToNextLevelValue(100);
            }
        }

        return result;
    }

    private GetXPToNextLevelValue(levelNum: number): number
    {
        const levelVal : number = Math.min(levelNum, 100);

        return Math.floor((4.0 * (levelVal / 8.0)) *
            (Math.pow(levelVal, (3.0 / 2.0))) +
            350);
    }

    private GetXPToNext(totalXP : number): number
    {
        let userLevel : number = this.GetLevelFromXP(totalXP);
        const xpTotalForNext: number = this.GetTotalXPRequiredForLevel(userLevel + 1);

        return xpTotalForNext - totalXP;
    }

    private GetXPIntoLevel(totalXP : number): number
    {
        let userLevel : number = this.GetLevelFromXP(totalXP);
        const xpTotalLevel: number = this.GetTotalXPRequiredForLevel(userLevel);

        return totalXP - xpTotalLevel;
    }

    private GetLevelFromXP(totalXP : number) : number
    {
        let result: number = 0;

        while (totalXP >= this.GetTotalXPRequiredForLevel(result + 1)) {
            result++;
        }

        //Increment the result by one, since you can't really be "level 0".
        return result;
    }
}
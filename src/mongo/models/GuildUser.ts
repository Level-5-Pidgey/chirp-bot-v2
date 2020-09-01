import { prop, getModelForClass } from '@typegoose/typegoose';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export class GuildUser {
    @prop({ unique: true, required: true })
    public userID: string;

    @prop({ default : 0 })
    public totalXP : number;
}

export const GuildUserModel = getModelForClass(GuildUser, { schemaOptions: { timestamps: true } });
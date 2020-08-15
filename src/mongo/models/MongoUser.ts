import {mongoose, Schema, model} from "mongoose";
var uniqueVal = require("mongoose-unique-validator");

const UserSchema = Schema(
    {
        userID: {
            required: true,
            unique: true,
            type: String
        },
        lastMessageDate: Date,
        totalXP: {
            type: Schema.Types.Decimal128,
            default: 0.0
        }
    }
);

UserSchema.plugin(uniqueVal);

export default model("MongoUser", UserSchema, "users");

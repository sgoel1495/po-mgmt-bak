import {config} from "../config/index.js";
import {TokenService} from "./token.js";
import db from "../config/mongoConnection.js";

const collection = db.collection('tokens');

export const TokenCollection = collection

export class AuthService {

    static tokenService = null;

    static init() {
        AuthService.tokenService = new TokenService(config.secret, "test.com");
    }

    static async ValidateAccessToken(accessToken) {
        let userId = await AuthService.tokenService.VerifyAccessToken(accessToken);
        let token = await collection.findOne({accessToken: accessToken});
        if (!token) {
            throw Error('Invalid access token');
        }
        return token && token.userId === userId;
    }


    static async CreateUserToken(userId) {
        let userToken = await AuthService.tokenService.GenerateToken(userId);
        let token = await collection.updateOne({userId}, {$set: {accessToken: userToken.accessToken}}, {upsert: true});
        return userToken;
    }

}
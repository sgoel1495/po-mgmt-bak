import jwt from "jsonwebtoken";

function signToken(userId, secret, issuer) {
    return new Promise((resolve, reject) => {
        const options = {
            issuer,
            audience: userId
        };
        jwt.sign({}, secret, options, (err, token) => {
            if (err) {
                reject({isError: true, message: "Unable to create token"});
            } else {
                resolve(token);
            }
        });
    });
}

async function verifyToken(authToken, secret, issuer) {
    const options = {
        issuer
    };
    if (!authToken)
        throw "No Authorization Token Found";

    let payload = jwt.verify(authToken, secret, options);
    if (new Date(payload.exp * 1000) < new Date()) {
        throw "Token Expired";
    }
    return payload.aud;

}


export class TokenService {
    constructor(secret, issuer) {
        this.secret = secret;
        this.issuer = issuer;
    }

    GenerateToken = async (userId) => {
        const accessToken = await signToken(userId, this.secret, this.issuer)
        return {
            accessToken: accessToken,
        };
    };

    VerifyRefreshToken = (authToken) => {
        return verifyToken(authToken, this.secret, this.issuer);
    };
    VerifyAccessToken = (authToken) => {
        return verifyToken(authToken, this.secret, this.issuer);
    };
    SignAccessToken = (userId) => {
        return signToken(userId, this.secret, this.issuer);
    };
}




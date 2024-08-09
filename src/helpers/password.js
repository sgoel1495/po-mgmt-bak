import crypto from 'crypto'
export const IsValidPassword = (password, hash, salt) => {
    let hashVerify = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return hash === hashVerify;
}

export const HashPassword = (password) => {
    let salt = crypto.randomBytes(32).toString("hex");
    let genHash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
    return {
        salt: salt,
        password: genHash,
    }
}
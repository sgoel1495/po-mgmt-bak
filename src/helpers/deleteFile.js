import {config} from "../config/index.js";
import * as fs from "node:fs";

export default async function deleteFile(fileName) {
    const storedFileUrl = new URL(fileName, config.uploadDirectoryUrl);
    fs.unlinkSync(storedFileUrl);
    return true;
}
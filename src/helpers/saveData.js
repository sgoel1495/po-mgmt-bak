import {config} from "../config/index.js";
import fs from "fs";

export const saveData = async (data, filename) => {
    const storedFileUrl = new URL(filename, config.uploadDirectoryUrl);
    fs.writeFileSync(storedFileUrl, data);
}
import {config} from "../config/index.js";
import {createWriteStream, unlink} from "node:fs";

export default async function saveFile(upload, fileName) {
    const {createReadStream, filename} = await upload;
    const stream = createReadStream();
    let ext = filename.split(".");
    ext = ext[ext.length - 1];
    const fullFilename = fileName + "." + ext;
    const storedFileUrl = new URL(fullFilename, config.uploadDirectoryUrl);
    // Store the file in the filesystem.
    await new Promise((resolve, reject) => {
        // Create a stream to which the upload will be written.
        const writeStream = createWriteStream(storedFileUrl);

        // When the upload is fully written, resolve the promise.
        writeStream.on("finish", resolve);

        // If there's an error writing the file, remove the partially written file
        // and reject the promise.
        writeStream.on("error", (error) => {
            unlink(storedFileUrl, () => {
                reject(error);
            });
        });

        // In Node.js <= v13, errors are not automatically propagated between piped
        // streams. If there is an error receiving the upload, destroy the write
        // stream with the corresponding error.
        stream.on("error", (error) => writeStream.destroy(error));

        // Pipe the upload into the write stream.
        stream.pipe(writeStream);
    });

    return fullFilename;
}
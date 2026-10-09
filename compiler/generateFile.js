import { promises as fs } from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';

const dirCodes = path.join(path.resolve(), 'codes');

export const generateFile = async (format, content) => {
    const jobID = uuid();
    const filename = `${jobID}.${format}`;
    const filePath = path.join(dirCodes, filename);

    try {
        await fs.mkdir(dirCodes, { recursive: true }); // ensures folder exists
        await fs.writeFile(filePath, content);         // async write
        return { filepath: filePath, uuid: jobID };

    } catch (err) {
        console.error("Error writing file:", err);
        throw err;
    }
};


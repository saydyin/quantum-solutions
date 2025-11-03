
const EOM_DELIMITER = "1111111111111110"; // 15 ones and a zero

/**
 * Converts a string message to its binary representation.
 * @param message The string to convert.
 * @returns A string of binary data.
 */
function messageToBinary(message: string): string {
    return message.split('').map(char => {
        return char.charCodeAt(0).toString(2).padStart(16, '0');
    }).join('');
}

/**
 * Converts a binary string back to a regular string.
 * @param binary The binary string to convert.
 * @returns The decoded string.
 */
function binaryToMessage(binary: string): string {
    let message = '';
    for (let i = 0; i < binary.length; i += 16) {
        const chunk = binary.slice(i, i + 16);
        if (chunk.length < 16) continue;
        message += String.fromCharCode(parseInt(chunk, 2));
    }
    return message;
}

/**
 * Sets the least significant bit of a number.
 * @param value The number to modify.
 * @param bit The bit to set (0 or 1).
 * @returns The modified number.
 */
function setLSB(value: number, bit: '0' | '1'): number {
    if (bit === '1') {
        return value | 1; // Set LSB to 1
    }
    return value & ~1; // Set LSB to 0
}

/**
 * Gets the least significant bit of a number.
 * @param value The number to read from.
 * @returns '0' or '1'.
 */
function getLSB(value: number): string {
    return (value & 1).toString();
}

/**
 * Hides a secret message within the pixel data of an image.
 * @param context The 2D rendering context of the canvas with the cover image.
 * @param message The secret message to hide.
 * @returns The new ImageData with the message embedded.
 */
export function encodeMessageInImage(context: CanvasRenderingContext2D, message: string): ImageData {
    const { width, height } = context.canvas;
    const imageData = context.getImageData(0, 0, width, height);
    const pixelData = imageData.data;

    const binaryMessage = messageToBinary(message) + EOM_DELIMITER;

    if (binaryMessage.length > pixelData.length / 4 * 3) { // Use only R, G, B channels
        throw new Error("Message is too long to be hidden in this image.");
    }

    let dataIndex = 0;
    for (let i = 0; i < binaryMessage.length; i++) {
        const bit = binaryMessage[i] as '0' | '1';
        pixelData[dataIndex] = setLSB(pixelData[dataIndex], bit);

        // Skip to the next R, G, or B channel, avoiding the Alpha channel
        if ((dataIndex + 1) % 4 === 3) {
            dataIndex += 2; // Skip A and go to next R
        } else {
            dataIndex += 1;
        }
    }
    
    return imageData;
}

/**
 * Reveals a hidden message from an image's pixel data.
 * @param context The 2D rendering context of the canvas with the stego image.
 * @returns The revealed secret message.
 */
export function decodeMessageFromImage(context: CanvasRenderingContext2D): string {
    const { width, height } = context.canvas;
    const imageData = context.getImageData(0, 0, width, height);
    const pixelData = imageData.data;

    let binaryMessage = '';
    for (let i = 0; i < pixelData.length; i++) {
        // Skip the alpha channel
        if ((i + 1) % 4 === 0) continue;

        binaryMessage += getLSB(pixelData[i]);

        // Check if we found the EOM delimiter
        if (binaryMessage.endsWith(EOM_DELIMITER)) {
            const finalMessage = binaryMessage.slice(0, -EOM_DELIMITER.length);
            return binaryToMessage(finalMessage);
        }
    }

    throw new Error("No hidden message found or message is corrupted (EOM delimiter not found).");
}

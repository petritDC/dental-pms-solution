"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
exports.validateAndNormalizeImage = validateAndNormalizeImage;
const sharp_1 = __importDefault(require("sharp"));
class HttpError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }
}
exports.HttpError = HttpError;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MIN_W = 800;
const MIN_H = 800;
async function validateAndNormalizeImage(input) {
    // `file-type` is ESM-only; use dynamic import so this project can compile to CJS cleanly.
    const { fileTypeFromBuffer } = await Promise.resolve().then(() => __importStar(require("file-type")));
    const type = await fileTypeFromBuffer(input);
    const mime = type?.mime;
    if (!mime || !ALLOWED_MIME.has(mime)) {
        throw new HttpError(415, "UNSUPPORTED_MEDIA_TYPE", "Unsupported image type. Allowed: image/jpeg, image/png, image/webp", { detectedMime: mime ?? null });
    }
    let img = (0, sharp_1.default)(input, { failOnError: true });
    // rotate by EXIF (if present) and ensure decoding doesn't throw for corrupt inputs
    img = img.rotate();
    let meta;
    try {
        meta = await img.metadata();
    }
    catch (err) {
        throw new HttpError(422, "CORRUPT_IMAGE", "Image could not be decoded (possibly corrupt)", {
            cause: err instanceof Error ? err.message : String(err)
        });
    }
    const width = meta.width ?? 0;
    const height = meta.height ?? 0;
    if (!width || !height) {
        throw new HttpError(422, "INVALID_IMAGE", "Image metadata missing width/height");
    }
    if (width < MIN_W || height < MIN_H) {
        throw new HttpError(422, "LOW_RESOLUTION", `Image resolution too small. Minimum is ${MIN_W}x${MIN_H}`, {
            width,
            height
        });
    }
    let normalizedJpeg;
    try {
        normalizedJpeg = await img.jpeg({ quality: 92 }).toBuffer();
    }
    catch (err) {
        throw new HttpError(422, "NORMALIZATION_FAILED", "Failed to normalize image to JPEG", {
            cause: err instanceof Error ? err.message : String(err)
        });
    }
    return { mime: mime, width, height, normalizedJpeg };
}

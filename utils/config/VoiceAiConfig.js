import { GROQ_API_KEY } from './aiConfig';

export const VOICE_AI_CONFIG = {
    GROQ_API_URL: "https://api.groq.com/openai/v1/audio/transcriptions",
    GROQ_API_KEY: GROQ_API_KEY,
    WHISPER_MODEL: "whisper-large-v3-turbo",
    RESPONSE_FORMAT: "verbose_json"
}; 
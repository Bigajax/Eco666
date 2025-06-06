// server/services/elevenlabsService.ts
import { ElevenLabsClient } from 'elevenlabs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs/promises';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const apiKey = process.env.ELEVENLABS_API_KEY;

if (!apiKey) {
    console.error('Erro: A chave de API do Eleven Labs não foi encontrada nas variáveis de ambiente.');
}

const elevenlabs = new ElevenLabsClient({
    apiKey: apiKey,
});

const ECO_VOICE_ID = '21m00Tzpb8CflqYdJpP1';

export const textToSpeech = async (text: string): Promise<NodeJS.ReadableStream> => {
    if (!apiKey) {
        throw new Error('Eleven Labs API Key não configurada.');
    }
    console.log('Convertendo texto para fala com Eleven Labs...');
    try {
        const audio = await elevenlabs.generate({
            voice: ECO_VOICE_ID,
            text: text,
            model_id: "eleven_multilingual_v2",
        });
        return audio;
    } catch (error) {
        console.error('Erro ao converter texto para fala com Eleven Labs:', error);
        throw error;
    }
};

export const speechToText = async (audioBuffer: Buffer, mimeType: string): Promise<string> => {
    if (!apiKey) {
        throw new Error('Eleven Labs API Key não configurada.');
    }
    console.log('Convertendo fala para texto com Eleven Labs...');
    try {
        const transcription = await elevenlabs.speechToText.convert({
            file: new Blob([audioBuffer], { type: mimeType }),
            model_id: "eleven_multilingual_v2", // ADDED: Required for Speech-to-Text conversion
        });
        return transcription.text;
    } catch (error) {
        console.error('Erro ao converter fala para texto com Eleven Labs:', error);
        throw error;
    }
};
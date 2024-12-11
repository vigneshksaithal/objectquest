import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import OpenAI from 'openai';
import { OPENAI_API_KEY } from '$env/static/private';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY
});

function getDateString() {
    const date = new Date();
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

async function getDailyObject() {
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a creative object generator for a guessing game. Generate a single everyday object that people would recognize.
                    Rules:
                    1. Choose objects that are physical and tangible
                    2. Avoid abstract concepts or ideas
                    3. Pick something that exists in most households or is commonly known
                    4. The object should be a single word, no spaces
                    5. The object should be interesting enough to describe with multiple clues
                    6. Avoid very simple objects like 'pen' or very complex ones like 'supercomputer'
                    
                    Respond with just the object name in uppercase, nothing else.`
                }
            ],
            temperature: 0.8,
            max_tokens: 10
        });

        return completion.choices[0].message.content?.trim().toUpperCase() || 'CAMERA';
    } catch (error) {
        console.error('Error generating object:', error);
        return 'CAMERA'; // Fallback object
    }
}

export const GET: RequestHandler = async () => {
    const dateStr = getDateString();
    const word = await getDailyObject();
    
    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: `You are a creative clue generator for an object guessing game. Generate 5 clues for the object "${word}". 
                    The clues should start very abstract and become progressively more specific.
                    Clue 1: Should be about its general purpose or category
                    Clue 2: Should describe how people interact with it
                    Clue 3: Should mention a distinctive feature or characteristic
                    Clue 4: Should give a more specific physical description
                    Clue 5: Should be quite specific but still not give it away completely
                    
                    Each clue should be a single sentence.
                    Don't mention the object's name or too obvious characteristics in early clues.
                    Format the response as a JSON array of strings.`
                }
            ],
            response_format: {json_schema: {type: "array", items: {type: "string"}}},
            temperature: 0.7
        });

        const cluesResponse = completion.choices[0].message.content;
        let clues: string[];
        
        try {
            clues = JSON.parse(cluesResponse || '[]');
        } catch {
            clues = cluesResponse?.split('\n').filter(c => c.trim()) || [];
        }

        // Ensure we have exactly 5 clues
        while (clues.length < 5) {
            clues.push(`This object starts with the letter ${word[0]}`);
        }
        clues = clues.slice(0, 5);

        return json({
            date: dateStr,
            clues,
            word
        });
    } catch (error) {
        console.error('Error generating clues:', error);
        return json({
            date: dateStr,
            clues: [
                "I am something you might use every day",
                "People interact with me to capture moments",
                "I have a special eye-like feature",
                `I start with the letter ${word[0]}`,
                `I am ${word.length} letters long`
            ],
            word
        });
    }
};

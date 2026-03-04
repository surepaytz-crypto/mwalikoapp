'use server';
/**
 * @fileOverview An AI assistant flow for generating elegant and engaging event descriptions in both English and Swahili.
 *
 * - writeEventDescription - A function that handles the generation of event descriptions.
 * - EventDescriptionInput - The input type for the writeEventDescription function.
 * - EventDescriptionOutput - The return type for the writeEventDescription function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EventDescriptionInputSchema = z.object({
  eventType: z.string().describe('The type of the event (e.g., Gala Dinner, Product Launch, Wedding).'),
  theme: z.string().describe('The theme of the event (e.g., "Enchanted Forest", "Roaring Twenties").'),
  venue: z.string().describe('The name of the event venue.'),
  guestCapacity: z.number().describe('The maximum number of guests the event can accommodate.'),
});
export type EventDescriptionInput = z.infer<typeof EventDescriptionInputSchema>;

const EventDescriptionOutputSchema = z.object({
  englishDescription: z.string().describe('An elegant and engaging description of the event in English.'),
  swahiliDescription: z.string().describe('An elegant and engaging description of the event in Swahili.'),
});
export type EventDescriptionOutput = z.infer<typeof EventDescriptionOutputSchema>;

export async function writeEventDescription(input: EventDescriptionInput): Promise<EventDescriptionOutput> {
  return aiEventDescriptionWriterFlow(input);
}

const prompt = ai.definePrompt({
  name: 'eventDescriptionGeneratorPrompt',
  input: {schema: EventDescriptionInputSchema},
  output: {schema: EventDescriptionOutputSchema},
  prompt: `You are an expert event content writer specializing in creating luxurious and engaging event descriptions.
Your task is to generate two distinct descriptions for an event, one in English and one in Swahili, based on the provided details.
Both descriptions must convey an elegant, sophisticated, and luxurious tone, aiming to attract discerning guests.

Event Details:
- Event Type: {{{eventType}}}
- Theme: {{{theme}}}
- Venue: {{{venue}}}
- Guest Capacity: {{{guestCapacity}}}

Please provide the output as a JSON object with two fields: 'englishDescription' and 'swahiliDescription'.
Ensure the language is natural and compelling for each respective audience.`,
});

const aiEventDescriptionWriterFlow = ai.defineFlow(
  {
    name: 'aiEventDescriptionWriterFlow',
    inputSchema: EventDescriptionInputSchema,
    outputSchema: EventDescriptionOutputSchema,
  },
  async (input) => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate event descriptions.');
    }
    return output;
  }
);

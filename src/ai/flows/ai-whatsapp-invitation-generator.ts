'use server';
/**
 * @fileOverview This file implements a Genkit flow for generating personalized WhatsApp invitation messages
 * and visually appealing invitation card templates.
 *
 * - aiWhatsappInvitationGenerator - The main function to trigger the AI generation.
 * - AiWhatsappInvitationGeneratorInput - The input type for the generator.
 * - AiWhatsappInvitationGeneratorOutput - The return type for the generator.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';

// Define the input schema for the AI invitation generator
const AiWhatsappInvitationGeneratorInputSchema = z.object({
  eventName: z.string().describe('The name of the event.'),
  eventType: z.string().describe('The type of the event (e.g., Wedding, Birthday, Conference, Gala Dinner).'),
  eventDate: z.string().describe('The date of the event in a readable format (e.g., "October 26, 2024").'),
  eventTime: z.string().describe('The time of the event (e.g., "7:00 PM EST").'),
  eventVenue: z.string().describe('The venue or location of the event.'),
  guestName: z.string().describe('The name of the guest to personalize the invitation for.'),
  desiredTone: z.string().describe('The desired tone for the invitation (e.g., "formal", "casual", "luxurious", "playful").'),
  brandingDescription: z.string().describe('A description of the custom branding, including colors, fonts, and overall style (e.g., "Our brand uses elegant gold and deep charcoal colors with a modern serif font Playfair Display, and body text with Open Sans.").'),
  thematicElements: z.string().describe('A description of thematic elements or decor (e.g., "tropical beach, vintage glamour, futuristic tech, lush floral arrangements").'),
  qrCodeImage: z
    .string()
    .describe(
      "A QR code image as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AiWhatsappInvitationGeneratorInput = z.infer<typeof AiWhatsappInvitationGeneratorInputSchema>;

// Define the output schema for the AI invitation generator
const AiWhatsappInvitationGeneratorOutputSchema = z.object({
  whatsappMessage: z.string().describe('The personalized WhatsApp invitation message.'),
  invitationCardImageUrl: z.string().describe('The data URI of the visually appealing invitation card image, with the QR code integrated.'),
});
export type AiWhatsappInvitationGeneratorOutput = z.infer<typeof AiWhatsappInvitationGeneratorOutputSchema>;

export async function aiWhatsappInvitationGenerator(
  input: AiWhatsappInvitationGeneratorInput
): Promise<AiWhatsappInvitationGeneratorOutput> {
  return aiWhatsappInvitationGeneratorFlow(input);
}

// Prompt to generate the WhatsApp message and a description for the invitation card image
const generateWhatsappInvitationContentPrompt = ai.definePrompt({
  name: 'generateWhatsappInvitationContentPrompt',
  input: { schema: AiWhatsappInvitationGeneratorInputSchema },
  output: {
    schema: z.object({
      whatsappMessage: z.string().describe('The personalized WhatsApp invitation message.'),
      invitationCardDescription: z.string().describe('A detailed text description for generating the invitation card image, including design, colors, thematic elements, and explicit instructions for an elegant QR code placement area.'),
    }),
  },
  prompt: `You are an AI assistant specializing in creating luxurious and personalized event invitations.\nYour task is to generate a personalized WhatsApp invitation message and a detailed description for an invitation card image based on the provided event details.\n\nEvent Details:\n- Event Name: {{{eventName}}}\n- Event Type: {{{eventType}}}\n- Event Date: {{{eventDate}}}\n- Event Time: {{{eventTime}}}\n- Event Venue: {{{eventVenue}}}\n- Guest Name: {{{guestName}}}\n- Desired Tone: {{{desiredTone}}}\n- Branding Description: {{{brandingDescription}}}\n- Thematic Elements: {{{thematicElements}}}\n\nGuidelines:\n1.  **WhatsApp Message**: Craft a warm, personalized, and engaging WhatsApp message for "Guest Name: {{{guestName}}}", maintaining a '{{desiredTone}}' tone. Ensure it includes all key event details (name, type, date, time, venue) and a clear call to action for RSVP. Emphasize the luxurious aspect of the '{{eventType}}' for '{{eventName}}'.\n2.  **Invitation Card Description**: Create a highly detailed textual prompt for an image generation AI. This description should capture the essence of a visually appealing, luxurious invitation card.\n    *   The card is for a '{{eventType}}' event named '{{eventName}}'.\n    *   The design must strictly follow the '{{brandingDescription}}' for colors, fonts, and overall style. Use 'Playfair Display' for headlines and 'Open Sans' for body text.\n    *   Integrate '{{thematicElements}}' to set a luxurious and sophisticated mood and visual style.\n    *   Explicitly describe a prominent, elegant, and clear rectangular space for a QR code within the card design. Describe its ideal placement (e.g., "in the bottom right corner", "subtly integrated into a border element", "a clear, unobstructed section") to ensure functionality and aesthetic harmony.\n    *   The overall aesthetic should be opulent, sophisticated, and reflective of a premium experience.\n    *   Example Description for AI: "A luxurious digital invitation card for the '{{eventName}}'. The design features a deep charcoal background with elegant gold accents and intricate patterns. The event name '{{eventName}}' is displayed prominently as a headline in 'Playfair Display'. Event details like date, time, and venue are presented clearly in 'Open Sans'. A dedicated, clean rectangular space for a QR code is gracefully positioned in the bottom-right corner, subtly framed by a gold border. Thematic elements include lush floral arrangements in muted gold tones and subtle metallic textures. The overall impression is one of high-end sophistication and exclusive elegance."`
});

const aiWhatsappInvitationGeneratorFlow = ai.defineFlow(
  {
    name: 'aiWhatsappInvitationGeneratorFlow',
    inputSchema: AiWhatsappInvitationGeneratorInputSchema,
    outputSchema: AiWhatsappInvitationGeneratorOutputSchema,
  },
  async (input) => {
    // Step 1: Generate the WhatsApp message and the image generation description
    const { output: contentOutput } = await generateWhatsappInvitationContentPrompt(input);
    const { whatsappMessage, invitationCardDescription } = contentOutput!;

    // Step 2: Generate the invitation card image, composing the QR code onto the described design
    // Using gemini-2.5-flash-image for image composition and generation.
    const { media } = await ai.generate({
      model: googleAI.model('gemini-2.5-flash-image'),
      prompt: [
        { text: invitationCardDescription }, // The description of the base card with a QR code area
        {
          media: {
            url: input.qrCodeImage,
            // The contentType is technically part of the data URI, but specifying it
            // explicitly here can help the model interpret it correctly.
            contentType: 'image/png', // Assuming QR codes are typically PNGs.
          },
        },
        { text: "Integrate the provided QR code image into the invitation card design as described. Ensure it is clearly visible and functional, placed precisely in the designated elegant space described for the QR code, within the overall luxurious aesthetic. Do not generate a new QR code; use the provided image." }
      ],
      config: {
        responseModalities: ['TEXT', 'IMAGE'], // Request both text (for potential debugging/confirmation) and the image.
      },
    });

    if (!media) {
      throw new Error('Failed to generate invitation card image.');
    }

    const invitationCardImageUrl = media.url; // This will be the data URI of the generated image

    return {
      whatsappMessage,
      invitationCardImageUrl,
    };
  }
);

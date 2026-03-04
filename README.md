# Mwaliko App - Premium Event Invitations & Security

Mwaliko is a luxurious event management platform designed for high-end weddings, galas, and corporate events. It combines elegant AI-powered invitations with a robust 3-point security scanning system.

## 🌟 Core Features

### 1. Administrative Dashboard
- **Auto-Generated Ticket IDs**: Import a guest list via CSV; the system automatically generates unique 5-character secure IDs.
- **3-Point Logic**: Track guest attendance across three distinct checkpoints: **Gate, Drinks, and Food**.
- **Real-time Analytics**: Monitor "Scanned vs. Invited" (X/Y) statistics for every category (VIP, Standard, etc.).
- **High-End Reporting**: Generate professional, print-ready PDF reports with color-coded attendance lists.

### 2. Invitation Center
- **10 Premium Templates**: Choose from elegant floral, royal gold, and traditional African-inspired designs.
- **AI Card Generation**: Uses Google Gemini to render high-resolution invitation images with integrated QR codes.
- **Live Inline Editor**: Modify event details, host names, and RSVP text with an instant live preview.
- **Omnichannel Sharing**: Personalized Swahili/English WhatsApp messages with bundled invitation images.

### 3. Scanner Staff Portal
- **Role-Based Access**: Staff accounts land directly on the scanner interface for speed and focus.
- **Real-Time QR Verification**: High-performance scanning using `jsQR` for instant "Valid/Invalid" feedback.
- **Conflict Prevention**: Automatically detects and blocks "Already Used" tickets at specific checkpoints.

## 🛠 Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + ShadCN UI
- **AI**: Genkit (Google Gemini 2.5 Flash)
- **Backend**: Firebase (Auth, Firestore, Hosting)
- **Scanning**: jsQR for real-time video analysis
- **Icons**: Lucide React

## 🚀 Getting Started

1. **Admin Login**: Log in as an Event Admin (or use the Demo Admin).
2. **Setup Event**: Create an event and set your **Event Poster** URL.
3. **Import Guests**: Upload a CSV with `No, Name, Category, Phone`.
4. **Design Invitations**: Pick a template in the Invitation Center and customize the text.
5. **Deploy Staff**: Create staff logins and assign them to Gate/Drinks/Food checkpoints.
6. **Verify & Report**: Start scanning guests and download the final attendance report once the event ends.

## 📄 License
Powered by 360 Digital. All rights reserved.

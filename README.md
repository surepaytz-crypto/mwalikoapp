# Mwaliko App - Premium Event Invitations

This is a luxurious event management and guest invitation platform built with Next.js, Tailwind CSS, and Genkit AI, designed for deployment on Firebase.

## 🛠 How to Edit

This project is designed to be developed collaboratively with your AI partner in Firebase Studio.

- **Request Features:** Simply ask the AI to "Add a guest list," "Create a login page," or "Update the styling."
- **AI Guidance:** The AI will generate the necessary code changes across multiple files and present them for your approval.
- **Manual Edits:** You can also manually edit files in the editor if you prefer fine-grained control.

## 🚀 How to Publish

Your app is pre-configured for **Firebase App Hosting**, which provides a seamless path from code to a live production URL.

### 1. Push to GitHub
Ensure your latest changes are pushed to a GitHub repository.

### 2. Set up App Hosting in Firebase
1.  Go to the [Firebase Console](https://console.firebase.google.com/).
2.  Select your project.
3.  In the left sidebar, click on **Build** > **App Hosting**.
4.  Click **Get Started** and follow the prompts to connect your GitHub account.
5.  Select your repository and the branch you want to deploy (usually `main`).

### 3. Automatic Deployments
Once connected, every time you push code to your branch, Firebase App Hosting will automatically:
- Detect your Next.js project.
- Install dependencies and build the application.
- Deploy it to a globally distributed, secure web hosting environment.

## 🏗 Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Styling:** Tailwind CSS + ShadCN UI
- **AI:** Genkit (Google Gemini)
- **Backend:** Firebase (Auth, Firestore, App Hosting)
- **Icons:** Lucide React

## 📄 Project Structure

- `src/app`: Next.js pages and layouts.
- `src/components`: Reusable UI components.
- `src/ai`: Genkit AI flows and prompts.
- `src/context`: React context providers (e.g., Language/Translation).
- `apphosting.yaml`: Configuration for Firebase App Hosting.

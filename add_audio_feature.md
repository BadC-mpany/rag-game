# Technical Specification: Audio Transcription Feature for Level 7

This document outlines the technical specification and implementation plan for adding an audio transcription feature to level 7 of the RAG game.

## 1. Feature Overview

The goal is to allow users to upload an audio file in level 7. The system will then automatically transcribe the audio to text and create a new text file with the transcription in the game's file system.

### User Experience:
1.  In level 7, the user uploads an audio file (e.g., `.mp3`, `.wav`, `.m4a`).
2.  The system automatically starts the transcription process. A simple "Transcribing..." message will be displayed to the user.
3.  Once the transcription is complete, a new file named `<original_audio_filename>_transcription.txt` is created and appears in the file explorer.
4.  The original audio file also appears in the file explorer.

## 2. Technical Implementation

The implementation will be divided into two main parts: a new server-side API endpoint for transcription and client-side logic to handle file uploads and UI updates.

### 2.1. Server-Side: Transcription API

A new API endpoint will be created at `pages/api/transcribe.ts`. This endpoint will be a Vercel Serverless Function.

*   **Endpoint:** `POST /api/transcribe`
*   **Request Body:**
    ```json
    {
      "audio": "<base64-encoded audio data>",
      "fileName": "<original filename>"
    }
    ```
*   **Logic:**
    1.  The endpoint will receive the base64-encoded audio data.
    2.  It will use the `openai` Node.js library to send the audio data to the OpenAI Whisper API for transcription.
    3.  An `OPENAI_API_KEY` environment variable must be configured for this to work.
    4.  The endpoint will handle the response from the Whisper API and return the transcribed text.
*   **Response:**
    ```json
    {
      "transcription": "<transcribed text>"
    }
    ```
*   **Dependencies:** The `openai` npm package will be added to the project.

### 2.2. Client-Side: File Upload and UI

The existing file upload mechanism will be updated to support this new feature.

*   **File:** `components/FileSystemExplorer.tsx`
    *   The file upload logic will be modified to detect when a user is on level 7 and uploads an audio file.
    *   It will read the audio file as a base64 data URL and send it to the `/api/transcribe` endpoint.
    *   A loading state will be managed within this component to show a "Transcribing..." message.
*   **File:** `pages/play/[level].tsx`
    *   The `handleUploadFile` function will be updated to handle the creation of both the original audio file (with empty content, as we don't display audio content) and the new transcription file.

## 3. Implementation Plan

1.  **Add Dependency:** Add the `openai` package to `package.json`.
    ```bash
    npm install openai
    ```
2.  **Create API Endpoint:** Create the file `pages/api/transcribe.ts` with the following content:
    ```typescript
    import { NextApiRequest, NextApiResponse } from 'next';
    import OpenAI from 'openai';
    import { Readable } from 'stream';

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Helper to convert base64 to a readable stream
    function base64ToStream(base64: string): Readable {
      const buffer = Buffer.from(base64.split(',')[1], 'base64');
      const stream = new Readable();
      stream.push(buffer);
      stream.push(null);
      return stream;
    }

    export default async function handler(req: NextApiRequest, res: NextApiResponse) {
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      try {
        const { audio, fileName } = req.body;

        if (!audio) {
          return res.status(400).json({ message: 'Audio data is required' });
        }

        const audioStream = base64ToStream(audio);

        const transcription = await openai.audio.transcriptions.create({
          file: audioStream,
          model: 'whisper-1',
        });

        res.status(200).json({ transcription: transcription.text });
      } catch (error) {
        console.error('Error during transcription:', error);
        res.status(500).json({ message: 'Error during transcription' });
      }
    }
    ```
3.  **Update `components/FileSystemExplorer.tsx`:**
    *   Add `levelId` to `FileSystemExplorerProps`.
    *   Add `isTranscribing` state.
    *   Update the file input's `onChange` handler to call the new API endpoint for audio files on level 7.
4.  **Update `pages/play/[level].tsx`:**
    *   Pass the `level.id` to the `FileSystemExplorer` component.
    *   Update the `handleUploadFile` function to handle the new transcription file.
5.  **Documentation:** Create a new `docs/audio_transcription.md` file to document the feature and the new `OPENAI_API_KEY` environment variable.


# badcompany - Agent Breaker

This project is a web-based game where you can "hack" LLM agents to find vulnerabilities. It's built with Next.js, TypeScript, and Tailwind CSS.

## Getting Started

1.  **Install dependencies:**

    ```bash
    npm install
    ```

2.  **Set up environment variables:**

    Create a `.env.local` file by copying the example file:

    ```bash
    cp .env.example .env.local
    ```

    You don't need to fill in the variables for now.

3.  **Run the development server:**

    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

-   `pages/`: Next.js pages and API routes.
-   `components/`: React components.
-   `config/`: Configuration files for theme and prompts.
-   `lib/`: Helper functions.
-   `styles/`: Global styles.

## Deployment on Vercel

To deploy this project on Vercel, follow these steps:

1.  **Push your code to a GitHub repository.**

2.  **Create a new project on Vercel.**

    -   Go to your Vercel dashboard and click "Add New..." > "Project".
    -   Import your GitHub repository.

3.  **Configure your project.**

    -   Vercel will automatically detect that you are using Next.js.
    -   You will need to set up the environment variables. Go to the "Settings" tab of your project, then "Environment Variables". Add the variables from your `.env.local` file.
    -   You will also need to set up the Vercel KV store. Go to the "Storage" tab and create a new KV store. Then, connect it to your project.

4.  **Deploy!**

    Vercel will automatically build and deploy your project. Any new pushes to your GitHub repository will trigger a new deployment.

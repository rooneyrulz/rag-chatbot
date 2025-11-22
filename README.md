# RAG Chatbot

A modern, AI-powered chatbot that allows users to upload PDF documents and have intelligent conversations about their content using Retrieval-Augmented Generation (RAG).

## 🌟 Features

- **PDF Document Upload**: Upload and process PDF documents for analysis
- **Intelligent Chat**: Ask questions and get contextually relevant answers from your documents
- **User Authentication**: Secure authentication powered by Clerk
- **Modern UI**: Beautiful, responsive interface built with Radix UI components
- **Real-time Streaming**: Stream AI responses in real-time for better user experience
- **Persistent Storage**: Store your documents and chat history in Neon PostgreSQL database

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15.5.4** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### AI & RAG
- **Groq AI** (@ai-sdk/groq) - Fast LLM inference
- **HuggingFace Inference** - Text embeddings for document vectorization
- **Vercel AI SDK** - AI/ML utilities and streaming
- **LangChain Text Splitters** - Document chunking and processing

### Authentication
- **Clerk** - Complete authentication solution

### Database & ORM
- **Neon Database** - Serverless PostgreSQL
- **Drizzle ORM** - Type-safe database toolkit

### UI Components
- **Radix UI** - Unstyled, accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful icon set
- **Sonner** - Toast notifications
- **React Hook Form** - Form management with Zod validation

### Additional Libraries
- **pdf-parse** - PDF text extraction
- **React Flow** (@xyflow/react) - Node-based visualization (optional feature)
- **Recharts** - Data visualization
- **cmdk** - Command palette interface

## 📋 Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- A Clerk account (for authentication)
- A Groq API key (for LLM inference)
- A HuggingFace API token (for embeddings)
- A Neon database account

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/rooneyrulz/rag-chatbot.git
cd rag-chatbot
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### 3. Set up environment variables

Create a `.env.local` file in the root directory:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Clerk URLs (optional - defaults work for most cases)
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Groq AI
GROQ_API_KEY=your_groq_api_key

# HuggingFace
HUGGINGFACE_API_KEY=your_huggingface_token

# Neon Database
DATABASE_URL=your_neon_database_url
```

### 4. Set up the database

```bash
# Generate database migrations
npx drizzle-kit generate

# Run migrations
npx drizzle-kit push
```

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Project Structure

```
rag-chatbot/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (chat)/            # Chat interface routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── ...               # Feature-specific components
├── lib/                   # Utility functions and configurations
│   ├── db/               # Database schema and queries
│   ├── ai/               # AI/RAG logic
│   └── utils.ts          # Helper functions
├── public/               # Static assets
└── ...config files
```

## 📖 How It Works

1. **Document Upload**: Users upload PDF documents through the interface
2. **Text Extraction**: The system extracts text content from PDFs using `pdf-parse`
3. **Chunking**: Documents are split into manageable chunks using LangChain text splitters
4. **Embedding**: Text chunks are converted to vector embeddings using HuggingFace models
5. **Storage**: Embeddings and metadata are stored in Neon PostgreSQL database
6. **Query Processing**: When a user asks a question:
   - The question is converted to an embedding
   - Similar document chunks are retrieved using vector similarity search
   - Relevant context is passed to Groq LLM
   - The LLM generates a contextual response
7. **Streaming Response**: Answers are streamed back to the user in real-time

## 🎨 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production with Turbopack
- `npm start` - Start production server
- `npm run lint` - Run Biome linter
- `npm run format` - Format code with Biome

## 🔧 Configuration

### Database Schema

Use Drizzle Kit to manage your database schema:

```bash
# Generate new migration
npx drizzle-kit generate

# Push changes to database
npx drizzle-kit push

# Open Drizzle Studio (database GUI)
npx drizzle-kit studio
```

### Customizing AI Models

Edit the AI configuration in your code to use different models:

- **LLM Models**: Configure Groq model selection (e.g., llama, mixtral)
- **Embedding Models**: Change HuggingFace embedding model
- **Chunking Strategy**: Adjust text splitter parameters for optimal performance

## 🌐 Deployment

### Deploy to Vercel

The easiest way to deploy is using [Vercel](https://vercel.com):

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/rooneyrulz/rag-chatbot)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

This Next.js app can be deployed to any platform that supports Node.js:
- Netlify
- Railway
- AWS
- Digital Ocean
- Self-hosted

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- [Vercel AI SDK](https://sdk.vercel.ai/) for AI utilities
- [Groq](https://groq.com/) for fast LLM inference
- [Clerk](https://clerk.com/) for authentication
- [Neon](https://neon.tech/) for serverless PostgreSQL
- [Radix UI](https://www.radix-ui.com/) for accessible components
- [shadcn/ui](https://ui.shadcn.com/) for UI component inspiration

## 📧 Contact

For questions or feedback, please open an issue on GitHub.

Made with ❤️ using Next.js and AI
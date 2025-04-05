# Schoolyard Website Repository

Schoolyard is a curiosity-driven short-form learning edtech platform that leverages intelligent content similarity to help users learn online.

## Technical Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js with Apollo Server for GraphQL
- **Database**: PostgreSQL with TypeORM
- **Caching**: Redis with connect-redis for session management
- **Authentication**: Express-session with Argon2 for password hashing
- **Email Service**: Nodemailer for email communications
- **File Storage**: AWS SDK for cloud storage
- **Development Tools**:
  - TypeScript for type safety
  - Concurrently for parallel development tasks
  - Nodemon for hot reloading
  - GraphQL Upload for file handling

### Frontend
- React with TypeScript
- Modern UI components and styling

## AI/ML Implementation

### Word2Vec Integration
The platform implements a text analysis system using Word2Vec embeddings for semantic understanding and content relationships:

1. **Sentence Embedding Generation**
   - Converts sentences into 100-dimensional vector representations
   - Aggregates word-level embeddings to create sentence-level meaning   

2. **Semantic Distance Calculation**
   - Used to measure semantic similarity between different content pieces
   - Supports automatic content relationship discovery

3. **Content Relationship Management**
   - Maintains a graph of semantic relationships between content
   - Supports both manual and automatic relationship creation   

### Key Features
- Automatic content similarity detection
- Intelligent content linking
- Content relationship visualization

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Server
   cd server
   npm install
   
   # Web Client
   cd ../web
   npm install
   ```
3. Set up environment variables:
   ```bash
   # Server
   cd server
   npm run gen-env
   ```
4. Start development servers:
   ```bash
   # Server (in server directory)
   npm run dev
   
   # Web Client (in web directory)
   npm run dev
   ```

## Development

### Server Commands
- `npm run dev`: Start development server with hot reloading
- `npm run build`: Build the TypeScript project
- `npm run start`: Start the production server
- `npm run deploy`: Deploy the application
- `npm run gen-env`: Generate TypeScript types from environment variables

### Web Client Commands
- `npm run dev`: Start Next.js development server
- `npm run build`: Build the Next.js application
- `npm run start`: Start the production Next.js server
- `npm run gen`: Generate GraphQL types

## Environment Variables

Required environment variables:
- Database connection details
- Redis configuration
- AWS credentials
- Email service configuration
- Session secret

See `.env.example` for a complete list of required variables.


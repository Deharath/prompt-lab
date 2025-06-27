# Environment Variables

This document describes the environment variables used by the PromptLab API.

## Required Variables

### API Keys

- `OPENAI_API_KEY` - Your OpenAI API key for GPT models
- `GEMINI_API_KEY` - Your Google Gemini API key (optional, will gracefully degrade if not provided)

### Server Configuration

- `PORT` - Server port (default: 3000)

## Optional Variables

### Database

- `DATABASE_URL` - Path to the job database file (default: jobs.json)
  - For file-based storage: `jobs.json`
  - For future SQLite: `sqlite://db.sqlite`

### Development

- `NODE_ENV` - Environment mode (development/production)

## Example .env File

```bash
PORT=3000
OPENAI_API_KEY=sk-proj-your-openai-key-here
GEMINI_API_KEY=AIzaSyA-your-gemini-key-here
DATABASE_URL=jobs.json
```

## Security Notes

- Keep your API keys secure and never commit them to version control
- The `.env` file should be in your `.gitignore`
- Use different API keys for development and production
- Consider using environment-specific configuration management in production

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**MewtwoAI** - An interactive voice chat web application where kids can talk with Mewtwo, the legendary Pokémon character. Built with Next.js 14, React, TypeScript, Google Gemini 1.5 Flash, and ElevenLabs TTS.

### Key Features
- Voice-based conversations using Web Speech API
- AI-powered responses with kid-friendly Mewtwo personality
- Text-to-speech with deep, powerful voice
- Story time mode for bedtime stories
- Conversation history persistence
- Mobile-first PWA design

## Development Commands

### Setup
```bash
# Install dependencies
npm install

# Create .env.local file with required API keys
cp .env.example .env.local
# Then edit .env.local with your actual API keys
```

### Development
```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linter
npm run lint
```

### Environment Variables Required
- `GEMINI_API_KEY`: Google Gemini API key (free at https://aistudio.google.com/app/apikey)
- `ELEVENLABS_API_KEY`: ElevenLabs API key for TTS (optional, will fallback to browser TTS)
- `NEXT_PUBLIC_APP_URL`: App URL (default: http://localhost:3000)

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 App Router, React 18, TypeScript
- **Styling**: Tailwind CSS with custom Mewtwo theme
- **AI**: Google Gemini 1.5 Flash with streaming responses
- **Voice Input**: Web Speech API (browser native)
- **Voice Output**: ElevenLabs Text-to-Speech API
- **Storage**: LocalStorage for offline-first experience
- **Deployment**: Vercel recommended

### Project Structure
```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── chat/          # OpenAI chat endpoint (streaming)
│   │   └── tts/           # ElevenLabs TTS endpoint
│   ├── page.tsx           # Main page component
│   ├── layout.tsx         # Root layout with PWA config
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── VoiceChat.tsx      # Main voice chat interface
│   ├── MewtwoCharacter.tsx # Animated character display
│   ├── ChatBubble.tsx     # Message bubble component
│   └── StoryTimeButton.tsx # Story mode toggle
├── hooks/                 # Custom React hooks
│   ├── useSpeechRecognition.ts # Web Speech API wrapper
│   ├── useTextToSpeech.ts      # TTS with queue management
│   └── useConversation.ts      # Chat state & API calls
├── lib/                   # Utility libraries
│   ├── gemini.ts          # Gemini client configuration
│   ├── mewtwo-prompts.ts  # AI personality system prompts
│   └── storage.ts         # LocalStorage utilities
└── types/                 # TypeScript type definitions
    └── chat.ts
```

### Key Design Decisions

1. **Web Speech API for Input**: Browser-native, free, works well on Chrome/Safari
2. **Streaming Responses**: Gemini responses stream for faster perceived performance
3. **LocalStorage First**: Offline-first with conversation persistence
4. **Mobile-First UI**: Large touch targets, responsive design, PWA capabilities
5. **Safety Built-In**: Age-appropriate content filtering in system prompts

### AI Personality Configuration

Mewtwo's personality is defined in `src/lib/mewtwo-prompts.ts`:
- Wise, powerful, but kind and patient
- Kid-friendly language (5-year-old appropriate)
- Short responses (2-4 sentences)
- Encouraging and educational
- Story time mode for longer narratives

### Browser Compatibility

- **Chrome/Edge**: Full support (recommended)
- **Safari (iOS/macOS)**: Full support with webkit prefix
- **Firefox**: Limited speech recognition
- **Android Chrome**: Full support

## Important Notes

### When Making Changes

- Always test voice features on actual mobile devices (iOS Safari, Android Chrome)
- Keep responses kid-friendly and age-appropriate
- Large UI elements for 5-year-old usability
- Test both push-to-talk and auto modes
- Verify conversation history persists across page reloads

### Safety & Content
- All content must be G-rated and educational
- No external links or inappropriate references
- System prompts include content filtering
- Parent controls via conversation history access

### Future Enhancements
- Multiple Pokémon characters
- Voice cloning from movie audio
- Mini-games and activities
- Cloud sync with Supabase
- Parental controls dashboard

### Cost Considerations
- Gemini API: Free tier (15 requests/min, 1M tokens/day)
- ElevenLabs: ~$0.18-0.30 per 1k chars (10k free/month), or $0 with browser TTS fallback
- Vercel: Free for personal use

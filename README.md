# Mewtwo AI - Voice Chat Application

An interactive voice chat web application where kids can talk with Mewtwo, the legendary Pokémon character. Built with Next.js, OpenAI GPT-4, and ElevenLabs Text-to-Speech.

## Features

- 🎤 **Voice Input**: Natural speech recognition using Web Speech API
- 🔊 **Voice Output**: High-quality text-to-speech with deep, powerful voice
- 💬 **Interactive Chat**: Context-aware conversations with kid-friendly Mewtwo personality
- 📖 **Story Time Mode**: Generate Pokémon stories for bedtime or entertainment
- 💾 **Conversation History**: Persistent chat history across sessions
- 📱 **Mobile-First**: Optimized for tablets and phones with PWA support
- 🎨 **Animated Character**: Visual feedback for different states (idle, listening, speaking)

## Tech Stack

- **Frontend**: Next.js 14 with React and TypeScript
- **Styling**: Tailwind CSS
- **AI**: OpenAI GPT-4 Turbo
- **Voice Input**: Web Speech API (browser native)
- **Voice Output**: ElevenLabs Text-to-Speech API
- **Storage**: LocalStorage for offline-first experience
- **Hosting**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- ElevenLabs API key (optional, will fallback to browser TTS)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MewtwoAI
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory:
```env
OPENAI_API_KEY=sk-...
ELEVENLABS_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Start a Conversation**:
   - Press the microphone button (🎤) to start speaking
   - Speak your message to Mewtwo
   - Release or press again to stop recording
   - Mewtwo will respond with voice and text

2. **Auto Mode**:
   - Toggle "Auto Mode" for continuous conversation
   - Mewtwo will automatically listen after speaking

3. **Story Time**:
   - Click the "Story Time" button in the top-right
   - Ask Mewtwo to tell you a story
   - Stories are generated specifically for kids

4. **Stop All**:
   - Press the "Stop" button to interrupt speech and listening

## Browser Compatibility

- **Chrome/Edge**: Full support (best experience)
- **Safari (iOS/macOS)**: Full support with webkit prefix
- **Firefox**: Limited speech recognition support
- **Android Chrome**: Full support

## Project Structure

```
MewtwoAI/
├── src/
│   ├── app/                    # Next.js app directory
│   │   ├── api/               # API routes (chat, tts)
│   │   ├── page.tsx           # Main page
│   │   ├── layout.tsx         # Root layout
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── VoiceChat.tsx      # Main chat interface
│   │   ├── MewtwoCharacter.tsx # Animated character
│   │   ├── ChatBubble.tsx     # Message display
│   │   └── StoryTimeButton.tsx # Story mode toggle
│   ├── hooks/                 # Custom React hooks
│   │   ├── useSpeechRecognition.ts
│   │   ├── useTextToSpeech.ts
│   │   └── useConversation.ts
│   ├── lib/                   # Utility libraries
│   │   ├── openai.ts          # OpenAI client
│   │   ├── mewtwo-prompts.ts  # AI personality prompts
│   │   └── storage.ts         # LocalStorage utilities
│   └── types/                 # TypeScript types
│       └── chat.ts
├── public/                    # Static assets
│   ├── manifest.json          # PWA manifest
│   └── icons/                 # App icons
└── ...config files
```

## Customization

### Adjust Mewtwo's Personality

Edit `src/lib/mewtwo-prompts.ts` to modify:
- Character traits
- Communication style
- Topics and knowledge
- Story generation parameters

### Change Voice Settings

In `src/app/api/tts/route.ts`, adjust:
- Voice ID (ElevenLabs voice selection)
- Stability and similarity settings
- Voice model

### Modify UI Theme

In `tailwind.config.js`, customize:
- Color scheme (mewtwo-purple, etc.)
- Breakpoints for responsive design
- Animation styles

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

The app will be available at `https://your-app.vercel.app`

### PWA Installation

Users can install the app on their device:
- **iOS**: Safari → Share → Add to Home Screen
- **Android**: Chrome → Menu → Add to Home Screen

## Cost Considerations

- **OpenAI GPT-4 Turbo**: ~$0.01-0.03 per conversation
- **ElevenLabs**: ~$0.18-0.30 per 1000 characters (free tier: 10k chars/month)
- **Vercel Hosting**: Free for personal use
- **Web Speech API**: Free (browser native)

## Safety & Content

The app includes built-in safety measures:
- Age-appropriate content filtering in system prompts
- No external links or inappropriate content
- Gentle, educational, and positive interactions
- Parent controls via conversation history access

## Future Enhancements

- [ ] Multiple Pokémon characters
- [ ] Voice cloning from movie audio
- [ ] Mini-games (trivia, counting)
- [ ] 3D character animations
- [ ] Multi-language support
- [ ] Usage limits and parental controls
- [ ] Cloud sync across devices (Supabase)

## License

This project is for personal use. Pokémon is a trademark of Nintendo/Game Freak/Creatures Inc.

## Support

For issues or questions, please open an issue on GitHub.

---

Made with ❤️ for Damian and kids who love Pokémon

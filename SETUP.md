# Mewtwo AI - Setup Guide

This guide will help you get the Mewtwo Voice Chat app up and running.

## Prerequisites

- Node.js 18 or higher
- npm
- OpenAI API account (required)
- ElevenLabs account (optional, for better voice quality)

## Step 1: API Keys Setup

### Get OpenAI API Key (Required)

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key (starts with `sk-`)

### Get ElevenLabs API Key (Optional)

1. Go to [ElevenLabs](https://elevenlabs.io/)
2. Sign up for a free account (10k characters/month free)
3. Go to Profile Settings → API Keys
4. Copy your API key

**Note**: If you skip ElevenLabs, the app will fall back to browser's built-in text-to-speech (lower quality but functional).

## Step 2: Environment Configuration

1. The project already has a `.env.local` file. Update it with your actual API keys:

```bash
# Open the file
nano .env.local
# or
code .env.local
```

2. Replace the placeholder values:

```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
ELEVENLABS_API_KEY=your-elevenlabs-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

3. Save the file

## Step 3: Install Dependencies

If you haven't already:

```bash
npm install
```

## Step 4: Run the Development Server

```bash
npm run dev
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Step 5: Test the App

1. **Open in a supported browser**:
   - Chrome (recommended)
   - Safari (iOS/macOS)
   - Edge
   - Brave

2. **Grant microphone permissions** when prompted

3. **Test push-to-talk**:
   - Click the microphone button (🎤)
   - Speak a message
   - Click again or wait for auto-stop
   - Mewtwo should respond with voice and text

4. **Test auto mode** (optional):
   - Toggle "Auto Mode" button
   - The app will continuously listen after Mewtwo speaks

5. **Test story time**:
   - Click the "Story Time" button
   - Ask Mewtwo to tell you a story

## Step 6: Customize (Optional)

### Change Mewtwo's Personality

Edit `src/lib/mewtwo-prompts.ts` to adjust:
- Character traits
- Communication style
- Topics and responses

### Change Voice Settings

Edit `src/app/api/tts/route.ts` to adjust:
- Voice ID (line 28: `voiceId`)
- Voice settings (stability, similarity)

To browse ElevenLabs voices:
1. Go to [ElevenLabs Voice Library](https://elevenlabs.io/voice-library)
2. Find a voice you like
3. Copy its Voice ID
4. Replace in the code

### Customize Colors

Edit `tailwind.config.js` to change the color scheme:

```js
colors: {
  mewtwo: {
    purple: '#A040A0',  // Change these
    light: '#D8B8D8',
    dark: '#5C2E5C',
  },
},
```

## Step 7: Deploy to Production (Vercel)

1. **Push to GitHub**:
```bash
git add .
git commit -m "Initial Mewtwo AI setup"
git push
```

2. **Deploy to Vercel**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables in Vercel dashboard
   - Deploy!

3. **Add to Home Screen (Mobile)**:
   - **iOS**: Safari → Share → Add to Home Screen
   - **Android**: Chrome → Menu → Add to Home Screen

## Troubleshooting

### Issue: "Speech recognition is not supported"
- **Solution**: Use Chrome, Safari, or Edge. Firefox has limited support.

### Issue: No voice output
- **Solution**: Check ElevenLabs API key. If not set, it will try browser TTS.

### Issue: API errors
- **Solution**: Verify your OpenAI API key is correct and has available credits.

### Issue: Build fails
- **Solution**: Make sure `.env.local` exists with at least placeholder values.

### Issue: Microphone not working
- **Solution**: Grant microphone permissions in browser settings.

## Browser Compatibility

| Browser | Voice Input | Voice Output | Overall |
|---------|-------------|--------------|---------|
| Chrome (Desktop/Android) | ✅ Excellent | ✅ Excellent | ✅ Recommended |
| Safari (iOS/macOS) | ✅ Excellent | ✅ Excellent | ✅ Recommended |
| Edge | ✅ Excellent | ✅ Excellent | ✅ Recommended |
| Firefox | ⚠️ Limited | ✅ Good | ⚠️ Not Recommended |

## Usage Tips

1. **For best results**: Use on an iPad or large-screen phone
2. **Quiet environment**: Background noise can affect speech recognition
3. **Clear speech**: Speak clearly and at a normal pace
4. **Auto mode**: Great for continuous conversations without clicking
5. **Story time**: Perfect for bedtime or long car rides

## Cost Estimates

Based on typical usage:
- **OpenAI GPT-4**: ~$0.01-0.03 per conversation (5-10 exchanges)
- **ElevenLabs**: ~$0.18-0.30 per 1000 characters
  - Free tier: 10,000 characters/month (plenty for personal use)
- **Vercel Hosting**: Free for personal projects

**Example**: 20 conversations per day = ~$0.60/day or ~$18/month for OpenAI.

## Next Steps

- Add custom Mewtwo images to `public/mewtwo/`
- Create proper PWA icons (192x192 and 512x512)
- Customize personality prompts for your child's interests
- Set up cloud sync with Supabase (future enhancement)

## Support

If you encounter issues:
1. Check the console for error messages (F12 in browser)
2. Verify API keys are correctly set
3. Check OpenAI and ElevenLabs account status
4. Consult the main README.md for architecture details

---

Enjoy chatting with Mewtwo! 🧬

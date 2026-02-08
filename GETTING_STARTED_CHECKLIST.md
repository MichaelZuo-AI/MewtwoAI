# Getting Started Checklist ✅

Follow this checklist to get Mewtwo AI up and running!

## Before You Start

- [ ] I have Node.js 18+ installed (`node --version`)
- [ ] I have npm installed (`npm --version`)
- [ ] I have a credit card ready for API signups (small costs)

## Step 1: Get API Keys (15 minutes)

### OpenAI Setup (Required)
- [ ] Go to https://platform.openai.com/
- [ ] Sign up or log in
- [ ] Navigate to API Keys section
- [ ] Create new API key
- [ ] Copy the key (starts with `sk-`)
- [ ] Add payment method (required for API access)
- [ ] Set usage limits if desired (e.g., $10/month)

### ElevenLabs Setup (Optional but Recommended)
- [ ] Go to https://elevenlabs.io/
- [ ] Sign up for free account
- [ ] Navigate to Profile → API Keys
- [ ] Copy your API key
- [ ] (Free tier: 10,000 characters/month - plenty for testing)

## Step 2: Configure Environment (2 minutes)

- [ ] Open `.env.local` file in the project root
- [ ] Paste your OpenAI API key
- [ ] Paste your ElevenLabs API key (or leave as placeholder)
- [ ] Save the file

```env
OPENAI_API_KEY=sk-your-actual-key-here
ELEVENLABS_API_KEY=your-key-here-or-placeholder
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Install & Run (3 minutes)

- [ ] Open terminal in project directory
- [ ] Run: `npm install` (wait for completion)
- [ ] Run: `npm run dev`
- [ ] Open http://localhost:3000 in Chrome or Safari
- [ ] Grant microphone permissions when prompted

## Step 4: Test Basic Features (5 minutes)

### Voice Input Test
- [ ] Click the microphone button 🎤
- [ ] Say: "Hi Mewtwo, my name is [name]"
- [ ] Wait for Mewtwo's response
- [ ] Verify you hear Mewtwo's voice
- [ ] Verify text appears in chat

### Auto Mode Test
- [ ] Toggle "Auto Mode" button
- [ ] Have a short conversation (2-3 exchanges)
- [ ] Turn off Auto Mode

### Story Time Test
- [ ] Click "Story Time" button (top right)
- [ ] Say: "Tell me a story about Pikachu"
- [ ] Listen to the story
- [ ] Toggle Story Time off

### History Test
- [ ] Refresh the page
- [ ] Verify conversation history is still there
- [ ] Click "Clear History" button
- [ ] Verify history clears

## Step 5: Mobile Testing (10 minutes)

### On Tablet or Phone
- [ ] Connect device to same WiFi network
- [ ] Get your computer's IP address (`ifconfig` on Mac)
- [ ] Open browser on device: `http://[YOUR-IP]:3000`
- [ ] Grant microphone permissions
- [ ] Test voice input
- [ ] Test voice output
- [ ] Check touch targets are large enough
- [ ] Verify responsive layout looks good

### PWA Installation (Optional)
- [ ] On iOS: Safari → Share → Add to Home Screen
- [ ] On Android: Chrome → Menu → Add to Home Screen
- [ ] Launch from home screen
- [ ] Verify full-screen mode

## Step 6: Customize (Optional, 10 minutes)

### Adjust Mewtwo's Personality
- [ ] Open `src/lib/mewtwo-prompts.ts`
- [ ] Modify CHARACTER TRAITS section
- [ ] Modify TOPICS YOU ENJOY section
- [ ] Save and test changes

### Change Colors
- [ ] Open `tailwind.config.js`
- [ ] Modify `mewtwo` colors
- [ ] Save and see changes

### Adjust Voice Settings
- [ ] Open `src/app/api/tts/route.ts`
- [ ] Browse voices at https://elevenlabs.io/voice-library
- [ ] Replace `voiceId` on line 28
- [ ] Adjust stability/similarity settings if needed

## Step 7: Deploy to Production (Optional, 15 minutes)

- [ ] Create GitHub repository
- [ ] Push code: `git add . && git commit -m "Initial commit" && git push`
- [ ] Go to https://vercel.com
- [ ] Sign up/login with GitHub
- [ ] Click "Import Project"
- [ ] Select your repository
- [ ] Add environment variables (same as .env.local)
- [ ] Deploy!
- [ ] Test production URL
- [ ] Share with family!

## Troubleshooting Checklist

If something doesn't work:

### No Voice Output
- [ ] Check ElevenLabs API key is valid
- [ ] Check browser console for errors (F12)
- [ ] Try without ElevenLabs key (uses browser TTS)
- [ ] Verify volume is up

### No Voice Input
- [ ] Using Chrome or Safari? (Firefox not fully supported)
- [ ] Granted microphone permissions?
- [ ] Check browser console for errors
- [ ] Try different browser

### API Errors
- [ ] OpenAI API key is correct?
- [ ] OpenAI account has credits?
- [ ] Check browser console for specific error
- [ ] Verify internet connection

### Build Errors
- [ ] Node.js version 18+?
- [ ] Ran `npm install` successfully?
- [ ] `.env.local` file exists?
- [ ] No syntax errors in code?

## Success! 🎉

Once you complete this checklist:
- ✅ Mewtwo AI is fully functional
- ✅ Voice input and output working
- ✅ Tested on desktop and mobile
- ✅ Ready for Damian to use!

## Next Steps

1. **Let Damian try it!** Watch how he interacts and adjust personality if needed
2. **Monitor costs**: Check OpenAI and ElevenLabs usage dashboards
3. **Customize further**: Add personal touches based on Damian's interests
4. **Share with family**: Deploy and share the URL

## Need Help?

- 📖 Read SETUP.md for detailed instructions
- 📚 Check README.md for architecture details
- 🐛 Check browser console for error messages
- 💡 Review IMPLEMENTATION_SUMMARY.md for technical details

---

Happy chatting with Mewtwo! 🧬

# Vercel Deployment Guide

## Prerequisites
1. GitHub account
2. Vercel account (free tier available)
3. MongoDB Atlas account (free tier available)
4. Groq API key

## Step 1: Prepare Your Repository

1. **Push to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for Vercel deployment"
   git branch -M main
   git remote add origin https://github.com/yourusername/ai-research-summarizer.git
   git push -u origin main
   ```

## Step 2: Set Up MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Create a free cluster
3. Create a database user
4. Get your connection string (replace `<password>` with your actual password)
5. Whitelist all IPs (0.0.0.0/0) for Vercel deployment

## Step 3: Deploy on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration from `vercel.json`

### Environment Variables Setup:

In Vercel dashboard, add these environment variables:

```
GROQ_API_KEY=your_groq_api_key_here
SECRET_KEY=your_secret_key_here_make_it_long_and_random
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/ai_research?retryWrites=true&w=majority
ENVIRONMENT=production
FRONTEND_URL=https://your-app.vercel.app
```

**Important**: Replace `your-app` with your actual Vercel app name.

## Step 4: Configure Domain (Optional)

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add your custom domain or use the provided `.vercel.app` domain
4. Update `FRONTEND_URL` environment variable with your final domain

## Step 5: Test Your Deployment

1. Visit your Vercel URL
2. Create an account
3. Upload a PDF and test the summarization
4. Test all features including compare and chat

## Project Structure for Vercel

```
ai-research-summarizer/
├── backend/
│   ├── app.py              # FastAPI application
│   ├── database.py         # MongoDB operations
│   ├── auth.py            # Authentication
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── index.html         # Entry point
│   ├── login.html         # Login page
│   ├── main.html          # Main application
│   ├── style.css          # Styles
│   ├── script.js          # Main JavaScript
│   ├── auth.js            # Authentication JS
│   └── compare.js         # Compare page JS
├── vercel.json            # Vercel configuration
├── requirements.txt       # Root requirements for Vercel
└── README.md
```

## Key Features of Vercel Deployment

### ✅ **Automatic Deployments**
- Every push to main branch triggers deployment
- Preview deployments for pull requests
- Instant rollbacks if needed

### ✅ **Serverless Functions**
- Backend runs as serverless functions
- Automatic scaling
- Pay only for usage

### ✅ **Global CDN**
- Frontend served from global edge network
- Fast loading worldwide
- Automatic HTTPS

### ✅ **Environment Management**
- Secure environment variables
- Different configs for preview/production
- Easy updates through dashboard

## Troubleshooting

### Common Issues:

1. **"Function exceeded maximum duration"**
   - Solution: Optimize AI processing or increase timeout in vercel.json

2. **"Module not found" errors**
   - Solution: Check requirements.txt has all dependencies
   - Ensure Python version compatibility

3. **CORS errors**
   - Solution: Verify FRONTEND_URL environment variable
   - Check allowed_origins in backend/app.py

4. **Database connection issues**
   - Solution: Verify MongoDB Atlas connection string
   - Ensure IP whitelist includes 0.0.0.0/0

5. **Large file uploads failing**
   - Solution: Vercel has 50MB limit for serverless functions
   - Consider using external storage for large files

### Performance Optimization:

1. **Cold Start Reduction**:
   - Keep functions warm with periodic pings
   - Optimize import statements
   - Use lighter dependencies where possible

2. **Caching Strategy**:
   - Enable Vercel's edge caching
   - Cache AI model responses
   - Use browser caching for static assets

3. **Bundle Size Optimization**:
   - Minimize JavaScript bundles
   - Optimize images and assets
   - Use tree shaking for unused code

## Monitoring and Analytics

1. **Vercel Analytics**:
   - Enable in project settings
   - Monitor page views and performance
   - Track user engagement

2. **Function Logs**:
   - View in Vercel dashboard
   - Monitor errors and performance
   - Set up alerts for issues

3. **Database Monitoring**:
   - Use MongoDB Atlas monitoring
   - Track query performance
   - Monitor storage usage

## Scaling Considerations

### Free Tier Limits:
- 100GB bandwidth/month
- 100 serverless function invocations/day
- 10 deployments/day

### Pro Tier Benefits:
- Unlimited bandwidth
- Unlimited function invocations
- Advanced analytics
- Custom domains
- Team collaboration

## Security Best Practices

1. **Environment Variables**:
   - Never commit secrets to Git
   - Use Vercel's encrypted storage
   - Rotate keys regularly

2. **API Security**:
   - Implement rate limiting
   - Validate all inputs
   - Use HTTPS only

3. **Database Security**:
   - Use MongoDB Atlas security features
   - Regular backups
   - Monitor access logs

## Backup and Recovery

1. **Code Backup**: GitHub serves as primary backup
2. **Database Backup**: MongoDB Atlas automatic backups
3. **Environment Variables**: Keep secure backup of all env vars
4. **Deployment History**: Vercel keeps deployment history

## Cost Estimation

### Free Tier (Hobby):
- Perfect for personal projects
- Up to 100GB bandwidth
- Unlimited static sites

### Pro Tier ($20/month):
- Commercial projects
- Unlimited everything
- Advanced features
- Team collaboration

Your AI Research Paper Summarizer is now ready for Vercel deployment!

**Live URL**: https://your-app.vercel.app
**API Endpoint**: https://your-app.vercel.app/api

## Quick Deploy Commands

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from project directory
vercel

# Deploy to production
vercel --prod
```
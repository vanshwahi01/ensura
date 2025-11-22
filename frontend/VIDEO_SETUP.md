# Loading Video Setup Instructions

## How to Add Your Video

1. **Get your video file** from the YouTube video or any other source you have permission to use

2. **Convert the video** (if needed):
   - Recommended format: MP4 (H.264 codec)
   - Alternative format: WebM
   - You can use online converters like CloudConvert or HandBrake

3. **Place the video file** in the `/public` folder:
   ```
   /Users/yazraso/ensura/frontend/public/loading-video.mp4
   ```
   
   Or for WebM format:
   ```
   /Users/yazraso/ensura/frontend/public/loading-video.webm
   ```

4. **File naming**: The code is configured to look for:
   - `loading-video.mp4` (first choice)
   - `loading-video.webm` (fallback)

5. **Restart the dev server** if it's already running

## Video Recommendations

- **Duration**: Any length (it will loop automatically)
- **Resolution**: 1920x1080 or higher
- **File size**: Keep under 50MB for faster loading
- **Aspect ratio**: Any (will be fitted to the container)

## Troubleshooting

If the video doesn't show:
- Check the file is named exactly `loading-video.mp4` or `loading-video.webm`
- Check the file is in the `/public` folder
- Check browser console for errors
- Try clearing browser cache and refreshing

## Current Setup

The loading screen has:
- **Left side**: Progress indicators and status messages
- **Right side**: Your video (reserved section)
- Video plays automatically, loops, and is muted


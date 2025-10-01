/**
 * Vercel Serverless Function - Budget Logo Processing
 * Fast processing with basic quality (no AI)
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const { image_url, scale_factor = 2 } = req.body;

  try {
    // Step 1: Simple background removal (OpenCV only)
    console.log('Step 1: Simple background removal...');
    const bgRemovedPath = await simpleBackgroundRemoval(image_url);
    
    // Step 2: Basic upscaling (OpenCV only)
    console.log('Step 2: Basic upscaling...');
    const upscaledPath = await basicUpscaling(bgRemovedPath, scale_factor);
    
    // Upload to storage
    const publicUrl = await uploadToStorage(upscaledPath);
    
    const processingTime = Date.now() - startTime;
    
    return res.status(200).json({
      success: true,
      processed_url: publicUrl,
      background_removed_url: await uploadToStorage(bgRemovedPath),
      processing_steps: [
        'simple_background_removal',
        'basic_upscaling'
      ],
      total_processing_time_ms: processingTime,
      file_size_bytes: (await fs.stat(upscaledPath)).size,
      tier: 'budget',
      estimated_cost_usd: 0.01
    });

  } catch (error) {
    console.error('Budget processing failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      processing_time_ms: Date.now() - startTime
    });
  }
}

async function simpleBackgroundRemoval(imageUrl) {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [
      '/tmp/scripts/simple_bg_removal.py',
      imageUrl
    ]);

    let output = '';
    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        const result = JSON.parse(output);
        resolve(result.output_path);
      } else {
        reject(new Error(`Background removal failed: ${output}`));
      }
    });
  });
}

async function basicUpscaling(imagePath, scaleFactor) {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [
      '/tmp/scripts/basic_upscaling.py',
      imagePath,
      scaleFactor.toString()
    ]);

    let output = '';
    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.on('close', (code) => {
      if (code === 0) {
        const result = JSON.parse(output);
        resolve(result.output_path);
      } else {
        reject(new Error(`Upscaling failed: ${output}`));
      }
    });
  });
}

async function uploadToStorage(filePath) {
  // In production, upload to S3, Cloudinary, etc.
  const filename = path.basename(filePath);
  return `https://your-cdn.com/output/${filename}`;
}

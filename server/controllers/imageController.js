const Image = require('../models/Image');
const fs = require('fs');
const path = require('path');
const { put, del } = require('@vercel/blob');

// @desc    Get all images
// @route   GET /api/images
// @access  Public
exports.getImages = async (req, res) => {
  try {
    const images = await Image.find().sort({ createdAt: -1 });
    res.status(200).json(images);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching images', error: error.message });
  }
};

// @desc    Get single image
// @route   GET /api/images/:id
// @access  Public
exports.getImageById = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    res.status(200).json(image);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching image details', error: error.message });
  }
};

// @desc    Create new image
// @route   POST /api/images
// @access  Private (Admin)
exports.createImage = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Please upload an image file' });
    }

    if (!title || !description) {
      // Clean up uploaded file if validation fails (local disk storage only)
      if (req.file.path) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Failed to delete uploaded file after validation error:', err);
        });
      }
      return res.status(400).json({ message: 'Please provide both title and description' });
    }

    let imagePath = '';

    // If Vercel Blob token is configured, stream memory buffer to Vercel Storage
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(req.file.originalname).toLowerCase();
      const filename = `image-${uniqueSuffix}${ext}`;
      
      const blob = await put(filename, req.file.buffer, {
        access: 'public',
      });
      imagePath = blob.url;
    } else {
      // Save local relative path
      imagePath = `/uploads/${req.file.filename}`;
    }

    const newImage = new Image({
      title,
      description,
      imagePath
    });

    const savedImage = await newImage.save();
    res.status(201).json(savedImage);
  } catch (error) {
    // Clean up uploaded file on server error (local disk storage only)
    if (req.file && req.file.path) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Failed to delete uploaded file after server error:', err);
      });
    }
    res.status(500).json({ message: 'Server error saving image', error: error.message });
  }
};

// @desc    Update image title/description
// @route   PUT /api/images/:id
// @access  Private (Admin)
exports.updateImage = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Please provide both title and description' });
    }

    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    image.title = title;
    image.description = description;

    const updatedImage = await image.save();
    res.status(200).json(updatedImage);
  } catch (error) {
    res.status(500).json({ message: 'Server error updating image details', error: error.message });
  }
};

// @desc    Delete image
// @route   DELETE /api/images/:id
// @access  Private (Admin)
exports.deleteImage = async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    if (image.imagePath.startsWith('http')) {
      // Delete cloud file from Vercel Blob
      try {
        await del(image.imagePath);
      } catch (err) {
        console.error('Failed to delete Vercel Blob file:', err);
        // Continue to delete metadata even if file delete fails
      }
    } else {
      // Delete file physically from local server disk
      const filename = path.basename(image.imagePath);
      const filePath = path.join(__dirname, '..', 'uploads', filename);

      if (fs.existsSync(filePath)) {
        fs.unlink(filePath, (err) => {
          if (err) {
            console.error(`Failed to delete physical file: ${filePath}`, err);
          }
        });
      }
    }

    await Image.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Image and metadata deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error deleting image', error: error.message });
  }
};

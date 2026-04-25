# Irvan Maulana — Photography Gallery

A minimalist, web-based photography gallery designed to showcase a collection of moments captured across the Indonesian archipelago. This project focuses on clean aesthetics, strong typography, and high performance through Cloudinary optimization.

## 📷 Key Features

- **Minimalist Masonry Grid**: An adaptive photo layout that respects the original aspect ratio of each image without cropping.
- **Series-Based Collections**: Organized photo sets based on location or theme (e.g., Yogyakarta, Bandung, Garut).
- **EXIF Data Display**: Provides technical details for each photograph (Camera, Lens, ISO, Shutter Speed, Aperture) within an elegant Lightbox view.
- **Cloudinary Integration**: Automated image optimization (WebP/AVIF, auto-quality) for exceptionally fast page loads.
- **Fully Responsive**: A seamless browsing experience optimized for both mobile and desktop devices.
- **Smooth Transitions**: Features scroll-reveal effects and fluid view switching for a premium feel.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3 (Custom Properties & Grid/Flexbox), Vanilla JavaScript.
- **Image Hosting**: [Cloudinary](https://cloudinary.com/) (CDN & Dynamic Image Processing).
- **Typography**: Playfair Display (Serif) & Inter (Sans-serif) via Google Fonts.
- **Icons**: Custom Inline SVGs.

## 🚀 Usage & Customization

### 1. Prerequisites
You will need a [Cloudinary](https://cloudinary.com/) account (Free tier is sufficient) to host your images while keeping the repository lightweight.

### 2. Cloudinary Configuration
Locate the script section in `index.html` and replace `YOUR_CLOUD_NAME` with your actual cloud name found in your Cloudinary dashboard:

const CLOUD = 'your_cloud_name_here';

3. Adding Photographs
The gallery data is stored in the SERIES array. To add or update photos:

Upload your photos to Cloudinary.

Note the public_id (e.g., yogyakarta/photo-name).

Add a new object to the photos array within the desired series:

{
  title: 'Photo Title',
  img: cld('folder/public_id'),
  cam: 'Camera Model',
  lens: 'Lens Used',
  iso: '100',
  ss: '1/100s',
  ap: 'f/2.8'
}

📂 Project Structure
.
├── index.html          # Main single-file source (Structure, Styles, & Logic)
└── README.md           # Project documentation

📝 License
This project was created for personal portfolio purposes. The code is available under the MIT License. All photographs within the gallery are the intellectual property of Irvan Maulana.

Built with the help of Claude AI. Developed by Irvan Maulana.

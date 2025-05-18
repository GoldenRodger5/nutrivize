# Nutrition Label OCR Scanner Feature

This feature allows users to upload images of nutrition labels, which are then processed using OCR (Optical Character Recognition) and AI to extract nutrition information automatically.

## Features

- Upload nutrition label images via drag-and-drop or file selection
- Process images using Google Cloud Vision OCR
- Analyze OCR text using Anthropic Claude AI to extract structured nutrition data
- Automatically fill food creation form with the extracted data
- Allow users to edit extracted data before saving to the food database

## Requirements

- Google Cloud Vision API credentials
- Anthropic Claude API key

## Installation

1. Run the setup script to install necessary dependencies:
   ```
   ./setup_ocr_feature.sh
   ```

2. Set the required environment variables:
   ```
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/food-tracker-6096d-4007a1f2a2ab.json
   export ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

3. Start the backend server:
   ```
   cd backend
   python -m uvicorn app.main:app --reload
   ```

4. Start the frontend development server:
   ```
   cd frontend
   npm run dev
   ```

## Usage

1. Navigate to the Food Index page in the application
2. Click the "Add Food" button to open the food creation modal
3. Click the "Scan Nutrition Label" button
4. Upload an image of a nutrition label via drag-and-drop or by clicking the upload area
5. Click "Extract Nutrition Info" to process the image
6. Review and edit the extracted nutrition information
7. Click "Add Food" to save the food to your database

## How It Works

1. **Frontend**: The user uploads an image through the drag-and-drop interface in the AddFoodModal component.
2. **Backend**: The image is sent to the `/nutrition-label/upload` endpoint.
3. **OCR Processing**: Google Cloud Vision API extracts text from the image.
4. **AI Analysis**: Anthropic Claude analyzes the raw text and extracts structured nutrition information.
5. **Form Population**: The extracted data is sent back to the frontend, which auto-fills the food creation form.
6. **User Verification**: The user can review and edit the information before saving it to the database.

## Troubleshooting

- **No text extracted**: Ensure the image is clear and the nutrition label is well-lit and readable
- **Incorrect information extracted**: Verify the image quality and edit incorrect values manually
- **API errors**: Check your environment variables for the Google Cloud and Anthropic API credentials

## Limitations

- OCR accuracy depends on image quality and label clarity
- Some nutrition labels with unusual formats may not be processed correctly
- The feature works best with standard US-format nutrition labels

## Future Improvements

- Support for additional label formats (international labels)
- Improved OCR accuracy for low-quality images
- Barcode scanning for quicker food identification 
import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Helper function to generate random date between first APOD and today
function getRandomAPODDate() {
    const firstAPODDate = new Date('1995-06-16'); // First APOD ever published
    const today = new Date();
    
    // Calculate random timestamp between first APOD and today
    const randomTimestamp = firstAPODDate.getTime() + 
        Math.random() * (today.getTime() - firstAPODDate.getTime());
    
    const randomDate = new Date(randomTimestamp);
    
    // Format as YYYY-MM-DD
    return randomDate.toISOString().split('T')[0];
}

// Main route - Server-Side Rendering of random APOD
router.get('/', async (req, res) => {
    try {
        // Get a random date for APOD
        const randomDate = getRandomAPODDate();
        console.log(`Fetching random APOD for date: ${randomDate}`);
        
        const apodResponse = await axios.get(
            `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}&date=${randomDate}`
        );
        const apodData = apodResponse.data;
        console.log(`Loaded APOD: ${apodData.title} (${apodData.date})`);
        
        res.render('index', { apod: apodData, error: null });
    } catch (error) {
        console.error("Error fetching APOD data:", error);
        res.render('index', { 
            apod: null, 
            error: error.message || 'Failed to fetch APOD data. Please check your API key and try again.' 
        });
    }
});

export default router;

import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Main route - Server-Side Rendering of APOD
router.get('/', async (req, res) => {
    try {
        const apodResponse = await axios.get(`https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`);
        const apodData = apodResponse.data;
        console.log(apodData);
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

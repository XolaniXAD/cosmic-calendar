import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// GET /api/apod - Get APOD for today or specific date
router.get('/apod', async (req, res) => {
    const { date } = req.query;
    
    try {
        // Build URL with optional date parameter
        let url = `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`;
        if (date) {
            url += `&date=${date}`;
        }
        
        const apodResponse = await axios.get(url);
        res.json(apodResponse.data);
    } catch (error) {
        console.error("Error fetching APOD data:", error);
        
        // Handle different error types
        if (error.response) {
            const status = error.response.status;
            if (status === 400) {
                return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
            } else if (status === 401) {
                return res.status(401).json({ error: 'Invalid API key' });
            }
            return res.status(status).json({ error: error.message });
        }
        
        res.status(500).json({ error: error.message || 'Failed to fetch APOD data' });
    }
});

export default router;

import CosmicCalendarClient from './CosmicCalendarClient';

async function getInitialAPOD() {
  try {
    const apiKey = process.env.NASA_API_KEY;
    const response = await fetch(
      `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`,
      { next: { revalidate: 3600 } }
    );
    
    if (!response.ok) {
      throw new Error('Failed to fetch APOD');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching initial APOD:', error);
    return null;
  }
}

export default async function Page() {
  const initialApod = await getInitialAPOD();
  
  return <CosmicCalendarClient initialApod={initialApod} />;
}

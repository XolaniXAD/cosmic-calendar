import { NextResponse } from 'next/server';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  try {
    let url = `https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`;
    if (date) {
      url += `&date=${date}`;
    }

    const response = await fetch(url, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 400) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      } else if (status === 401) {
        return NextResponse.json(
          { error: 'Invalid API key' },
          { status: 401 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to fetch APOD data' },
        { status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching APOD:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch APOD data' },
      { status: 500 }
    );
  }
}

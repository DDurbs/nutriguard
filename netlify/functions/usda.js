// Netlify serverless function — proxies USDA FoodData Central API
// The API key lives only here, as a Netlify environment variable
// It is never exposed to the browser or public code

exports.handler = async (event) => {
  const API_KEY = process.env.USDA_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'API key not configured' })
    };
  }

  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const params = event.queryStringParameters || {};
  const type = params.type || 'search'; // 'search' or 'food'
  const id = params.id;
  const query = params.query;
  const pageSize = params.pageSize || '12';
  const dataType = params.dataType || 'SR Legacy,Foundation,Survey (FNDDS)';

  let url;

  if (type === 'food' && id) {
    // Direct food lookup by FDC ID
    url = `https://api.nal.usda.gov/fdc/v1/food/${id}?api_key=${API_KEY}`;
  } else if (type === 'search' && query) {
    // Search by name
    url = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(query)}&pageSize=${pageSize}&dataType=${encodeURIComponent(dataType)}&api_key=${API_KEY}`;
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required parameters' })
    };
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch from USDA API' })
    };
  }
};

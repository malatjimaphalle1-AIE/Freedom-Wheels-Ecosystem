export async function fetchWithRetry(url: string, options: any = {}, retries = 3, backoff = 1000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
       throw new Error(`Expected JSON but got ${contentType}`);
    }
    return await response.json();
  } catch (error: any) {
    if (retries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

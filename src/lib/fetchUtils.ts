export async function fetchWithRetry(url: string, options: any = {}, retries = 3, backoff = 1000) {
  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    let payload: any = null;
    if (isJson) {
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }
    } else {
      const text = await response.text();
      payload = text ? { message: text } : null;
    }

    if (!response.ok) {
      const backendMessage =
        payload?.error || payload?.message || payload?.details || payload?.status || null;
      throw new Error(
        backendMessage
          ? `HTTP ${response.status}: ${backendMessage}`
          : `HTTP error! status: ${response.status}`
      );
    }

    if (!isJson) {
      throw new Error(`Expected JSON but got ${contentType || "unknown content type"}`);
    }

    return payload;
  } catch (error: any) {
    if (retries > 0 && (error.name === 'AbortError' || error.message.includes('fetch'))) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
}

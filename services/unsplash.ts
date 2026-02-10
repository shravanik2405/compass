type UnsplashPhoto = {
  id: string;
  alt_description: string | null;
  description: string | null;
  urls: {
    raw?: string;
    regular?: string;
    full?: string;
    small?: string;
  };
};

export type UnsplashPhotoItem = {
  id: string;
  uri: string;
  label: string;
};

const UNSPLASH_ENDPOINT = "https://api.unsplash.com/photos/random";
const CAT_QUERY = "cats";
const DOG_QUERY = "dogs";

const toTitleCase = (value: string) =>
  value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

const withImageParams = (url: string) => {
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}auto=format&fit=crop&w=1200&h=1800&q=90`;
};

const mapToPhotoItem = (
  photo: UnsplashPhoto,
  index: number,
  fallbackPrefix: string,
): UnsplashPhotoItem | null => {
  const sourceUrl =
    photo.urls.raw ?? photo.urls.regular ?? photo.urls.full ?? photo.urls.small;
  if (!sourceUrl) {
    return null;
  }

  const rawLabel =
    photo.alt_description ?? photo.description ?? `${fallbackPrefix} ${index + 1}`;

  return {
    id: `unsplash-${photo.id}-${index}`,
    uri: withImageParams(sourceUrl),
    label: toTitleCase(rawLabel),
  };
};

async function fetchByQuery(
  query: string,
  count: number,
  accessKey: string,
  fallbackPrefix: string,
): Promise<UnsplashPhotoItem[]> {
  if (count <= 0) {
    return [];
  }
  const params = [
    `count=${encodeURIComponent(String(count))}`,
    "orientation=portrait",
    `query=${encodeURIComponent(query)}`,
  ].join("&");

  const response = await fetch(`${UNSPLASH_ENDPOINT}?${params}`, {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
  });

  if (!response.ok) {
    throw new Error(`Unsplash request failed: ${response.status}`);
  }

  const payload = (await response.json()) as UnsplashPhoto | UnsplashPhoto[];
  const photos = Array.isArray(payload) ? payload : [payload];
  return photos
    .map((photo, index) => mapToPhotoItem(photo, index, fallbackPrefix))
    .filter((photo): photo is UnsplashPhotoItem => photo !== null);
}

const interleave = <T>(a: T[], b: T[]) => {
  const merged: T[] = [];
  const maxLength = Math.max(a.length, b.length);
  for (let i = 0; i < maxLength; i += 1) {
    if (i < a.length) {
      merged.push(a[i]);
    }
    if (i < b.length) {
      merged.push(b[i]);
    }
  }
  return merged;
};

export async function fetchUnsplashPhotos(
  count: number,
): Promise<UnsplashPhotoItem[]> {
  const accessKey = process.env.EXPO_PUBLIC_UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return [];
  }

  const catCount = Math.ceil(count / 2);
  const dogCount = Math.floor(count / 2);
  const [catsResult, dogsResult] = await Promise.allSettled([
    fetchByQuery(CAT_QUERY, catCount, accessKey, "Cat"),
    fetchByQuery(DOG_QUERY, dogCount, accessKey, "Dog"),
  ]);

  const cats = catsResult.status === "fulfilled" ? catsResult.value : [];
  const dogs = dogsResult.status === "fulfilled" ? dogsResult.value : [];
  return interleave(cats, dogs).slice(0, count);
}

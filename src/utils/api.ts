import { IMAGE_STORE_SERVICE_URL, FEATURE_DETECTION_SERVICE_URL } from '../constants';

export async function uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${IMAGE_STORE_SERVICE_URL}/images`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) {
        throw new Error(`Failed to upload image: ${res.status} ${res.statusText}`);
    }
    const data = await res.json() as { id: string };
    return data.id;
}

export async function requestFeatureDetection(imageId: string, featureType: string): Promise<unknown> {
    const res = await fetch(`${FEATURE_DETECTION_SERVICE_URL}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_id: imageId, feature_type: featureType }),
    });
    if (!res.ok) {
        throw new Error(`Feature detection failed: ${res.status} ${res.statusText}`);
    }
    return res.json();
}

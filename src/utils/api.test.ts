/* eslint-env node */
import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { uploadImage, requestFeatureDetection } from './api';

const originalFetch = globalThis.fetch;
afterEach(() => {
    globalThis.fetch = originalFetch;
});

test('uploadImage posts file and returns id', async () => {
    const file = new File(['data'], 'test.png', { type: 'image/png' });
    const expectedId = 'abc123';
    globalThis.fetch = async (input, init) => {
        assert.equal(input, 'http://localhost:8000/images');
        const req = init as RequestInit;
        assert.equal(req.method, 'POST');
        const body = req.body as FormData;
        const uploaded = body.get('file') as File;
        assert.equal(uploaded.name, 'test.png');
        return new Response(JSON.stringify({ id: expectedId }), { status: 200 });
    };
    const id = await uploadImage(file);
    assert.equal(id, expectedId);
});

test('requestFeatureDetection sends correct payload', async () => {
    const imageId = 'img1';
    const featureType = 'faces';
    const response = { features: [] };
    globalThis.fetch = async (input, init) => {
        assert.equal(input, 'http://localhost:8001/detect');
        const req = init as RequestInit;
        assert.equal(req.method, 'POST');
        const headers = req.headers as Record<string, string>;
        assert.equal(headers['Content-Type'], 'application/json');
        const body = JSON.parse(String(req.body));
        assert.deepEqual(body, { image_id: imageId, feature_type: featureType });
        return new Response(JSON.stringify(response), { status: 200 });
    };
    const data = await requestFeatureDetection(imageId, featureType);
    assert.deepEqual(data, response);
});

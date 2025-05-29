// src/services/__tests__/apiService.test.js
import apiService from '../apiService';

describe('ApiService', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    window.scrivaniaPusherConfig = { nonce: 'test-nonce' };
  });

  test('getSessionData invia la richiesta corretta', async () => {
    const mockResponse = { success: true, session_id: '123' };
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    const result = await apiService.getSessionData('test-token');
    
    expect(global.fetch).toHaveBeenCalledWith(
      '/wp-json/scrivania/v1/get-session',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'X-WP-Nonce': 'test-nonce'
        })
      })
    );
    expect(result).toEqual(mockResponse);
  });
});
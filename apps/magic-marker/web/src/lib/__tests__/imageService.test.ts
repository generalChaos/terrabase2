import { ImageService } from '../imageService';
import { supabase } from '../supabase';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('ImageService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createImage', () => {
    it('should create image successfully', async () => {
      const mockImage = {
        id: 'test-image-id',
        analysis_result: 'Test analysis',
        image_type: 'original',
        file_path: 'test-path',
        file_size: 1024,
        mime_type: 'image/jpeg',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockImage,
              error: null
            }))
          }))
        }))
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await ImageService.createImage(
        'Test analysis',
        'original',
        'test-path',
        1024,
        'image/jpeg'
      );

      expect(result).toEqual(mockImage);
      expect(mockSupabase.from).toHaveBeenCalledWith('images');
    });

    it('should handle creation failure', async () => {
      const mockQuery = {
        insert: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { message: 'Creation failed' }
            }))
          }))
        }))
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      await expect(
        ImageService.createImage('Test analysis', 'original', 'test-path')
      ).rejects.toThrow('Creation failed');
    });
  });

  describe('getImage', () => {
    it('should get image successfully', async () => {
      const mockImage = {
        id: 'test-image-id',
        file_path: 'test-path',
        image_type: 'original',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: mockImage,
              error: null
            }))
          }))
        }))
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await ImageService.getImage('test-image-id');

      expect(result).toEqual(mockImage);
      expect(mockSupabase.from).toHaveBeenCalledWith('images');
    });

    it('should return null when image not found', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => ({
              data: null,
              error: { code: 'PGRST116' }
            }))
          }))
        }))
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await ImageService.getImage('nonexistent-id');

      expect(result).toBeNull();
    });
  });

  describe('getAllImages', () => {
    it('should get all images successfully', async () => {
      const mockImages = [
        {
          id: 'test-image-1',
          file_path: 'test-path-1',
          image_type: 'original',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        },
        {
          id: 'test-image-2',
          file_path: 'test-path-2',
          image_type: 'generated',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
        }
      ];

      const mockQuery = {
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: mockImages,
            error: null
          }))
        }))
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await ImageService.getAllImages();

      expect(result).toEqual(mockImages);
      expect(mockSupabase.from).toHaveBeenCalledWith('images');
    });

    it('should return empty array on error', async () => {
      const mockQuery = {
        select: jest.fn(() => ({
          order: jest.fn(() => ({
            data: null,
            error: { message: 'Database error' }
          }))
        }))
      };

      mockSupabase.from.mockReturnValue(mockQuery as any);

      const result = await ImageService.getAllImages();

      expect(result).toEqual([]);
    });
  });
});

import { itemRepository, ItemWithUrls, ItemWithPrice } from '../repositories/item.repository.js';
import { NotFoundError, ValidationError } from '../utils/errors.js';

export interface CreateItemInput {
  name: string;
  urls: string[];
  category?: string;
  imageUrl?: string;
}

export interface UpdateItemInput {
  name?: string;
  category?: string;
  imageUrl?: string;
}

export interface AddUrlInput {
  url: string;
  storeName?: string;
}

export const itemsService = {
  async createItem(userId: string, input: CreateItemInput): Promise<ItemWithUrls> {
    if (!input.urls || input.urls.length === 0) {
      throw new ValidationError('At least one URL is required');
    }
    if (input.urls.length > 5) {
      throw new ValidationError('Maximum 5 URLs per item');
    }

    const urlsWithStores = input.urls.map(url => {
      try {
        const hostname = new URL(url).hostname.replace('www.', '');
        const storeName = hostname.split('.')[0];
        return { url, storeName };
      } catch {
        throw new ValidationError(`Invalid URL: ${url}`);
      }
    });

    return itemRepository.create(
      userId,
      input.name,
      input.imageUrl ?? null,
      input.category ?? null,
      urlsWithStores
    );
  },

  async getItems(
    userId: string,
    cursor?: string,
    limit: number = 20
  ): Promise<{ items: ItemWithPrice[]; nextCursor: string | null; hasMore: boolean }> {
    const result = await itemRepository.findByUserId(userId, cursor, limit);
    return {
      items: result.items,
      nextCursor: result.nextCursor,
      hasMore: result.nextCursor !== null,
    };
  },

  async getItem(itemId: string, userId: string): Promise<ItemWithUrls> {
    const item = await itemRepository.findById(itemId, userId);
    if (!item) {
      throw new NotFoundError('Item');
    }
    return item;
  },

  async updateItem(
    itemId: string,
    userId: string,
    input: UpdateItemInput
  ): Promise<ItemWithUrls> {
    const item = await itemRepository.update(itemId, userId, input);
    if (!item) {
      throw new NotFoundError('Item');
    }
    return this.getItem(itemId, userId);
  },

  async deleteItem(itemId: string, userId: string): Promise<void> {
    const deleted = await itemRepository.softDelete(itemId, userId);
    if (!deleted) {
      throw new NotFoundError('Item');
    }
  },

  async addUrl(
    itemId: string,
    userId: string,
    input: AddUrlInput
  ): Promise<{ id: string; url: string; storeName: string | null }> {
    const item = await itemRepository.findById(itemId, userId);
    if (!item) {
      throw new NotFoundError('Item');
    }

    const exists = await itemRepository.urlExists(itemId, input.url);
    if (exists) {
      throw new ValidationError('This URL is already being tracked for this item');
    }

    let storeName = input.storeName;
    if (!storeName) {
      try {
        const hostname = new URL(input.url).hostname.replace('www.', '');
        storeName = hostname.split('.')[0];
      } catch {
        throw new ValidationError(`Invalid URL: ${input.url}`);
      }
    }

    const trackedUrl = await itemRepository.addUrl(itemId, input.url, storeName);
    return {
      id: trackedUrl.id,
      url: trackedUrl.url,
      storeName: trackedUrl.store_name,
    };
  },

  async removeUrl(itemId: string, urlId: string, userId: string): Promise<void> {
    const removed = await itemRepository.removeUrl(itemId, urlId, userId);
    if (!removed) {
      throw new NotFoundError('URL');
    }
  },
};

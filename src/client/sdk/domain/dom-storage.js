import BaseDomain from './domain';
import { Event } from './protocol';
export default class DomStorage extends BaseDomain {
  namespace = 'DOMStorage';

  /**
   * @static
   * @param {Boolean} isLocalStorage
   */
  static getStorage({ isLocalStorage }) {
    return isLocalStorage ? localStorage : sessionStorage;
  }

  /**
   * @public
   * @param {Object} param
   * @param {String} param.storageId
   */
  getDOMStorageItems({ storageId }) {
    const storage = DomStorage.getStorage(storageId);
    return { entries: Object.entries(storage) };
  }

  /**
   * @public
   * @param {Object} param
   * @param {String} param.key
   * @param {String} param.storageId
   */
  removeDOMStorageItem({ key, storageId }) {
    const storage = DomStorage.getStorage(storageId);
    storage.removeItem(key);

    this.send({
      method: Event.domStorageItemRemoved,
      params: { key, storageId }
    });
  }

  /**
   * @public
   * @param {Object} param
   * @param {String} param.storageId
   */
  clear({ storageId }) {
    const storage = DomStorage.getStorage(storageId);
    storage.clear();

    this.send({
      method: Event.domStorageItemsCleared,
      params: { storageId },
    });
  }

  setDOMStorageItem({ storageId, key, value }) {
    const storage = DomStorage.getStorage(storageId);
    storage.setItem(key, value);
  }
};

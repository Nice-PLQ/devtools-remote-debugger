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
   */
  enable() {
    this.hookStorage(localStorage);
    this.hookStorage(sessionStorage);
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

  hookStorage(storage) {
    const _this = this;

    const storageId = {
      isLocalStorage: storage === localStorage,
      securityOrigin: location.origin,
      storageKey: location.origin,
    };

    const {
      setItem: nativeSetItem,
      removeItem: nativeRemoveItem,
      clear: nativeClear,
    } = Storage.prototype;

    Storage.prototype.setItem = function (key, newValue) {
      const isKeyExisted = Object.keys(storage).includes(key);
      const oldValue = this.getItem(key);
      nativeSetItem.call(this, key, newValue);

      _this.send({
        method: isKeyExisted ? Event.domStorageItemUpdated : Event.domStorageItemAdded,
        params: {
          storageId,
          key,
          newValue,
          oldValue,
        }
      });
    };

    Storage.prototype.removeItem = function (key) {
      nativeRemoveItem.call(this, key);

      _this.send({
        method: Event.domStorageItemRemoved,
        params: { storageId, key }
      });
    };

    Storage.prototype.clear = function () {
      nativeClear.call(this);

      _this.send({
        method: Event.domStorageItemsCleared,
        params: { storageId }
      });
    };
  }
};

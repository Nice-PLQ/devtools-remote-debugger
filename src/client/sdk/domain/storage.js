import BaseDomain from './domain';
export default class Storage extends BaseDomain {
  namespace = 'Storage';

  /**
   * @public
   */
  getStorageKeyForFrame() {
    return {
      storageKey: location.origin
    };
  }
};

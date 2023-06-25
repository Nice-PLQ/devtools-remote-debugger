import BaseDomain from './domain';
export default class Storage extends BaseDomain {
  namespace = 'Storage';

  /**
   * @public
   */
  getStorageKeyForFrame() {
    debugger
    return {
      storageKey: location.origin
    };
  }
};

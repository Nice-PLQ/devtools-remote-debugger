const objectIds = new Map();
const objects = new Map();
const origins = new Map();
let currentId = 1;

const getIdByObject = (object, origin) => {
  let id = objectIds.get(object);
  if (id) return id;

  // eslint-disable-next-line
  id = `${currentId++}`;
  objects.set(id, object);
  objectIds.set(object, id);
  origins.set(id, origin);
  return id;
};

const getRealType = (val) => {
  const reg = /\[object\s+(.*)\]/;
  const res = reg.exec(Object.prototype.toString.call(val));
  return res ? res[1] : '';
};

const getSubType = (val) => {
  // DOM node type
  try {
    if (val && [1, 8, 9].includes(val.nodeType)) return 'node';
  } catch { };

  const realType = getRealType(val).toLowerCase();
  return [
    'array', 'null', 'regexp', 'date', 'map', 'set', 'weakmap', 'weakset',
    'error', 'proxy', 'promise', 'arraybuffer', 'iterator', 'generator',
  ].includes(realType)
    ? realType
    : '';
};

const getType = val => ({
  type: typeof val,
  subtype: getSubType(val),
});

const getPreview = (val, others = {}) => {
  const { length = 5, origin = val } = others;
  // TODO: Map/Set data types pending
  // if (subtype === 'map' || subtype === 'set') {

  // }

  const keys = Object.keys(val);
  const properties = [];
  keys.slice(0, length).forEach((key) => {
    let subVal;
    try {
      subVal = origin[key];
    } catch (e) { }

    const { type, subtype } = getType(subVal);
    if (type === 'object') {
      if (subtype === 'array') {
        subVal = `Array(${subVal.length})`;
      } else if (subtype === 'null') {
        subVal = 'null';
      } else if (['date', 'regexp'].includes(subtype)) {
        subVal = subVal.toString();
      } else if (subtype === 'node') {
        subVal = `#${subVal.nodeName}`;
      } else {
        subVal = subVal.constructor.name;
      }
    } else {
      subVal = subVal === undefined ? 'undefined' : subVal.toString();
    }
    properties.push({
      name: key,
      type,
      subtype,
      value: subVal,
    });
  });

  return {
    overflow: keys.length > length,
    properties,
  };
};

export function objectFormat(val, others = {}) {
  const { origin = val, preview = false } = others;

  const { type, subtype } = getType(val);

  if (type === 'undefined') return { type };

  if (type === 'number') return { type, value: val, description: val.toString() };

  if (type === 'string' || type === 'boolean') return { type, value: val };

  if (type === 'symbol') {
    return {
      type,
      objectId: getIdByObject(val, origin),
      description: val.toString(),
    };
  }

  if (subtype === 'null') return { type, subtype, value: val };

  const res = { type, subtype, objectId: getIdByObject(val, origin) };
  // Some different data types need to be processed separately
  // function
  if (type === 'function') {
    res.className = 'Function';
    res.description = val.toString();
    preview && (res.preview = {
      type,
      subtype,
      description: val.toString(),
      ...getPreview(val, { origin }),
    });
    // Array
  } else if (subtype === 'array') {
    res.className = 'Array';
    res.description = `Array(${val.length})`;
    preview && (res.preview = {
      type,
      subtype,
      description: `Array(${val.length})`,
      ...getPreview(val, { length: 100, origin }),
    });
    // Error
  } else if (subtype === 'error') {
    res.className = 'Error';
    res.description = val.stack;
    preview && (res.preview = {
      type,
      subtype,
      description: val.stack,
      ...getPreview(val, { origin }),
    });
    // HTML Element
  } else if (subtype === 'node') {
    res.className = val.constructor.name;
    res.description = val.constructor.name;
  } else {
    res.className = val.constructor.name;
    res.description = val.constructor.name;
    preview && (res.preview = {
      type,
      subtype,
      description: val.constructor.name,
      ...getPreview(val, { origin }),
    });
  }

  return res;
}

// Get object properties, the level can be infinitely deep
export function getObjectProperties(params) {
  // ownProperties identifies whether it is a property of the object itself
  const { accessorPropertiesOnly, generatePreview, objectId, ownProperties } = params;
  const curObject = objects.get(objectId);
  const origin = origins.get(objectId);
  const result = [];
  // eslint-disable-next-line no-proto
  const proto = curObject.__proto__;

  // If the current object has a __proto__ prototype and needs to obtain non-self attributes (that is, attributes under __proto__)
  // otherwise the current object
  const nextObject = proto && !ownProperties ? proto : curObject;

  const keys = Object.getOwnPropertyNames(nextObject);

  for (const key of keys) {
    // Skip key is an attribute of __proto__
    if (key === '__proto__') continue;
    const property = { name: key };

    let propVal;
    try {
      propVal = origin[key];
    } catch (e) {
      // nothing to do
    }

    const descriptor = Object.getOwnPropertyDescriptor(nextObject, key);

    if (accessorPropertiesOnly && !descriptor.get && !descriptor.set) continue;

    property.configurable = descriptor.configurable;
    property.enumerable = descriptor.enumerable;
    property.writable = descriptor.writable;
    // eslint-disable-next-line no-prototype-builtins
    property.isOwn = ownProperties ? true : proto.hasOwnProperty(key);
    property.value = objectFormat(propVal, { preview: generatePreview });

    result.push(property);
  }

  // Append __proto__ prototype
  if (proto) {
    result.push({
      name: '__proto__',
      configurable: true,
      enumerable: false,
      isOwn: ownProperties,
      value: objectFormat(proto, { origin }),
    });
  }

  return result;
}

// release object
export function objectRelease({ objectId }) {
  const object = objects.get(objectId);
  objects.delete(objectId, object);
  objectIds.delete(object, objectId);
  origins.delete(objectId, origin);
}

export function getObjectById(objectId) {
  return objects.get(objectId);
}

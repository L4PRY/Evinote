//export const URLFile = /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:[0-9]+)?(\/[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)*\/[a-zA-Z0-9._-]+\.[a-zA-Z0-9]+(\?[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=-]*)?$/;
export const URLFile = /^(https?:\/\/[a-zA-Z0-9\-\.]*)(.*)+$/; // temporary, need to find a more-specific regex that is more safe somehow? like no string escapes and shit
export const Email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const Username = /^[a-z0-9_]+$/;

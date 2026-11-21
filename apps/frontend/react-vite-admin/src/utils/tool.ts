export function isDev() {
  return import.meta.env.DEV;
}

export function buildSocketUrl() {
  const wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${wsProtocol}://${location.host}/ws`;
}
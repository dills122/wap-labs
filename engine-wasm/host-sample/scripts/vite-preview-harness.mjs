import { createServer as createNetServer } from 'node:net';
import { build as buildVite, preview as previewVite } from 'vite';

const reservePort = async () =>
  new Promise((resolve, reject) => {
    const reservation = createNetServer();
    reservation.once('error', reject);
    reservation.listen(0, '127.0.0.1', () => {
      const address = reservation.address();
      if (!address || typeof address === 'string') {
        reservation.close();
        reject(new Error('Could not reserve an ephemeral localhost port'));
        return;
      }
      reservation.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(address.port);
      });
    });
  });

export const startVitePreview = async ({ root, configFile, entry, outDir }) => {
  const port = await reservePort();
  await buildVite({
    root,
    configFile,
    logLevel: 'error',
    build: {
      outDir,
      emptyOutDir: true,
      ...(entry ? { rollupOptions: { input: entry } } : {})
    }
  });
  const server = await previewVite({
    root,
    configFile,
    logLevel: 'error',
    build: { outDir },
    preview: {
      host: '127.0.0.1',
      port,
      strictPort: true
    }
  });
  const address = server.httpServer?.address();
  if (!address || typeof address === 'string') {
    await server.close();
    throw new Error('Vite preview did not expose a local TCP address');
  }
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}/${entry ? entry.split('/').at(-1) : ''}`
  };
};

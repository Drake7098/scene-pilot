export const onRequest = async (context: { next: () => Promise<Response> }) => {
  return context.next();
};

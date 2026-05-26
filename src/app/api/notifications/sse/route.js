export async function GET(request) {
  const token = request.cookies.get('token')?.value;
  // ... verify user
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      // Poll DB every 2 seconds for new notifications
      let lastChecked = new Date();
      const interval = setInterval(async () => {
        const newNotifs = await prisma.notification.findMany({
          where: { userId: decoded.id, createdAt: { gt: lastChecked } },
        });
        lastChecked = new Date();
        if (newNotifs.length) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(newNotifs)}\n\n`));
        }
      }, 2000);
      // Cleanup on close
      request.signal.addEventListener('abort', () => clearInterval(interval));
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache' },
  });
}
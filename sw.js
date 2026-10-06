/*
 * Service worker нужен ровно для Web Push. Он ничего не кеширует и не
 * перехватывает: приложение по-прежнему загружает свежую статику с Pages.
 */

self.addEventListener('push', (event) => {
  let message = {};
  try {
    message = event.data ? event.data.json() : {};
  } catch {
    // Повреждённое тело всё равно превращается в безопасный общий зов: каждый
    // принятый push обязан быть видимым пользователю.
  }

  const title = typeof message.title === 'string' ? message.title : 'Ося';
  const body = typeof message.body === 'string'
    ? message.body
    : 'У Оси всё готово для короткого занятия.';
  const url = typeof message.url === 'string' ? message.url : './';
  const icon = new URL('icon-192.png', self.registration.scope).href;

  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon,
    badge: icon,
    lang: 'ru',
    tag: 'osya-lesson-reminder',
    renotify: false,
    data: { url: new URL(url, self.registration.scope).href },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || self.registration.scope;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if (new URL(client.url).origin !== new URL(target).origin) continue;
      await client.navigate(target);
      return client.focus();
    }
    return self.clients.openWindow(target);
  })());
});

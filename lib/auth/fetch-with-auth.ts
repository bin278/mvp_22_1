// 带认证的fetch函数
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  // 获取认证token
  let token: string | null = null;
  try {
    // 从localStorage获取session
    if (typeof window !== 'undefined') {
      const sessionData = localStorage.getItem('cloudbase_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        token = session?.accessToken || session?.token || null;
      }
    }
  } catch (error) {
    console.warn('获取token失败:', error);
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 如果有token，添加到Authorization头
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 如果返回401，尝试刷新token
  if (response.status === 401) {
    try {
      // 清除本地token
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cloudbase_token');
      }

      // 可以在这里添加刷新token的逻辑
      // const refreshResponse = await fetch('/api/auth/refresh', { method: 'POST' });

    } catch (refreshError) {
      console.error('刷新token失败:', refreshError);
    }
  }

  return response;
}

import { SignJWT, importPKCS8 } from 'jose';
import { v4 as uuidv4 } from 'uuid';
//基本信息
const baseURL = 'https://api.coze.cn';                      
const appId = '1186381766059';
const keyid = 'hs6iFi6ZLo6fSqIcjsEoakh73gIGXxldmvAE-2K_F0Y';
const aud = 'api.coze.cn';

// 私人密钥，用于私钥签署 JWT，并获取 Oauth Access Token
const privateKeyPEM = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQCc7v3JMbOHvNgn
xst0Fg2viAMcy9q1YF5Sxi4fZkHDBWlt0XgYzk6bb6wDqiJCzkTocyY6P0IcIwPc
HG4PJESV0dn70doj+w80j+/wfYt+8L9q1Osw/Ary2udPgsCMYNMO3djZ7DjRkO6b
+h+wlwHcQ+Igay3uRrvs4ljkjlZsdFiNgtu0G7gjkRxuf8zV4wu2zp+LSw8DyRJU
NksQBuqYdwz4BruParXwSkAPAPaN+T28VdInBr2A/+zc+Os3uIKr/fBaj0odkT3A
JSYpg4KaJvMqJMX5tzeF/BknE8D5MXlKByvgls5aJoXk9xnaysrrUhsVIFzrpvMW
eouRKkRXAgMBAAECggEAQLW9WQpQ9H4WhWRP/VigoQoM+oFGeDa5/hiw6QqhwDhJ
jlpq0pOzTx2fiM1NHk3ulQjyMN9ns7FuhIMGkODMFRj4cQFJmT+LOAnIDtq9vASq
cXNFXaf4HcbMzXjlS50bOkyY/9cLYMKJ2TAshAToY/pr0iFPyapKEDYPIINeuI4l
CIgWHTTyB78Bo6wcjTXflaQCZs0elDpI1NLkiu6hJMlJAJtfOZf/uSUfZAiJFnJh
YvfPJ6t5Gb1HAYgu9zo3Yodnk4bR619cDRsEK/hm9oNJG5MvVcr3bI7PeRSfrCen
khKs06sEXAh5ZlreMsHOX4jK4Bx/3YEhSbM8tx9ESQKBgQDbBm3M0rjO8vRZsli9
W2Hog6zgiYCuweYuZkQXePshe6vGFbsJCAsBZZaml6OkOZoC8+rnMndcqd79dlgo
nFG/tx6TO0CiogGVKTDsZHB8SmgAgumZmu0aDqsf2BIItz2ocgOpVSPhknclAf6C
sUcKAgYzYQgIAD1HrQ+7/zKpHwKBgQC3bSmPwtIGZOFts5YeKeqUz+dM83ZJt53B
DX/T4jISKofqKmqoUlwIBy+jD6lmZ033WpQPE7O+VGdlD28777TtzAL/ECy7KCCz
ArOzaTnRdNYDmPKNZm1ED0/pngM5PhkzJTpMok8v1zCJhg9MHS9pf6AvQXmNEAu6
7jjoF84lyQKBgQC+GZxfdF33MSQoXgVrhM878l2wHWhVRfI1P4nGHblKXH7A1Meb
lSGIOtZBDch4l443FeJCfKjhAoeK0pa92L+TeKrO+1SkU5ywDCpsYtjG6AXQu89p
BPDZ9vVMFEvCyNh5RUwsQrt745YJxutSH/AanZsoKQXBfAO0HF9VurAL3QKBgQCD
7N+XpmeocaYxYJj32O3/WgjiL7lEC+xKjYsCug2JQ029/gP4TEQlAgYhIYKVRHev
EFatAV6l5c73wMIgOafH4JPHH7sMYTAjkC3vPB95pq7Gp5rMWH7+FIVFYYCwCxnU
z1G/DH4nyn3+a41VESiomEJ9unnSG1hUekIzq+t5AQKBgDKPlgush1cwmiAPpGxu
oR6CmqVCR4gcUW9AFXh/Hr6XooV+L/9s52pUR2QAy9ftLNwVe/8bb9/X1sBTlKu/
B+2LDRi2yuOOkaYWYTn7ZwPqs5UBE81kpCu+TNGef8CgqQPoTHuc/HrxaBBOgAvg
C6lNplccaABCODxwaqpA55x2
-----END PRIVATE KEY-----`;
//存储用户ID的MAP
const tokenCache = new Map<string, any>();

function getSessionId() {
  if (typeof window === 'undefined') return 'server-side-session';      //判断是否为node环境而非浏览器环境
  let sid = localStorage.getItem('coze_session_id');                    //在浏览器环境中，自带属性，通过localStorage获取用户ID
  if (!sid) {
    sid = uuidv4();
    localStorage.setItem('coze_session_id', sid);
  }
  return sid;
}

export async function getCozeToken() {
  const effectiveSessionId = getSessionId();
  const cachedToken = tokenCache.get(effectiveSessionId);
  if (cachedToken && cachedToken.expires_in * 1000 > Date.now() + 5000) {
    return cachedToken;
  }
  console.log(`refresh token for session: ${effectiveSessionId}`);

  try {
    const privateKey = await importPKCS8(privateKeyPEM, 'RS256');
    const now = Math.floor(Date.now() / 1000);
    //生成JWT
    const jwt = await new SignJWT({
      iss: appId,
      aud: aud,
      iat: now,
      exp: now + 3600,
      jti: Math.random().toString(36).substring(2),
      session_name: effectiveSessionId
    })
      .setProtectedHeader({ alg: 'RS256', typ: 'JWT', kid: keyid })
      .sign(privateKey);

    //发送POST请求获取Access Token
    const response = await fetch(`${baseURL}/api/permission/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwt}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        duration_seconds: 3600, 
      }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Coze API error: ${response.status} ${errorText}`);
    }

    const newToken = await response.json();
    tokenCache.set(effectiveSessionId, newToken);
    return newToken;
  } catch (error) {
    console.error("Failed to get Coze token:", error);
    throw error;
  }
}

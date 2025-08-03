import { NextRequest, NextResponse } from 'next/server';

// FastAPI 服务的基础 URL
const FASTAPI_BASE_URL = 'http://localhost:1013';

// 处理 GET 请求 - 获取当前模型
export async function GET(request: NextRequest) {
  try {
    const response = await fetch(`${FASTAPI_BASE_URL}/get_current_model`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('FastAPI Error:', errorText);
      return NextResponse.json(
        { error: `FastAPI server error: ${response.status}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get current model error:', error);
    return NextResponse.json(
      { error: 'Failed to get current model', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 也支持 POST 请求以保持一致性
export async function POST(request: NextRequest) {
  return GET(request);
}

export const runtime = 'edge';
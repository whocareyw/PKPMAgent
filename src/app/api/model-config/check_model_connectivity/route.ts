import { NextRequest, NextResponse } from 'next/server';

// FastAPI 服务的基础 URL
const FASTAPI_BASE_URL = 'http://localhost:1013';

// 处理 GET 请求 - 检测模型联通性
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    const url = searchParams.get('url');
    const api_key = searchParams.get('api_key');
    const id = searchParams.get('id');
    
    // 验证请求参数
    if (!name || !url || !api_key || !id) {
      return NextResponse.json(
        { error: 'name, url, api_key, and id parameters are required' },
        { status: 400 }
      );
    }
    
    const modelConfig = {
      name,
      url,
      api_key,
      id
    };
    
    const queryParams = new URLSearchParams({
      name: modelConfig.name,
      url: modelConfig.url,
      api_key: modelConfig.api_key,
      id: modelConfig.id
    });
    
    const response = await fetch(`${FASTAPI_BASE_URL}/check_model_connectivity?${queryParams}`, {
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
    console.error('Check model connectivity error:', error);
    return NextResponse.json(
      { error: 'Failed to check model connectivity', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 也支持 POST 请求，从请求体中获取参数
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, url, api_key, id } = body;
    
    // 验证请求参数
    if (!name || !url || !api_key || !id) {
      return NextResponse.json(
        { error: 'name, url, api_key, and id are required' },
        { status: 400 }
      );
    }
    
    const modelConfig = {
      name,
      url,
      api_key,
      id
    };
    
    const response = await fetch(`${FASTAPI_BASE_URL}/check_model_connectivity`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelConfig),
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
    console.error('Check model connectivity error:', error);
    return NextResponse.json(
      { error: 'Failed to check model connectivity', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export const runtime = 'edge';
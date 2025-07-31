import { NextRequest, NextResponse } from 'next/server';

// 模型配置的类型定义
interface ModelConfig {
  name: string;
  id: string;
  url: string;
  api_key: string;
}

// FastAPI 服务的基础 URL
const FASTAPI_BASE_URL = 'http://localhost:1013';

// 处理 POST 请求 - 设置模型配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 验证请求体是否为模型配置数组
    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Request body must be an array of ModelConfig objects' },
        { status: 400 }
      );
    }
    
    // 验证每个模型配置对象的必需字段
    for (const model of body) {
      if (!model.name || !model.id || !model.url || !model.api_key) {
        return NextResponse.json(
          { error: 'Each model config must have name, id, url, and api_key fields' },
          { status: 400 }
        );
      }
    }
    
    const response = await fetch(`${FASTAPI_BASE_URL}/set_model_config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
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
    console.error('Set model config error:', error);
    return NextResponse.json(
      { error: 'Failed to set model configuration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 支持 GET 请求用于测试
export async function GET() {
  return NextResponse.json({
    message: 'Set Model Config API endpoint',
    usage: 'POST with array of ModelConfig objects',
    example: [
      {
        name: 'gpt-4',
        id: 'gpt-4',
        url: 'https://api.openai.com/v1',
        api_key: 'your-api-key'
      }
    ]
  });
}

export const runtime = 'edge';
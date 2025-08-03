import { NextRequest, NextResponse } from 'next/server';

// FastAPI 服务的基础 URL
const FASTAPI_BASE_URL = 'http://localhost:1013';

// 处理 POST 请求 - 设置当前模型
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { model_name } = body;
    
    // 验证请求参数
    if (!model_name || typeof model_name !== 'string') {
      return NextResponse.json(
        { error: 'model_name is required and must be a string' },
        { status: 400 }
      );
    }
    
    const response = await fetch(`${FASTAPI_BASE_URL}/set_current_model?model_name=${encodeURIComponent(model_name)}`, {
      method: 'POST',
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
    console.error('Set current model error:', error);
    return NextResponse.json(
      { error: 'Failed to set current model', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// 支持 GET 请求用于测试
export async function GET() {
  return NextResponse.json({
    message: 'Set Current Model API endpoint',
    usage: 'POST with { model_name: string }',
    example: {
      model_name: 'DeepSeek'
    }
  });
}

export const runtime = 'edge';
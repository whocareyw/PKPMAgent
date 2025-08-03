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

// 处理 POST 请求 - 获取模型配置
export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // 根据路径判断调用哪个 FastAPI 端点
    if (pathname.includes('/get_model_config')) {
      return await handleGetModelConfig(request);
    } else if (pathname.includes('/set_model_config')) {
      return await handleSetModelConfig(request);
    } else if (pathname.includes('/check_model_connectivity')) {
      return await handleCheckModelConnectivity(request);
    }
    
    // 默认处理：转发到 get_model_config
    return await handleGetModelConfig(request);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 处理获取模型配置的请求
async function handleGetModelConfig(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${FASTAPI_BASE_URL}/get_model_config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`FastAPI responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Get model config error:', error);
    return NextResponse.json(
      { error: 'Failed to get model configuration' },
      { status: 500 }
    );
  }
}

// 处理设置模型配置的请求
async function handleSetModelConfig(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${FASTAPI_BASE_URL}/set_model_config`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      throw new Error(`FastAPI responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Set model config error:', error);
    return NextResponse.json(
      { error: 'Failed to set model configuration' },
      { status: 500 }
    );
  }
}

// 处理检测模型联通性的请求
async function handleCheckModelConnectivity(request: NextRequest) {
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
      throw new Error(`FastAPI responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Check model connectivity error:', error);
    return NextResponse.json(
      { error: 'Failed to check model connectivity' },
      { status: 500 }
    );
  }
}

// 支持 GET 请求（可选）
export async function GET() {
  return NextResponse.json({
    message: 'Model Config API is running',
    endpoints: {
      get_config: 'POST /api/model-config/get_model_config',
      set_config: 'POST /api/model-config/set_model_config',
      check_connectivity: 'POST /api/model-config/check_model_connectivity'
    }
  });
}

export const runtime = 'edge';
// 模型配置 API 客户端

// 模型配置的类型定义
export interface ModelConfig {
  name: string;
  id: string;
  url: string;
  api_key: string;
}

// API 响应类型
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  details?: string;
}

// 获取模型配置
export async function getModelConfig(models: ModelConfig[]): Promise<ApiResponse<ModelConfig[]>> {
  try {
    const response = await fetch('/api/model-config/get_model_config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(models),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: errorData.error || `HTTP ${response.status}`,
        details: errorData.details
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 设置模型配置
export async function setModelConfig(models: ModelConfig[]): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await fetch('/api/model-config/set_model_config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(models),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: errorData.error || `HTTP ${response.status}`,
        details: errorData.details
      };
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    return {
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 示例用法
export const exampleUsage = {
  // 示例模型配置
  sampleModels: [
    {
      name: 'gpt-4',
      id: 'gpt-4',
      url: 'https://api.openai.com/v1',
      api_key: 'your-openai-api-key'
    },
    {
      name: 'claude',
      id: 'claude-3-sonnet',
      url: 'https://api.anthropic.com',
      api_key: 'your-anthropic-api-key'
    }
  ],

  // 使用示例
  async example() {
    // 获取配置（如果本地有配置会返回本地的，没有的话会保存传入的配置）
    const getResult = await getModelConfig(this.sampleModels);
    if (getResult.error) {
      console.error('获取配置失败:', getResult.error);
      return;
    }
    console.log('当前配置:', getResult.data);

    // 设置新配置
    const setResult = await setModelConfig(this.sampleModels);
    if (setResult.error) {
      console.error('设置配置失败:', setResult.error);
      return;
    }
    console.log('配置保存成功:', setResult.data?.message);
  }
};
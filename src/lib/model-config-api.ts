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

// 设置当前模型
export async function setCurrentModel(modelName: string): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await fetch('/api/model-config/set_current_model', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model_name: modelName }),
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

// 获取当前模型
export async function getCurrentModel(): Promise<ApiResponse<{ current_model: string }>> {
  try {
    const response = await fetch('/api/model-config/get_current_model', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
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

// 检测模型联通性
export async function checkModelConnectivity(modelConfig: ModelConfig): Promise<ApiResponse<{ Success?: string; Error?: string }>> {
  try {
    const response = await fetch('/api/model-config/check_model_connectivity', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(modelConfig),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        error: errorData.error || `HTTP ${response.status}`,
        details: errorData.details
      };
    }

    const data = await response.json();
     // data 内容可能为：{ "Success": "Model connectivity check passed." }
    // 或：{ "Error": "调用模型失败...." }
    if (data.Success) {
      return { data };
    }
    if (data.Error) {
      return { error: data.Error };
    }
    return { error: 'Unknown error' };
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

    // 设置当前模型
    const setCurrentResult = await setCurrentModel('DeepSeek');
    if (setCurrentResult.error) {
      console.error('设置当前模型失败:', setCurrentResult.error);
      return;
    }
    console.log('当前模型设置成功:', setCurrentResult.data?.message);

    // 获取当前模型
    const getCurrentResult = await getCurrentModel();
    if (getCurrentResult.error) {
      console.error('获取当前模型失败:', getCurrentResult.error);
      return;
    }
    console.log('当前模型:', getCurrentResult.data?.current_model);

    // 检测模型联通性
    const connectivityResult = await checkModelConnectivity({
      name: 'DeepSeek',
      id: 'deepseek-chat',
      url: 'https://api.deepseek.com',
      api_key: 'your-deepseek-api-key'
    });
    if (connectivityResult.error) {
      console.error('检测模型联通性失败:', connectivityResult.error);
      return;
    }
    if (connectivityResult.data?.Success) {
      console.log('模型联通性检测成功:', connectivityResult.data.Success);
    } else if (connectivityResult.data?.Error) {
      console.error('模型联通性检测失败:', connectivityResult.data.Error);
    }
  }
};
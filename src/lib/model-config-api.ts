// 模型配置 API 客户端

// 获取服务基础URL
const getBaseUrl = (): string => {
  return process.env.Model_Config_URL || 'http://localhost:1013';
};

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
    const response = await fetch(`${getBaseUrl()}/get_model_config`, {
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
    const response = await fetch(`${getBaseUrl()}/set_model_config`, {
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
    const response = await fetch(`${getBaseUrl()}/set_current_model?model_name=${encodeURIComponent(modelName)}`, {
      method: 'POST',
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

// 获取当前模型
export async function getCurrentModel(): Promise<ApiResponse<{ current_model: string }>> {
  try {
    const response = await fetch(`${getBaseUrl()}/get_current_model`, {
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
    const response = await fetch(`${getBaseUrl()}/check_model_connectivity`, {
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


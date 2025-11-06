// 模型配置 API 客户端

// 获取服务基础URL
const getBaseUrl = (): string => {
  // 首先尝试从URL参数中获取
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    const modelConfigUrl = urlParams.get('modelConfigUrl');
    if (modelConfigUrl) {
      return modelConfigUrl;
    }
  }
  
  // 然后尝试从环境变量中获取
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


// 获取工具列表
export async function getTools(): Promise<ApiResponse<Record<string, Record<string, string>>>> {
  try {
    const response = await fetch(`${getBaseUrl()}/get_tools`, {
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

// 设置启用的工具组
export async function setEnabledToolsSet(tools: string[]): Promise<ApiResponse<{ message: string }>> {
  try {
    const response = await fetch(`${getBaseUrl()}/set_enabled_tools_set`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tools),
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

// 获取启用的工具组
export async function getEnabledToolsSet(): Promise<ApiResponse<{ enabled_tools_set: string[] }>> {
  try {
    const response = await fetch(`${getBaseUrl()}/get_enabled_tools_set`, {
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

// 设置自动选择模式是否开启
export async function setAutoToolsSelectionMode(enabled: boolean): Promise<ApiResponse<{ message: string }>> {
  try {
    // FastAPI 对简单类型参数默认走 query，所以这里用 query 传递
    const response = await fetch(`${getBaseUrl()}/set_auto_tools_selection_mode?enabled=${encodeURIComponent(String(enabled))}`, {
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

// 获取自动选择模式是否开启
export async function getAutoToolsSelectionMode(): Promise<ApiResponse<{ selection_mode: boolean }>> {
  try {
    const response = await fetch(`${getBaseUrl()}/get_auto_tools_selection_mode`, {
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
    const selectionMode = typeof data.tool_auto_select === 'boolean'
      ? data.tool_auto_select
      : typeof data.selection_mode === 'boolean'
        ? data.selection_mode
        : false;
    return { data: { selection_mode: selectionMode } };
  } catch (error) {
    return {
      error: 'Network error',
      details: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}




'use client';

import React, { useState } from 'react';
import { ModelConfig, getModelConfig, setModelConfig } from '@/lib/model-config-api';

interface ModelConfigManagerProps {
  className?: string;
}

export default function ModelConfigManager({ className }: ModelConfigManagerProps) {
  const [models, setModels] = useState<ModelConfig[]>([
    {
      name: 'gpt-4',
      id: 'gpt-4',
      url: 'https://api.openai.com/v1',
      api_key: ''
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // 添加新模型配置
  const addModel = () => {
    setModels([...models, {
      name: '',
      id: '',
      url: '',
      api_key: ''
    }]);
  };

  // 删除模型配置
  const removeModel = (index: number) => {
    setModels(models.filter((_, i) => i !== index));
  };

  // 更新模型配置
  const updateModel = (index: number, field: keyof ModelConfig, value: string) => {
    const updatedModels = [...models];
    updatedModels[index] = { ...updatedModels[index], [field]: value };
    setModels(updatedModels);
  };

  // 获取模型配置
  const handleGetConfig = async () => {
    setLoading(true);
    setMessage(null);
    
    try {
      const result = await getModelConfig(models);
      if (result.error) {
        setMessage({ type: 'error', text: `获取配置失败: ${result.error}` });
      } else if (result.data) {
        setModels(result.data);
        setMessage({ type: 'success', text: '配置获取成功！' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请检查 FastAPI 服务是否运行在 localhost:1013' });
    } finally {
      setLoading(false);
    }
  };

  // 保存模型配置
  const handleSaveConfig = async () => {
    setLoading(true);
    setMessage(null);
    
    // 验证必填字段
    const invalidModels = models.filter(m => !m.name || !m.id || !m.url || !m.api_key);
    if (invalidModels.length > 0) {
      setMessage({ type: 'error', text: '请填写所有必填字段' });
      setLoading(false);
      return;
    }
    
    try {
      const result = await setModelConfig(models);
      if (result.error) {
        setMessage({ type: 'error', text: `保存配置失败: ${result.error}` });
      } else {
        setMessage({ type: 'success', text: '配置保存成功！' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请检查 FastAPI 服务是否运行在 localhost:1013' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-6 max-w-4xl mx-auto ${className}`}>
      <h2 className="text-2xl font-bold mb-6">模型配置管理</h2>
      
      {/* 消息提示 */}
      {message && (
        <div className={`mb-4 p-3 rounded ${
          message.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : 'bg-red-100 text-red-700 border border-red-300'
        }`}>
          {message.text}
        </div>
      )}

      {/* 模型配置列表 */}
      <div className="space-y-4 mb-6">
        {models.map((model, index) => (
          <div key={index} className="border border-gray-300 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  模型名称 *
                </label>
                <input
                  type="text"
                  value={model.name}
                  onChange={(e) => updateModel(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: gpt-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  模型 ID *
                </label>
                <input
                  type="text"
                  value={model.id}
                  onChange={(e) => updateModel(index, 'id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: gpt-4"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API URL *
                </label>
                <input
                  type="text"
                  value={model.url}
                  onChange={(e) => updateModel(index, 'url', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如: https://api.openai.com/v1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  API Key *
                </label>
                <input
                  type="password"
                  value={model.api_key}
                  onChange={(e) => updateModel(index, 'api_key', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="输入 API Key"
                />
              </div>
            </div>
            <button
              onClick={() => removeModel(index)}
              className="mt-3 px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              删除此模型
            </button>
          </div>
        ))}
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={addModel}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          添加模型
        </button>
        <button
          onClick={handleGetConfig}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
        >
          {loading ? '获取中...' : '获取配置'}
        </button>
        <button
          onClick={handleSaveConfig}
          disabled={loading}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        >
          {loading ? '保存中...' : '保存配置'}
        </button>
      </div>

      {/* 使用说明 */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">使用说明</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>获取配置</strong>：从本地获取已保存的配置，如果本地没有则保存当前输入的配置</li>
          <li>• <strong>保存配置</strong>：将当前配置保存到本地</li>
          <li>• 确保 FastAPI 服务运行在 localhost:1013</li>
          <li>• 所有字段都是必填的</li>
        </ul>
      </div>
    </div>
  );
}
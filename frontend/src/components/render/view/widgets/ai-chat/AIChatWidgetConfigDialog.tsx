/**
 * AI Chat Widget Configuration Dialog - Simplified UX
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AIChatWidgetConfig } from '@/types/widgetTypes';
import { aiService } from '@/services';
import type { AIModel } from '@/services';
import type { AIProvider } from '@/services/aiService';
import { RootState } from '@/store';
import { EntityType } from '@/models/Entity';
import { createEntity } from '@/store/slices/entitySlice';
import { AppDispatch } from '@/store';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Bot, Loader2, Plus } from 'lucide-react';
import Dropdown from '@/components/common/Dropdown';

interface AIChatWidgetConfigDialogProps {
  widget: AIChatWidgetConfig;
  onSave: (config: AIChatWidgetConfig['config']) => void;
  onCancel: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}


const AIChatWidgetConfigDialog = ({
  widget,
  onSave,
  onCancel,
  isOpen = true,
  onClose,
}: AIChatWidgetConfigDialogProps) => {
  const [config, setConfig] = useState(widget.config);
  const [availableProviders, setAvailableProviders] = useState<AIProvider[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [aiStatus, setAIStatus] = useState<{ available: boolean; error?: string }>({ available: true });
  const [isCreatingChatHistory, setIsCreatingChatHistory] = useState(false);

  // Redux hooks
  const dispatch = useDispatch<AppDispatch>();
  const allEntities = useSelector((state: RootState) => state.entities.allEntities);

  // Get available chat history entities
  const chatHistoryEntities = Object.values(allEntities).filter(
    entity => entity.type === EntityType.AI_CHAT_HISTORY
  );

  // Load available providers when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadProviders();
      checkAIStatus();
    }
  }, [isOpen]);

  const checkAIStatus = async () => {
    try {
      const status = await aiService.getStatus(config.provider);
      setAIStatus({
        available: status.provider_available,
        error: status.provider_available ? undefined : `AI provider ${status.provider} is not available`
      });
    } catch (error) {
      setAIStatus({
        available: false,
        error: 'Failed to check AI service status'
      });
    }
  };

  const loadProviders = async () => {
    setIsLoadingProviders(true);
    try {
      const response = await aiService.listProviders();
      if (response.success) {
        setAvailableProviders(response.providers);

        // If no provider is selected, select the first available one
        if (!config.provider && response.providers.length > 0) {
          const firstAvailable = response.providers.find(p => p.available);
          if (firstAvailable) {
            updateConfig({ provider: firstAvailable.name });
          }
        }
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  // Since we load models for a specific provider, availableModels already contains
  // only the models for the current provider - no need to filter again
  const currentProviderModels = config.provider ? availableProviders.find(p => p.name === config.provider)?.models || [] : [];

  const handleSave = () => {
    onSave(config);
    if (onClose) onClose();
  };

  const handleCancel = () => {
    setConfig(widget.config);
    onCancel();
    if (onClose) onClose();
  };

  const updateConfig = (updates: Partial<typeof config>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Create new chat history entity
  const createNewChatHistory = async () => {
    setIsCreatingChatHistory(true);
    try {
      const result = await dispatch(createEntity({
        title: `AI Chat - ${new Date().toLocaleDateString()}`,
        content: JSON.stringify([]),
        parent: null,
        type: EntityType.AI_CHAT_HISTORY
      }));

      if (createEntity.fulfilled.match(result)) {
        updateConfig({ chatHistoryEntityId: result.payload.newNoteData.id });
      }
    } catch (error) {
      console.error('Failed to create chat history entity:', error);
    } finally {
      setIsCreatingChatHistory(false);
    }
  };

  // Prepare provider options for dropdown
  const providerOptions = availableProviders.map(provider => ({
    value: provider.name,
    label: provider.display_name,
    description: provider.available ? `${provider.models.length} models available` : 'Not available',
    disabled: !provider.available
  }));

  // Prepare model options for dropdown
  const modelOptions = currentProviderModels.map(model => ({
    value: model,
    label: model
  }));



  // Chat history options
  const chatHistoryOptions = [
    { value: '', label: 'Create New Chat', description: 'Start a fresh conversation' },
    ...chatHistoryEntities.map(entity => ({
      value: entity.id,
      label: entity.title,
      description: `Created ${new Date(entity.created_at).toLocaleDateString()}`
    }))
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose || onCancel}>
      <DialogContent className="max-w-lg theme-explorer-background theme-explorer-item-text">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI Chat Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Service Status */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">AI Agent Status</span>
              {aiStatus.available ? (
                <Badge variant="default" className="text-xs">Connected</Badge>
              ) : (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkAIStatus}
              disabled={isLoadingProviders || isLoadingModels}
              className="text-xs"
            >
              {(isLoadingProviders || isLoadingModels) ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Refresh'}
            </Button>
          </div>

          {aiStatus.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{aiStatus.error}</p>
            </div>
          )}

          {/* Essential Settings Only */}
          <div className="space-y-4">
            {/* Chat History Selection */}
            <div className="space-y-2">
              <Label>Chat History</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Dropdown
                    value={config.chatHistoryEntityId || ''}
                    options={chatHistoryOptions}
                    onChange={(value) => {
                      if (value === '') {
                        createNewChatHistory();
                      } else {
                        updateConfig({ chatHistoryEntityId: value });
                      }
                    }}
                    placeholder="Select or create chat history"
                    disabled={isCreatingChatHistory}
                  />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={createNewChatHistory}
                  disabled={isCreatingChatHistory}
                  className="px-3"
                >
                  {isCreatingChatHistory ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Provider Selection */}
            <div className="space-y-2">
              <Label>AI Provider</Label>
              <Dropdown
                value={config.provider || ''}
                options={providerOptions}
                onChange={(value) => {
                  updateConfig({ provider: value });
                  // Clear current model when provider changes - it will be set after models load
                  updateConfig({ model: '' });
                }}
                placeholder={isLoadingProviders ? "Loading providers..." : "Select a provider"}
                disabled={!aiStatus.available || isLoadingProviders}
              />
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label>AI Model</Label>
              <Dropdown
                value={config.model}
                options={modelOptions}
                onChange={(value) => updateConfig({ model: value })}
                placeholder={isLoadingModels ? "Loading models..." : "Select a model"}
                disabled={!aiStatus.available || isLoadingModels || !config.provider}
              />
              {config.provider && modelOptions.length === 0 && (
                <p className="text-xs text-gray-500">No models available for {config.provider}</p>
              )}
            </div>



            {/* Creativity Level */}
            <div className="space-y-2">
              <Label>
                Creativity Level: {config.temperature}
              </Label>
              <Slider
                value={[config.temperature]}
                onValueChange={([value]) => updateConfig({ temperature: value })}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Focused (0.0)</span>
                <span>Balanced (0.5)</span>
                <span>Creative (1.0)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!aiStatus.available}>
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AIChatWidgetConfigDialog;
